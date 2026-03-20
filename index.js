require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("panel"));

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autorizado" });
    }

    const token = authHeader.split(" ")[1];

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, business_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: "Perfil no encontrado" });
    }

    req.user = user;
    req.profile = profile;
    req.businessId = profile.business_id;

    next();
  } catch (error) {
    console.error("❌ Error en requireAuth:", error);
    return res.status(500).json({ error: "Error interno de autenticación" });
  }
}

app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "tubotmx_token_123";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado por Meta");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = message.text?.body || "";
    const phoneNumberId = changes?.metadata?.phone_number_id;

    console.log("📩 WhatsApp IN:", from, text);
    console.log("📱 phone_number_id:", phoneNumberId);

    const business = await getBusiness(phoneNumberId);

    if (!business) {
      console.log("❌ Negocio no registrado en Supabase");
      return res.sendStatus(200);
    }


const customer = await getOrCreateCustomer(business.id, from);

const state = getClientState(`${business.id}:${from}`);
state.perfil = state.perfil || {};
state.perfil = extractPerfil(state.perfil, text);

// NUEVO: detectar producto del catálogo
const products = await getBusinessProducts(business.id);
const detectedProduct = findProductFromText(products, text);

if (detectedProduct) {
  state.perfil.producto = detectedProduct.name;
}


    await saveMessage(business.id, customer.id, "user", text);

    if (state.perfil.confirmado) {
      console.log("✅ Detecté confirmación de pedido");
      console.log("🧾 Perfil actual:", state.perfil);

      const pedido = await saveOrder(
        business.id,
        customer.id,
        state.perfil
      );

      if (pedido) {
        const respuestaConfirmacion = `✅ Pedido registrado correctamente.

Producto: ${state.perfil.producto || "No especificado"}
Cantidad: ${state.perfil.cantidad || 1}

En breve te contactaremos para continuar con el pedido.`;

        await saveMessage(
          business.id,
          customer.id,
          "assistant",
          respuestaConfirmacion
        );

        await enviarWhatsApp(from, respuestaConfirmacion, business);
        return res.sendStatus(200);
      }
    }

const textLower = text.toLowerCase().trim();

const wantsCatalog =
  textLower === "catalogo" ||
  textLower === "catálogo" ||
  textLower.includes("ver catalogo") ||
  textLower.includes("ver catálogo") ||
  textLower.includes("productos") ||
  textLower.includes("que vendes") ||
  textLower.includes("qué vendes") ||
  textLower.includes("menu") ||
  textLower.includes("menú");

if (wantsCatalog) {
  const products = await getBusinessProducts(business.id);
  const catalogMessage = buildCatalogMessage(products);

  await saveMessage(
    business.id,
    customer.id,
    "assistant",
    catalogMessage
  );

  
  await enviarWhatsApp(from, catalogMessage, business);
  return res.sendStatus(200);
}
    const respuesta = await procesarMensaje(from, text, business.prompt);

    console.log("🤖 WhatsApp OUT:", respuesta);

    await saveMessage(
      business.id,
      customer.id,
      "assistant",
      respuesta
    );

    await enviarWhatsApp(from, respuesta, business);
    res.sendStatus(200);
  } catch (e) {
    console.error("❌ Error en webhook:", e?.response?.data || e);
    res.sendStatus(200);
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const memory = {};

async function getBusiness(phoneNumberId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .single();

  if (error) {
    console.log("Negocio no encontrado");
    return null;
  }

  return data;
}

async function getOrCreateCustomer(businessId, whatsapp) {
  const { data: existing } = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", businessId)
    .eq("whatsapp", whatsapp)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      whatsapp: whatsapp
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error creando customer:", error);
    return null;
  }

  return data;
}

async function saveMessage(businessId, customerId, role, content) {
  await supabase
    .from("messages")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      role,
      content
    });
}

async function calcularTotal(businessId, perfil) {
  const shippingCost = 120;

  const precioProducto = await getProductPrice(
    businessId,
    perfil.producto
  );

  if (!precioProducto) {
    return {
      subtotal: 0,
      shippingCost,
      total: shippingCost
    };
  }

  const cantidad = Number(perfil.cantidad || 1);
  const subtotal = precioProducto * cantidad;
  const total = subtotal + shippingCost;

  return {
    subtotal,
    shippingCost,
    total
  };
}

async function getProductPrice(businessId, productName) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .ilike("name", `%${productName}%`)
    .eq("active", true)
    .limit(1)
    .single();

  if (error || !data) {
    console.log("⚠️ Producto no encontrado en catálogo");
    return null;
  }

  return data.price;
}


// NUEVO: obtener catálogo completo
async function getBusinessProducts(businessId) {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, active")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error obteniendo catálogo:", error);
    return [];
  }

  return data || [];
}


function buildCatalogMessage(products) {
  if (!products.length) {
    return "Por ahora no tenemos productos disponibles en el catálogo.";
  }

  const lines = products.map((p, index) => {
    return `${index + 1}️⃣ ${p.name} — $${Number(p.price || 0).toFixed(2)} MXN`;
  });

  return `Estos son nuestros productos disponibles:\n\n${lines.join("\n")}\n\nEscríbeme cuál te interesa y te ayudo con tu pedido.`;
}




