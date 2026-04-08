console.log("🚀 VERSION RENDER CORRECTA d5776d9");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
	
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("panel"));
app.use("/panel", express.static("panel"));
app.use((req, res, next) => {
  console.log("➡️", req.method, req.path);
  next();
});

app.get("/privacy", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Política de Privacidad</title>
    </head>
    <body>
      <h1>Política de Privacidad</h1>
      <p>Este servicio utiliza WhatsApp para responder mensajes de clientes.</p>
      <p>No compartimos información con terceros.</p>
      <p>Los datos se utilizan únicamente para atención al cliente y gestión de pedidos.</p>
      <p>Si tienes dudas, contáctanos.</p>
    </body>
    </html>
  `);
});

app.get("/terms", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Términos del Servicio</title>
    </head>
    <body>
      <h1>Términos del Servicio</h1>
      <p>Este sistema automatiza respuestas en WhatsApp para atención a clientes.</p>
      <p>El uso del servicio es responsabilidad del cliente.</p>
      <p>No garantizamos disponibilidad continua ni ausencia total de errores.</p>
    </body>
    </html>
  `);
});

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
    const VERIFY_TOKEN = "tubotmx_2026"; 
	
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
console.log("📲 WEBHOOK RECIBIDO");
console.log("📲 BODY COMPLETO:", JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const message = changes?.messages?.[0];

if (!message) {
  return res.sendStatus(200);
}

    const from = message.from;
    const text = message.text?.body || "";
    console.log("📩 TEXTO RECIBIDO:", text);

const phoneNumberId = changes?.metadata?.phone_number_id;

// 🔥 IGNORAR EVENTOS DE PRUEBA DE META
if (phoneNumberId !== "1024966857372614") {
  console.log("⚠️ Evento ignorado (no es tu número):", phoneNumberId);
  return res.sendStatus(200);
}

const business = await getBusiness(phoneNumberId);
if (!business) {
  console.log("⚠️ Negocio no encontrado para:", phoneNumberId);
  return res.sendStatus(200);
}

const customer = await getOrCreateCustomer(business.id, from);
if (!customer) return res.sendStatus(200);

await saveMessage(business.id, customer.id, "user", text);

let state = await getCustomerState(business.id, customer.id);
console.log("🧠 STATE CARGADO:", JSON.stringify(state));

if (!state || typeof state !== "object") {
  state = {
    etapa: null,
    perfil: {},
    carrito: []
  };
}

state.perfil = state.perfil || {};
state.perfil = extractPerfil(state.perfil, text);

const textLower = String(text || "").toLowerCase().trim();
console.log("🧪 TEST CONFIRMO BLOQUE:", textLower);

// 🔒 PRIORIDAD: VALIDACIÓN DE NOMBRE (ANTES DE TODO)

if (
  state.productoSeleccionado &&
  !state.perfil.nombre
) {
  state.etapa = "pidiendo_nombre";

  const nombre = String(text || "").trim().replace(/\s+/g, " ");
  console.log("📌 PRIORIDAD NOMBRE:", nombre);
  console.log("📌 esNombreValido:", esNombreValido(nombre));

  if (!esNombreValido(nombre)) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "🙏 Por favor escríbeme tu nombre completo real para continuar.\nEjemplo: Juan Pérez"
    );
    return res.sendStatus(200);
  }

  const nombreValidoIA = await esNombreRealConIA(nombre);

  if (!nombreValidoIA) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "🙏 No pude identificar eso como nombre de persona.\nEscríbeme tu nombre completo, por ejemplo: Juan Pérez"
    );
    return res.sendStatus(200);
  }

  state.perfil.nombre = nombre;
  state.etapa = "pidiendo_ciudad";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `Gracias ${nombre} 🙌 ¿En qué ciudad estás?`
  );
  return res.sendStatus(200);
}

// 1) Catálogo primero
const wantsCatalog =
  !state.etapa && (
    textLower.includes("catalogo") ||
    textLower.includes("catálogo") ||
    textLower.includes("productos") ||
    textLower.includes("qué vendes") ||
    textLower.includes("que vendes") ||
    textLower.includes("qué tienes") ||
    textLower.includes("que tienes") ||
    textLower.includes("menu") ||
    textLower.includes("menú")
  );

if (wantsCatalog) {
  console.log("🔥 Entrando a catálogo");

  const productos = await getBusinessProducts(business.id);

  if (!productos.length) {
    const emptyMessage = "Aún no hay productos disponibles.";
    await replyAndPersist(business, customer, state, from, emptyMessage);
    return res.sendStatus(200);
  }

  for (const producto of productos) {
    console.log("📸 Enviando:", producto.name, producto.image_url);

    if (producto.image_url) {
      await enviarImagenWhatsApp(from, producto, business);
    } else {
      const fallbackText = `${producto.name} — $${Number(producto.price).toFixed(2)} MXN

¿Te interesa? Escríbeme el modelo 👌`;

      await enviarWhatsApp(from, fallbackText, business);
    }
  }

  return res.sendStatus(200);
}

// 3) Etapa: pedir nombre

// 4) Etapa: pedir dirección
if (state.etapa === "pidiendo_direccion") {
  state.perfil.direccion = text.trim();
  state.etapa = "confirmacion";

  const { shippingCost, total } = await calcularTotal(business.id, state.perfil);
  const subtotal = total - shippingCost;

  const resumenMessage = `Perfecto 🙌 Te resumo tu pedido:

• Producto: ${state.perfil.producto || state.productoSeleccionado?.name || "Producto"}
• Nombre: ${state.perfil.nombre || ""}
• Ciudad: ${state.perfil.ciudad || ""}
• Pago: ${state.perfil.pago || ""}
• Dirección: ${state.perfil.direccion || ""}

💰 Subtotal: $${Number(subtotal).toFixed(2)} MXN
🚚 Envío: $${Number(shippingCost).toFixed(2)} MXN
TOTAL: $${Number(total).toFixed(2)} MXN

Si todo está correcto, responde: CONFIRMO`;

  await replyAndPersist(business, customer, state, from, resumenMessage);
  return res.sendStatus(200);
}

// 5) Etapa: pedir ciudad y mostrar resumen
if (state.etapa === "pidiendo_ciudad") {
  state.perfil.ciudad = text.trim();
  state.etapa = "pidiendo_pago";

  const askPaymentMessage = "Perfecto 🙌 ¿Prefieres pagar en efectivo o transferencia?";
  await replyAndPersist(business, customer, state, from, askPaymentMessage);
  return res.sendStatus(200);

}
if (state.etapa === "pidiendo_pago") {
  state.perfil.pago = text.trim();
  state.etapa = "pidiendo_direccion";

  const askAddressMessage = "Excelente 🙌 Ahora necesito tu dirección completa de entrega.";
  await replyAndPersist(business, customer, state, from, askAddressMessage);
  return res.sendStatus(200);
}


// 6) Confirmación final

if (textLower === "confirmo") {

  console.log("✅ CONFIRMO DETECTADO");
  console.log("📍 ETAPA ACTUAL:", state.etapa);
  console.log("🧾 PERFIL:", state.perfil);

  // 🔥 VALIDACIÓN IMPORTANTE
  if (!state.perfil?.nombre || !state.perfil?.direccion) {
    console.log("❌ FALTAN DATOS, NO GUARDA");

    const mensajeError = "Aún faltan datos para completar tu pedido 🙏";

    await replyAndPersist(business, customer, state, from, mensajeError);
    return res.sendStatus(200);
  }

  console.log("💾 GUARDANDO PEDIDO...");

  const orderSaved = await saveOrder(
    business.id,
    customer.id,
    state.perfil
  );

if (!orderSaved) {
  console.log("❌ Producto no disponible");

  const productos = await getBusinessProducts(business.id);

  if (productos.length) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Ese modelo no está disponible 😕\n\nPero tengo otras opciones 🔥 te las muestro 👇"
    );

    for (const producto of productos.slice(0, 3)) {
      await enviarImagenWhatsApp(from, producto, business);
    }

  } else {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Ese producto no está disponible en este momento 😕"
    );
  }

  return res.sendStatus(200);
}

  console.log("✅ PEDIDO GUARDADO:", orderSaved);

  state.etapa = "pedido_finalizado";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    "¡Listo! 🎉 Tu pedido ha sido confirmado."
  );

  return res.sendStatus(200);
}

// 7) Si hay una compra en proceso, NO usar IA
console.log("🧠 PRE-IA STATE:", JSON.stringify(state));