// NUEVO: detectar producto en el texto del cliente
function findProductFromText(products, text) {
  const t = text.toLowerCase();

  for (const product of products) {
    const productName = String(product.name || "").toLowerCase();

    if (!productName) continue;

    if (t.includes(productName)) {
      return product;
    }

    const words = productName.split(" ").filter(Boolean);

    const matches = words.filter(word =>
      word.length > 2 && t.includes(word)
    );

    if (matches.length >= Math.min(2, words.length)) {
      return product;
    }
  }

  return null;
}

async function saveOrder(businessId, customerId, perfil) {
  console.log("📦 Intentando guardar pedido con perfil:", perfil);

  const { shippingCost, total } = await calcularTotal(businessId, perfil);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      product: perfil.producto || null,
      quantity: Number(perfil.cantidad || 1),
      full_name: perfil.nombre || null,
      address: perfil.direccion || null,
      payment_method: perfil.pago || null,
      color: perfil.color || null,
      city: perfil.ciudad || null,
      shipping_cost: shippingCost,
      total: total,
      status: "pending"
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Error guardando pedido:", error);
    return null;
  }

  console.log("✅ Pedido guardado:", data);
  return data;
}

const PERFIL_NEGOCIO = `
Eres el asistente de atención al cliente de una tienda en línea en México llamada "Mi Tienda".
Tu trabajo es ayudar a los clientes a comprar.

Información del negocio:
- Envíos: $120 a todo México, 2–3 días hábiles.
- Pagos: tarjeta de crédito/débito y transferencia.
- Horario de atención humana: Lunes a Viernes 9am–6pm.
- Productos: electrónicos y accesorios para celular.

Reglas:
- Responde claro y corto.
- Si preguntan por envío, pide la ciudad.
- Si preguntan por precios, pide qué producto buscan.
- Siempre ofrece el siguiente paso para comprar.

Cierre de venta:
- Si el cliente muestra intención (pregunta envío/precio/stock), pide: producto, color/variante, cantidad.
- Después pide: nombre completo y dirección (calle, número, colonia, CP, ciudad, estado).
- Confirma el resumen del pedido antes de finalizar.
- Si el cliente no sabe qué elegir, recomienda 2 opciones.

Anti-loop:
- No repitas preguntas ya respondidas por el cliente.
- Si el cliente ya dio color y cantidad, pasa al siguiente paso: nombre y dirección.
- Si falta solo 1 dato, pregunta solo ese dato.

Plantilla para cerrar:
1) Confirmar pedido: producto + color + cantidad + ciudad.
2) Pedir nombre completo.
3) Pedir dirección completa (calle, número, colonia, CP, ciudad, estado).
4) Confirmar total + método de pago.

Cierre obligatorio:
- Cuando ya tengas producto + color + cantidad + ciudad, pide inmediatamente:
  1) Nombre completo
  2) Dirección completa (calle, número, colonia, CP, ciudad, estado)
  3) Método de pago (tarjeta o transferencia)
- No vuelvas a preguntar por producto/ciudad si ya están en los datos conocidos.

Cierre obligatorio (sin excepciones):
- Si ya tienes ciudad + producto + color + cantidad (aunque sea por "Datos conocidos del cliente"), entonces NO preguntes más por ciudad/producto.
- En ese caso, pide inmediatamente:
  1) Nombre completo
  2) Dirección completa (calle, número, colonia, CP, ciudad, estado)
  3) Método de pago (tarjeta o transferencia)
- Responde en formato de lista corta.
`;

function getClientState(clienteId) {
  if (!memory[clienteId]) memory[clienteId] = { history: [] };
  return memory[clienteId];
}

function extractPerfil(perfil, texto) {
  const t = texto.toLowerCase();

  if (t.includes("monterrey")) perfil.ciudad = "Monterrey";
  if (t.includes("veracruz")) perfil.ciudad = "Veracruz";

  if (t.includes("negra")) perfil.color = "Negra";
  if (t.includes("blanca")) perfil.color = "Blanca";

  const matchCantidad = t.match(/(\d+)\s*(pieza|piezas|unidad|unidades)/);
  if (matchCantidad) perfil.cantidad = matchCantidad[1];

  if (t.includes("tarjeta")) perfil.pago = "Tarjeta";
  if (t.includes("transferencia")) perfil.pago = "Transferencia";

  if (
    t.includes("calle") ||
    t.includes("col.") ||
    t.includes("colonia") ||
    t.includes("cp") ||
    t.includes("c.p.")
  ) {
    perfil.direccion = texto.trim();
  }

  if (
    t.includes("confirmo") ||
    t.includes("confirmar") ||
    t.includes("sí confirmo") ||
    t.includes("si confirmo")
  ) {
    perfil.confirmado = true;
  }

  if (!perfil.nombre) {
    const contieneNumero = /\d/.test(texto);

    const palabrasBloqueadas = [
      "iphone",
      "funda",
      "pieza",
      "piezas",
      "unidad",
      "unidades",
      "tarjeta",
      "transferencia",
      "calle",
      "col",
      "colonia",
      "cp",
      "veracruz",
      "monterrey",
      "confirmo"
    ];

    const contieneBloqueada = palabrasBloqueadas.some(p => t.includes(p));

    if (!contieneNumero && !contieneBloqueada) {
      const palabras = texto.trim().split(" ");

      if (palabras.length >= 2 && palabras.length <= 4) {
        perfil.nombre = texto.trim();
      }
    }
  }

  return perfil;
}