if (state.productoSeleccionado && !state.perfil.nombre) {
  state.etapa = "pidiendo_nombre";

  const nombre = String(text || "").trim().replace(/\s+/g, " ");
  console.log("📌 Texto recibido como nombre:", nombre);
  console.log("📌 esNombreValido:", esNombreValido(nombre));

  if (!esNombreValido(nombre)) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "🙏 Por favor escríbeme tu nombre completo real para continuar.\nEjemplo: Juan Pérez"
    );
    return res.sendStatus(200);
  }

  const nombreValidoIA = await esNombreRealConIA(nombre);
  console.log("📌 esNombreRealConIA:", nombreValidoIA);

  if (!nombreValidoIA) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "🙏 No pude identificar eso como nombre de persona.\nEscríbeme tu nombre completo, por ejemplo: Juan Pérez"
    );
    return res.sendStatus(200);
  }

  state.perfil.nombre = nombre;
  state.etapa = "pidiendo_ciudad";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `Gracias ${nombre} 🙌 ¿En qué ciudad estás?`
  );
  return res.sendStatus(200);
}

if (
  state.etapa &&
  state.etapa !== "confirmacion" &&
  state.etapa !== "pedido_finalizado"
) {
  const mensajeProceso =
    "Sigamos con tu pedido 🙌 Responde el dato que te estoy solicitando para continuar.";

  await replyAndPersist(business, customer, state, from, mensajeProceso);
  return res.sendStatus(200);
}

// 8) Flujo normal con IA solo si NO hay etapa activa

const respuesta = await procesarMensaje(from, text, business.prompt);

// 🔒 Si la IA está pidiendo el nombre, activar etapa manual
const respuestaLower = String(respuesta || "").toLowerCase();

if (
  !state.etapa &&
  !state.perfil.nombre &&
  (
    respuestaLower.includes("cómo te llamas") ||
    respuestaLower.includes("como te llamas") ||
    respuestaLower.includes("tu nombre") ||
    respuestaLower.includes("nombre completo")
  )
) {
  state.etapa = "pidiendo_nombre";
  console.log("🟡 Etapa activada por respuesta IA: pidiendo_nombre");
}

console.log("📤 Enviando respuesta a:", from);
console.log("🤖 WhatsApp OUT:", respuesta);

await saveMessage(
  business.id,
  customer.id,
  "assistant",
  respuesta
);

await enviarWhatsApp(from, respuesta, business);

await saveCustomerState(business.id, customer.id, state);
return res.sendStatus(200);

  } catch (e) {
    console.error("❌ Error en webhook:", e?.response?.data || e);
    return res.sendStatus(200);
  }
});

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
  
// ===============================
// ESTADO DE CLIENTE (PERSISTENTE)
// ===============================

async function getCustomerState(businessId, customerId) {
  const { data, error } = await supabase
    .from("customer_states")
    .select("*")
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error("❌ Error obteniendo customer_state:", error);
    return {
      etapa: null,
      perfil: {},
      productoSeleccionado: null
    };
  }

  if (!data) {
    return {
      etapa: null,
      perfil: {},
      productoSeleccionado: null
    };
  }

  return {
    etapa: data.etapa || null,
    perfil: data.perfil || {},
    productoSeleccionado: data.producto_seleccionado || null
  };
}