app.post("/mensaje", async (req, res) => {
  const clienteId = req.body.clienteId || "demo";
  const mensaje = req.body.mensaje;

  if (!mensaje) {
    return res.status(400).json({ error: "Falta 'mensaje' en el body" });
  }

  try {
    const respuesta = await procesarMensaje(clienteId, mensaje, PERFIL_NEGOCIO);
    res.json({ clienteId, respuesta });
  } catch (error) {
    console.log("=== ERROR OPENAI ===");
    console.log("message:", error?.message);
    console.log("status:", error?.status);

    res.status(500).json({
      error: "Error con OpenAI",
      detail: error?.message,
      status: error?.status
    });
  }
});

async function enviarWhatsApp(to, texto, business) {
  const token = business.access_token;
  const phoneNumberId = business.phone_number_id;

  if (!token || !phoneNumberId) {
    throw new Error("Este negocio no tiene access_token o phone_number_id");
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      text: { body: texto }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
}

async function procesarMensaje(clienteId, mensaje, promptNegocio = PERFIL_NEGOCIO) {
  const state = getClientState(clienteId);

  state.perfil = state.perfil || {};
  state.perfil = extractPerfil(state.perfil, mensaje);

  state.history.push({ role: "user", content: mensaje });
  state.history = state.history.slice(-10);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 180,
    messages: [
      { role: "system", content: promptNegocio },
      {
        role: "system",
        content: `Datos conocidos del cliente (no vuelvas a pedirlos si ya existen):
ciudad: ${state.perfil.ciudad || "desconocida"}
producto: ${state.perfil.producto || "desconocido"}
color: ${state.perfil.color || "desconocido"}
cantidad: ${state.perfil.cantidad || "desconocida"}`
      },
      ...state.history
    ]
  });

  const respuesta = completion.choices[0].message.content;

  state.history.push({ role: "assistant", content: respuesta });
  state.history = state.history.slice(-10);

  return respuesta;
}

app.get("/debug/:clienteId", (req, res) => {
  const clienteId = req.params.clienteId;
  res.json(memory[clienteId] || null);
});

app.get("/test", async (req, res) => {
  try {
    const clienteId = req.query.clienteId || "demo";
    const mensaje = req.query.mensaje || "Hola";

    const respuesta = await procesarMensaje(clienteId, mensaje);
    res.json({ clienteId, mensaje, respuesta });
  } catch (error) {
    res.status(500).json({
      error: "Error en /test",
      detail: error?.message
    });
  }
});

app.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email
    },
    profile: req.profile
  });
});

app.get("/orders", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, customers ( whatsapp )`)
      .eq("business_id", req.businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
});

app.get("/customers/:customerId/messages", requireAuth, async (req, res) => {
  try {
    const customerId = req.params.customerId;

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, business_id")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    if (customer.business_id !== req.businessId) {
      return res.status(403).json({ error: "No tienes acceso a este cliente" });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("customer_id", customerId)
      .eq("business_id", req.businessId)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo mensajes" });
  }
});

app.post("/orders/:id/status", requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ["pending", "paid", "shipped", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, business_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (order.business_id !== req.businessId) {
      return res.status(403).json({ error: "No tienes acceso a este pedido" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("business_id", req.businessId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, order: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando estado" });
  }
});

app.get("/products", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("business_id", req.businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
});

app.post("/products", requireAuth, async (req, res) => {
  try {
    const { name, price, active } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        business_id: req.businessId,
        name: String(name).trim(),
        price: Number(price),
        active: active === undefined ? true : !!active
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando producto" });
  }
});

app.put("/products/:id", requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, price, active } = req.body;

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id, business_id")
      .eq("id", productId)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (existing.business_id !== req.businessId) {
      return res.status(403).json({ error: "No tienes acceso a este producto" });
    }

    const payload = {};
    if (name !== undefined) payload.name = String(name).trim();
    if (price !== undefined) payload.price = Number(price);
    if (active !== undefined) payload.active = !!active;

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", productId)
      .eq("business_id", req.businessId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

app.post("/products/:id/toggle", requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("id, business_id, active")
      .eq("id", productId)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    if (existing.business_id !== req.businessId) {
      return res.status(403).json({ error: "No tienes acceso a este producto" });
    }

    const { data, error } = await supabase
      .from("products")
      .update({ active: !existing.active })
      .eq("id", productId)
      .eq("business_id", req.businessId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error cambiando estatus del producto" });
  }
});


const PORT = process.env.PORT || 3000;


app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));