async function saveCustomerState(businessId, customerId, state) {
  const payload = {
    business_id: businessId,
    customer_id: customerId,
    etapa: state.etapa || null,
    perfil: state.perfil || {},
    producto_seleccionado: state.productoSeleccionado || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("customer_states")
    .upsert(payload, {
      onConflict: "business_id,customer_id"
    });

  if (error) {
    console.error("❌ Error guardando customer_state:", error);
  }
}

async function replyAndPersist(business, customer, state, to, text) {
  await saveMessage(business.id, customer.id, "assistant", text);
  await saveCustomerState(business.id, customer.id, state);
  await enviarWhatsApp(to, text, business);
}

async function clearCustomerState(businessId, customerId) {
  const { error } = await supabase
    .from("customer_states")
    .delete()
    .eq("business_id", businessId)
    .eq("customer_id", customerId);

  if (error) {
    console.error("❌ Error limpiando customer_state:", error);
  }
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
    .select("id, name, price, image_url, active")
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

const memory = {};

function getClientState(clienteId) {
  if (!memory[clienteId]) {
    memory[clienteId] = {
      history: [],
      perfil: {},
      etapa: null,
      productoSeleccionado: null
    };
  }
  return memory[clienteId];
}

function normalizarTexto(texto = "") {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()	
    .replace(/\s+/g, " ");
}

const PALABRAS_PROHIBIDAS_NOMBRE = new Set([
  "catalogo", "catalogos", "catalog", "catálogo", "catalgo", "catalg",
  "producto", "productos", "precio", "precios", "costo", "costos",
  "hola", "buenas", "bueno", "ok", "va", "sale", "si", "sí",
  "quiero", "pedido", "envio", "envío", "direccion", "dirección",
  "calle", "colonia", "col", "cp", "ciudad", "estado",
  "tarjeta", "transferencia", "efectivo"
]);

function esNombreValido(texto) {
  const limpio = String(texto || "").trim().replace(/\s+/g, " ");
  const normalizado = normalizarTexto(limpio);

  if (!limpio) return false;
  if (limpio.length < 6 || limpio.length > 60) return false;
  if (/\d/.test(limpio)) return false;
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(limpio)) return false;

  const palabras = limpio.split(" ").filter(Boolean);
  const palabrasNormalizadas = normalizado.split(" ").filter(Boolean);

  if (palabras.length < 2 || palabras.length > 4) return false;
  if (palabras.some(p => p.length < 2 || p.length > 20)) return false;
  if (palabrasNormalizadas.some(p => PALABRAS_PROHIBIDAS_NOMBRE.has(p))) return false;

  const sospechosas = [
    "catalog",
    "catalg",
    "precio",
    "producto",
    "transfer",
    "envio",
    "direccion",
    "calle"
  ];

  if (sospechosas.some(s => normalizado.includes(s))) return false;

  return true;
}

async function esNombreRealConIA(texto) {
  const nombre = String(texto || "").trim().replace(/\s+/g, " ");

  if (!esNombreValido(nombre)) return false;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 3,
      messages: [
        {
          role: "system",
          content: `
Responde SOLO con SI o NO.

Tu tarea es decidir si el texto parece un nombre real de persona en español.

ACEPTA:
- Juan Pérez
- María López
- José Manuel Ramírez
- Ana Sofía Torres

RECHAZA:
- catalogo
- catalgo
- hola
- precio
- iphone 13
- samsung
- transferencia
- calle rio bamba 57
- Veracruz
- Quiero el catálogo
- Juan iphone
- Nombre completo

Reglas:
- Debe parecer nombre y apellido de persona.
- No aceptes productos, ciudades, saludos, métodos de pago ni direcciones.
- No aceptes frases comerciales.
- Si tienes duda, responde NO.
          `.trim()
        },
        {
          role: "user",
          content: nombre
        }
      ]
    });

    const respuesta = completion.choices?.[0]?.message?.content?.trim().toUpperCase();
    return respuesta === "SI";
  } catch (error) {
    console.error("❌ Error validando nombre con IA:", error);
    return false;
  }
}

// 👇 tu función existente
function extractPerfil(perfil = {}, texto = "") {
  const t = String(texto || "").toLowerCase();

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

async function enviarImagenWhatsApp(to, producto, business) {
  const token = business.access_token;
  const phoneNumberId = business.phone_number_id;

  if (!token || !phoneNumberId) {
    throw new Error("Falta configuración de WhatsApp");
  }

  if (!producto.image_url) {
    console.log("⚠️ Producto sin imagen:", producto.name);
    return;
  }

  await axios.post(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "image",
  image: {
  link: producto.image_url,
  caption: `📱 ${producto.name}\n💰 $${Number(producto.price).toFixed(2)} MXN`
}
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
    const { name, price, image_url, active } = req.body;

    if (!name || price === undefined || price === null) {
      return res.status(400).json({ error: "Nombre y precio son obligatorios" });
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        business_id: req.businessId,
        name: String(name).trim(),
        price: Number(price),
        image_url: image_url || null,
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
    const { name, price, active, image_url } = req.body;

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
    if (image_url !== undefined) payload.image_url = image_url;

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

console.log("🚀 VERSION NUEVA WEBHOOK 2026-04-04 20:00");

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});