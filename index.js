
console.log("🚀 VERSION CONFIG FIX 2026-04-11 FINAL");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const sharp = require("sharp");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

app.get("/config", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "config.html"));
});

app.get("/config.html", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "config.html"));
});

app.get("/panel/config.html", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "config.html"));
});

app.get("/panel/config.js", (req, res) => {
  res.sendFile(path.join(__dirname, "panel", "config.js"));
});
app.get("/privacy", (req, res) => {

res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Política de Privacidad | Prattz Labs</title>

  <style>
    body{
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin:auto;
      padding:40px;
      line-height:1.7;
      background:#f8fafc;
      color:#111827;
    }

    h1,h2{
      color:#0f172a;
    }

    .card{
      background:white;
      padding:40px;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,.08);
    }
  </style>
</head>

<body>

<div class="card">

<h1>Política de Privacidad</h1>

<p><strong>Última actualización:</strong> 18 de mayo de 2026</p>

<p>
Prattz Labs respeta la privacidad de sus usuarios y clientes.
Esta política describe cómo recopilamos, utilizamos y protegemos
la información utilizada dentro de nuestros servicios.
</p>

<h2>Información que recopilamos</h2>

<ul>
  <li>Nombre</li>
  <li>Número telefónico</li>
  <li>Mensajes enviados mediante WhatsApp</li>
  <li>Información de pedidos y clientes</li>
  <li>Información básica del dispositivo y navegador</li>
</ul>

<h2>Uso de la información</h2>

<p>
Utilizamos la información para operar nuestros bots automatizados,
mejorar la experiencia del usuario, gestionar pedidos y brindar soporte técnico.
</p>

<h2>Servicios de terceros</h2>

<p>
Nuestra plataforma puede utilizar servicios externos como:
</p>

<ul>
  <li>WhatsApp Business Platform</li>
  <li>Meta Platforms</li>
  <li>OpenAI</li>
  <li>Supabase</li>
</ul>

<h2>Protección de datos</h2>

<p>
Implementamos medidas razonables de seguridad para proteger la información
contra accesos no autorizados o alteraciones.
</p>

<h2>Contacto</h2>

<p>
Si tienes preguntas relacionadas con esta política puedes contactarnos en:
</p>

<p>
contacto@prattzlabs.com
</p>

</div>

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
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Términos y Condiciones | Prattz Labs</title>

  <style>
    body{
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin:auto;
      padding:40px;
      line-height:1.7;
      background:#f8fafc;
      color:#111827;
    }

    h1,h2{
      color:#0f172a;
    }

    .card{
      background:white;
      padding:40px;
      border-radius:12px;
      box-shadow:0 2px 10px rgba(0,0,0,.08);
    }
  </style>
</head>

<body>

<div class="card">

<h1>Términos y Condiciones</h1>

<p><strong>Última actualización:</strong> 18 de mayo de 2026</p>

<p>
Bienvenido a Prattz Labs. Al utilizar nuestros servicios,
aceptas los siguientes términos y condiciones.
</p>

<h2>Uso del servicio</h2>

<p>
Nuestra plataforma proporciona herramientas de automatización,
bots conversacionales y servicios relacionados con WhatsApp Business.
</p>

<p>
El usuario es responsable del uso adecuado del sistema y del contenido
enviado mediante la plataforma.
</p>

<h2>Disponibilidad</h2>

<p>
Aunque buscamos ofrecer un servicio estable y continuo,
no garantizamos disponibilidad ininterrumpida ni ausencia total de errores.
</p>

<h2>Responsabilidad del usuario</h2>

<p>
El cliente es responsable de:
</p>

<ul>
  <li>La información enviada mediante el sistema</li>
  <li>El cumplimiento de políticas de Meta y WhatsApp</li>
  <li>El uso legal de la plataforma</li>
</ul>

<h2>Limitación de responsabilidad</h2>

<p>
Prattz Labs no será responsable por pérdidas indirectas,
interrupciones de servicio, bloqueos de cuentas externas
o daños derivados del uso de plataformas de terceros.
</p>

<h2>Modificaciones</h2>

<p>
Podemos actualizar estos términos en cualquier momento sin previo aviso.
</p>

<h2>Contacto</h2>

<p>
Para dudas o soporte puedes contactarnos en:
</p>

<p>
contacto@prattzlabs.com
</p>

</div>

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

// 🔒 CONTROL DE SUSCRIPCIÓN
if (!business.active) {
  console.log("⛔ Negocio inactivo:", business.name);

  try {
    await enviarWhatsApp(
      from,
      "Tu servicio está temporalmente suspendido. Contacta soporte para reactivarlo 🙏",
      business
    );
    console.log("📤 Mensaje de suspensión enviado");
  } catch (err) {
    console.error("❌ Error enviando mensaje de suspensión:", err?.response?.data || err);
  }

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
        carrito: [],
        productoSeleccionado: null
      };
    }

    state.perfil = state.perfil || {};
    state.perfil = extractPerfil(state.perfil, text);

    const textLower = String(text || "").toLowerCase().trim();
    console.log("🧪 TEST CONFIRMO BLOQUE:", textLower);

// 📂 Selección de categoría
if (
  state.etapa === "seleccionando_categoria" &&
  state.categoriasActuales &&
  ["1","2","3","4","5","6","7","8","9"].includes(text.trim())
) {

  const index = Number(text.trim()) - 1;

  const categoria =
    state.categoriasActuales[index];

  if (categoria) {

    console.log(
      "📂 Categoría seleccionada:",
      categoria
    );

    const products =
      await getBusinessProducts(business.id);

    const disponibles = products.filter(
      p =>
        Number(p.stock || 0) > 0 &&
        normalizeText(
          p.category || "general"
        ) === categoria
    );

    state.catalogoActual =
      disponibles.slice(0, 6);


// 🧹 Limpiar producto anterior
state.productoSeleccionado = null;
state.perfil.producto = null;
state.perfil.product_id = null;

    state.etapa = null;

    await saveCustomerState(
      business.id,
      customer.id,
      state
    );

    const opcionesTexto =
      state.catalogoActual
        .map(
          (p, i) =>
            `${i + 1}️⃣ ${p.name}`
        )
        .join("\n");

    await replyAndPersist(
  business,
  customer,
  state,
  from,
  `📱 Encontré estos productos en ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}:

${opcionesTexto}

👉 Responde con el número del producto que te interesa.`
);

    const catalogoUrl =
      await generarImagenCatalogo(
        state.catalogoActual
      );

    if (catalogoUrl) {

      await axios.post(
        `https://graph.facebook.com/v23.0/${business.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          type: "image",
          image: {
            link: catalogoUrl,
            caption: `📱 ${categoria}`
          }
        },
        {
          headers: {
            Authorization:
              `Bearer ${business.access_token}`,
            "Content-Type":
              "application/json"
          }
        }
      );
    }

    return res.sendStatus(200);
  }
}


// 🔢 Selección directa desde catálogo
if (
  state.catalogoActual &&
  Array.isArray(state.catalogoActual) &&
  ["1", "2", "3", "4", "5", "6"].includes(text.trim())
) {

  const index = Number(text.trim()) - 1;

  const producto =
    state.catalogoActual[index];

  if (producto) {

    console.log(
      "🎯 Producto seleccionado por número:",
      producto.name
    );

    state.productoSeleccionado = producto;
    state.perfil.producto = producto.name;
    state.perfil.product_id = producto.id;

    state.etapa = "pidiendo_nombre";

    await saveCustomerState(
      business.id,
      customer.id,
      state
    );

    await replyAndPersist(
      business,
      customer,
      state,
      from,
      `Excelente elección 🙌

📱 ${producto.name}
💰 $${Number(producto.price || 0).toFixed(2)} MXN

Por favor escribe tu nombre completo.`
    );

    return res.sendStatus(200);
  }
}

if (
  textLower === "reset" ||
  textLower === "reiniciar" ||
  textLower === "cancelar" ||
  textLower === "empezar de nuevo"
) {
  await clearCustomerState(business.id, customer.id);

  await replyAndPersist(
    business,
    customer,
    {
      etapa: null,
      perfil: {},
      carrito: [],
      productoSeleccionado: null
    },
    from,
    "Listo 🔄 reinicié la conversación. ¿Qué producto buscas?"
  );

  return res.sendStatus(200);
}

// 💳 PRIORIDAD: DUDAS DE PAGO (ANTES DE IA)
if (
  !state.etapa &&
  (
    textLower.includes("transferencia") ||
    textLower.includes("tarjeta") ||
    textLower.includes("pagar") ||
    textLower.includes("pago") ||
    textLower.includes("como pago") ||
    textLower.includes("cómo pago")
  )
) {
  // 🔒 NO saltar datos obligatorios
  if (!state.perfil.nombre) {
    state.etapa = "pidiendo_nombre";

    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Perfecto 👌 antes de continuar, ¿me das tu nombre completo?"
    );

    return res.sendStatus(200);
  }

  if (!state.perfil.ciudad) {
    state.etapa = "pidiendo_ciudad";

    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Perfecto 👌 ¿en qué ciudad estás?"
    );

    return res.sendStatus(200);
  }

  const metodosPago = business.payment_methods || "transferencia y tarjeta";

  const mensajePago = `Sí 👌 aceptamos ${metodosPago}. ¿Me compartes tu dirección completa para avanzarte el pedido?`;

  state.etapa = "pidiendo_direccion";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    mensajePago
  );

  return res.sendStatus(200);
}

// 🔄 Si el pedido anterior ya terminó y el cliente quiere volver a empezar
if (
  state.etapa === "pedido_finalizado" &&
  (
    textLower.includes("catalogo") ||
    textLower.includes("catálogo") ||
    textLower.includes("productos") ||
    textLower.includes("quiero comprar") ||
    textLower.includes("comprar")
  )
) {
  state = getEmptyState();
  console.log("🧹 Estado reiniciado para nueva compra");
}


const wantsOptions =
  textLower.includes("opciones") ||
  textLower.includes("que opciones") ||
  textLower.includes("qué opciones") ||
  textLower.includes("que tienes para") ||
  textLower.includes("qué tienes para") ||
  textLower.includes("muestrame") ||
  textLower.includes("muéstrame");

const wantsCatalog =
  textLower.includes("catalogo") ||
  textLower.includes("catálogo") ||
  textLower.includes("catalog") ||
  textLower.includes("catálog") ||
  textLower.includes("catalago") ||
  textLower.includes("catálago") ||
  textLower.includes("productos") ||
  textLower.includes("que vendes") ||
  textLower.includes("qué vendes") ||
  textLower.includes("que manejas") ||
  textLower.includes("qué manejas") ||
  textLower.includes("que tienes") ||
  textLower.includes("qué tienes") ||
  textLower.includes("muestrame todo") ||
  textLower.includes("muéstrame todo") ||
  textLower.includes("menu") ||
  textLower.includes("menú");

if (wantsCatalog && !wantsOptions) {
  const products = await getBusinessProducts(business.id);
  const disponibles = products.filter(p => Number(p.stock || 0) > 0);

  if (!disponibles.length) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Por ahora no tengo productos disponibles 😕"
    );
    return res.sendStatus(200);
  }

  const categorias = [
  ...new Set(
    disponibles
      .map(p => normalizeText(p.category || ""))
      .filter(cat => cat && cat !== "general")
  )
].sort();

  state.categoriasActuales = categorias;
  state.catalogoActual = [];
  state.etapa = "seleccionando_categoria";

  await saveCustomerState(business.id, customer.id, state);

  const categoriasTexto = categorias
    .map((cat, i) => `${i + 1}️⃣ ${cat}`)
    .join("\n");

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `📂 Estas son nuestras categorías disponibles:

${categoriasTexto}

Responde con el número de la categoría que quieres ver.`
  );

  return res.sendStatus(200);
}
	

if (wantsOptions) {
  const products = await getBusinessProducts(business.id);

  const queryWords = normalizeText(text)
    .split(" ")
    .filter(w =>
  (w.length > 2 || /^\d+$/.test(w)) &&
  !["que", "qué", "tienes", "para", "opciones", "muestrame", "muéstrame"].includes(w)
);

  const matches = products.filter(product => {
    const searchable = normalizeText([
      product.name,
      product.description,
      product.category,
      product.sku
    ].filter(Boolean).join(" "));

    const hasNumber = queryWords.some(w => /^\d+$/.test(w));

if (hasNumber) {
  return queryWords.every(word => searchable.includes(word));
}

return queryWords.some(word => searchable.includes(word));
  });

  const disponibles = matches.filter(p => Number(p.stock || 0) > 0);
  state.catalogoActual = disponibles.slice(0, 6);


console.log(
  "📦 CATÁLOGO GUARDADO:",
  state.catalogoActual.map(p => p.name)
);

await saveCustomerState(business.id, customer.id, state);
 
  if (!disponibles.length) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "Por ahora no encontré opciones disponibles con esa búsqueda 😕 ¿Quieres ver todo el catálogo?"
    );
    return res.sendStatus(200);
  }

 const opcionesTexto = disponibles
  .slice(0, 6)
  .map(
    (p, i) =>
      `${i + 1}️⃣ ${p.name} - $${Number(p.price || 0).toFixed(2)} MXN`
  )
  .join("\n");

await replyAndPersist(
  business,
  customer,
  state,
  from,
  `📱 Encontré estas opciones para tu búsqueda

Responde con:

${opcionesTexto}

✍️ También puedes escribir el nombre del producto.`
);

const catalogoUrl =
  await generarImagenCatalogo(
    disponibles.slice(0, 3)
  );

if (catalogoUrl) {

  await axios.post(
    `https://graph.facebook.com/v23.0/${business.phone_number_id}/messages`,
    {
      messaging_product: "whatsapp",
      to: from,
      type: "image",
      image: {
        link: catalogoUrl,
        caption: "📱 Opciones disponibles"
      }
    },
    {
      headers: {
        Authorization: `Bearer ${business.access_token}`,
        "Content-Type": "application/json"
      }
    }
  );

} else {

  for (const producto of disponibles.slice(0, 3)) {

    if (producto.image_url) {
      await enviarImagenWhatsApp(
        from,
        producto,
        business
      );
    }
  }
}

  return res.sendStatus(200);
}

// 🔥 Detectar producto automáticamente desde texto
let productoDetectado = null;
let productosDetectables = [];

if (
  !state.etapa ||
  state.etapa === "seleccionando_categoria"
) {

  productosDetectables =
    await getBusinessProducts(business.id);

  productoDetectado =
    findProductFromText(
      productosDetectables,
      text
    );

  if (!productoDetectado) {
    console.log("🤖 Buscando producto con IA...");

    productoDetectado =
      await findProductWithAI(
        productosDetectables,
        text
      );
  }
}

// 🛡️ Protección contra mensajes ambiguos
const palabrasProducto = [
  "iphone",
  "samsung",
  "xiaomi",
  "motorola",
  "funda",
  "cargador",
  "mica",
  "audifono",
  "audífono",
  "producto",
  "productos",
  "catalogo",
  "catálogo",
  "catalog",
  "comprar"
];

const pareceBusquedaProducto =
  palabrasProducto.some(p =>
    textLower.includes(p)
  );

// 🛡️ Protección contra detecciones falsas de IA
if (
  productoDetectado &&
  !pareceBusquedaProducto &&
  !wantsCatalog &&
  !wantsOptions &&
  !state.etapa
) {
  console.log(
    "🛡️ Producto ignorado por mensaje ambiguo:",
    productoDetectado.name
  );

  productoDetectado = null;
}

// Si no hay producto y el mensaje es ambiguo
if (
  !productoDetectado &&
  !pareceBusquedaProducto &&
  !wantsCatalog &&
  !wantsOptions &&
  !state.etapa
) {

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `👋 Hola, puedo ayudarte a encontrar productos.

📂 Puedes escribir:
• catálogo
• productos
• funda iPhone 13
• cargador Samsung

¿Qué producto estás buscando?`
  );

  return res.sendStatus(200);
}


if (productoDetectado) {

  if (Number(productoDetectado.stock || 0) <= 0) {
  const alternativas = findAlternativeProducts(
    productosDetectables,
    productoDetectado,
    3
  );

  await replyAndPersist(
    business,
    customer,
    state,
    from,
     `😕 Lo siento, *${productoDetectado.name}* está agotado por el momento.${alternativas.length ? "\n\nPero tengo estas alternativas disponibles 👇" : "\n\n¿Quieres ver otras opciones disponibles?"}`
    );
  

  for (const alt of alternativas) {
    if (alt.image_url) {
      await enviarImagenWhatsApp(from, alt, business);
    } else {
      await enviarWhatsApp(
        from,
        `${alt.name} — $${Number(alt.price || 0).toFixed(2)} MXN`,
        business
      );
    }
  }

  return res.sendStatus(200);
}

  console.log("🧠 Producto detectado:", productoDetectado.name);

  state.productoSeleccionado = productoDetectado;

// 🧹 Iniciar pedido limpio
state.perfil = {
  producto: productoDetectado.name,
  product_id: productoDetectado.id
};

  state.etapa = "pidiendo_nombre";

  await saveCustomerState(
    business.id,
    customer.id,
    state
  );

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `Excelente 🙌 encontré este producto:

📱 ${productoDetectado.name}
💰 $${Number(productoDetectado.price || 0).toFixed(2)} MXN

Por favor escribe tu nombre completo.`
  );

  return res.sendStatus(200);

}


// 🔒 PRIORIDAD: VALIDACIÓN DE NOMBRE (ANTES DE TODO)
if (
  state.etapa === "pidiendo_nombre" ||
  (state.productoSeleccionado && !state.perfil.nombre)
) {
  state.etapa = "pidiendo_nombre";

  const resultadoNombre = await validarNombrePersona(text);

  console.log("📌 PRIORIDAD NOMBRE:", text);
  console.log("📌 resultadoNombre:", resultadoNombre);

  if (!resultadoNombre.ok) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "🙏 Por favor escríbeme tu nombre completo real para continuar.\nEjemplo: Juan Pérez"
    );
    return res.sendStatus(200);
  }

  state.perfil.nombre = resultadoNombre.nombre;
  state.etapa = "pidiendo_ciudad";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    `Gracias ${resultadoNombre.nombre} 🙌 ¿En qué ciudad estás?`
  );
  return res.sendStatus(200);
}

// 4) Etapa: pedir dirección
if (state.etapa === "pidiendo_direccion") {
  state.perfil.direccion = text.trim();
  state.etapa = "confirmacion";


  const { shippingCost, total } = await calcularTotal(business.id, state.perfil, business);
 
  const subtotal = total - shippingCost;

  const resumenMessage = `Perfecto 🙌 Te resumo tu pedido:

• Producto: ${state.productoSeleccionado?.name || state.perfil.producto || "Producto"}
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
  const resultadoCiudad = validarCiudad(text);

  if (!resultadoCiudad.ok) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      `🙏 Por favor escríbeme una ciudad válida.
Ejemplo: Veracruz, Monterrey o Ciudad de México`
    );

    return res.sendStatus(200);
  }

  state.perfil.ciudad = resultadoCiudad.ciudad;
  state.etapa = "pidiendo_pago";

  await saveCustomerState(
    business.id,
    customer.id,
    state
  );

  const askPaymentMessage =
    "Perfecto 🙌 ¿Prefieres pagar con tarjeta o transferencia?";

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    askPaymentMessage
  );

  return res.sendStatus(200);
}


if (state.etapa === "pidiendo_pago") {

  const pago = normalizarTexto(text);

  const pagosValidos = [
  "tarjeta",
  "transferencia"
];

  if (!pagosValidos.includes(pago)) {

    await replyAndPersist(
      business,
      customer,
      state,
      from,
      `🙏 Por favor indica un método de pago válido.

Opciones:
• Tarjeta
• Transferencia
    );

    return res.sendStatus(200);
`
);
  }

  state.perfil.pago =
  pago === "tarjeta"
    ? "Tarjeta"
    : "Transferencia";

  state.etapa = "pidiendo_direccion";

  await saveCustomerState(
    business.id,
    customer.id,
    state
  );

  if (
    business.payment_enabled &&
    business.payment_mode === "link"
  ) {

    const linkPago =
      String(
        business.payment_link_url || ""
      ).trim();

    if (!linkPago) {

      await replyAndPersist(
        business,
        customer,
        state,
        from,
        "Perfecto 👍 tengo registrado tu método de pago. Ahora necesito tu dirección completa de entrega."
      );

      return res.sendStatus(200);
    }

    const mensajePago = `Perfecto 👍 puedes pagar aquí:

👉 ${linkPago}

En cuanto se refleje el pago, procesamos tu pedido 🚀

Después compárteme tu dirección completa de entrega.`;

    await replyAndPersist(
      business,
      customer,
      state,
      from,
      mensajePago
    );

    return res.sendStatus(200);
  }

  await replyAndPersist(
    business,
    customer,
    state,
    from,
    "Perfecto 👍 ahora necesito tu dirección completa de entrega."
  );

  return res.sendStatus(200);
}


    const mensajePago = `Perfecto 👍 puedes pagar aquí:

👉 ${linkPago}

En cuanto se refleje el pago, procesamos tu pedido 🚀

Después compárteme tu dirección completa de entrega.`;

    await replyAndPersist(business, customer, state, from, mensajePago);
    return res.sendStatus(200);
  }

  const askAddressMessage = "Excelente 🙌 Ahora necesito tu dirección completa de entrega.";
  await replyAndPersist(business, customer, state, from, askAddressMessage);
  return res.sendStatus(200);
}

// 🔄 RESET PRIORIDAD MÁXIMA
if (textLower === "reset" || textLower === "reiniciar") {
  await clearCustomerState(business.id, customer.id);

  const newState = getEmptyState();

  await replyAndPersist(
    business,
    customer,
    newState,
    from,
    "Listo 🔄 reinicié la conversación. ¿Qué producto buscas?"
  );

  return res.sendStatus(200);
}


// 6) Confirmación final
if (textLower === "confirmo") {
  console.log("✅ CONFIRMO DETECTADO");
  console.log("📍 ETAPA ACTUAL:", state.etapa);
  console.log("🧾 PERFIL:", state.perfil);

  if (!state.productoSeleccionado) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      "❌ No tengo un producto seleccionado aún."
    );
    return res.sendStatus(200);
  }

  const faltantes = [];
  if (!state.perfil.nombre) faltantes.push("nombre");
  if (!state.perfil.ciudad) faltantes.push("ciudad");
  if (!state.perfil.pago) faltantes.push("pago");
  if (!state.perfil.direccion) faltantes.push("dirección");

  if (faltantes.length > 0) {
    await replyAndPersist(
      business,
      customer,
      state,
      from,
      `❌ Faltan datos: ${faltantes.join(", ")}`
    );
    return res.sendStatus(200);
  }

  console.log("💾 GUARDANDO PEDIDO...");

  const orderSaved = await saveOrder(
    business.id,
    customer.id,
    state.perfil,
    business
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

const cantidadPedido = Number(state.perfil.cantidad || 1);

const productId =
  state.productoSeleccionado?.id ||
  state.perfil.product_id ||
  orderSaved.product_id ||
  orderSaved.productId;

if (productId) {
  const stockResult = await descontarStockProducto(
    productId,
    cantidadPedido
  );

  if (!stockResult.ok) {
    console.log("⚠️ No se pudo descontar stock:", stockResult.error);
  } else {
    console.log("📦 STOCK ACTUALIZADO:", {
      producto: productId,
      cantidad: cantidadPedido,
      anterior: stockResult.stockAnterior,
      nuevo: stockResult.stockNuevo
    });
  }
} else {
  console.log("⚠️ No se encontró productId para descontar stock");
}

  console.log("💳 CONFIG PAGO:", {
  payment_enabled: business.payment_enabled,
  payment_mode: business.payment_mode,
  payment_link_url: business.payment_link_url
});

let mensajeFinal = "¡Listo! 🎉 Tu pedido ha sido confirmado.";

if (business.payment_enabled && business.payment_mode === "link") {
  const linkPago = String(business.payment_link_url || "").trim();

  if (linkPago) {
    mensajeFinal = `¡Listo! 🎉 Tu pedido ha sido confirmado.

Puedes realizar tu pago aquí:

👉 ${linkPago}

Total a pagar: $${Number(orderSaved.total || 0).toFixed(2)} MXN

En cuanto se refleje el pago, procesamos tu pedido 🚀`;
  }
}

await replyAndPersist(
  business,
  customer,
  state,
  from,
  mensajeFinal
);



  await clearCustomerState(business.id, customer.id);
  state = getEmptyState(); // 🔥 reset inmediato en memoria
  await saveCustomerState(business.id, customer.id, state);

  return res.sendStatus(200);
}


// 7) Si hay una compra en proceso, NO usar IA

console.log("🧠 PRE-IA STATE:", JSON.stringify(state));

if (
  state.etapa &&
  state.etapa !== "pedido_finalizado"
) {
  const mensajeProceso =
    state.etapa === "confirmacion"
      ? "Tu pedido ya está listo para confirmar 🙌 Responde CONFIRMO para finalizarlo o escribe RESET para iniciar de nuevo."
      : "Sigamos con tu pedido 🙌 Responde el dato que te estoy solicitando para continuar.";

  await replyAndPersist(business, customer, state, from, mensajeProceso);
  return res.sendStatus(200);
}

// 8) Flujo normal con IA solo si NO hay etapa activa
const respuesta = await procesarMensaje(from, text, business);

const respuestaLower = String(respuesta || "").toLowerCase();

// Si la IA pide nombre y aún no lo tenemos, activar etapa manual
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

// Si la IA pide ciudad y ya tenemos nombre pero no ciudad
if (
  !state.etapa &&
  state.perfil.nombre &&
  !state.perfil.ciudad &&
  (
    respuestaLower.includes("qué ciudad") ||
    respuestaLower.includes("que ciudad") ||
    respuestaLower.includes("en qué ciudad") ||
    respuestaLower.includes("en que ciudad") ||
    respuestaLower.includes("ciudad estás") ||
    respuestaLower.includes("ciudad te encuentras")
  )
) {
  state.etapa = "pidiendo_ciudad";
  console.log("🟡 Etapa activada por respuesta IA: pidiendo_ciudad");
}

// Si la IA pide pago y ya tenemos ciudad pero no pago
if (
  !state.etapa &&
  state.perfil.nombre &&
  state.perfil.ciudad &&
  !state.perfil.pago &&
  (
    respuestaLower.includes("efectivo o transferencia") ||
    respuestaLower.includes("método de pago") ||
    respuestaLower.includes("metodo de pago") ||
    respuestaLower.includes("cómo prefieres pagar") ||
    respuestaLower.includes("como prefieres pagar")
  )
) {
  state.etapa = "pidiendo_pago";
  console.log("🟡 Etapa activada por respuesta IA: pidiendo_pago");
}

// Si la IA pide dirección y ya tenemos pago pero no dirección
if (
  !state.etapa &&
  state.perfil.nombre &&
  state.perfil.ciudad &&
  state.perfil.pago &&
  !state.perfil.direccion &&
  (
    respuestaLower.includes("dirección") ||
    respuestaLower.includes("direccion") ||
    respuestaLower.includes("domicilio") ||
    respuestaLower.includes("calle y número") ||
    respuestaLower.includes("calle y numero")
  )
) {
  state.etapa = "pidiendo_direccion";
  console.log("🟡 Etapa activada por respuesta IA: pidiendo_direccion");
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

} catch (error) {
  console.error("❌ Error en webhook:", error);
  return res.sendStatus(500);
}
});

app.post("/save-whatsapp-connection", async (req, res) => {
  console.log("📲 CONEXIÓN WHATSAPP META:", req.body);
  res.json({ ok: true });
});

async function getBusiness(phoneNumberId) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("phone_number_id", phoneNumberId)
    .single();

 if (error || !data) {
  console.log("❌ Negocio no encontrado para:", phoneNumberId);
  return null;
}

if (!data.access_token) {
  console.log("❌ ESTE NEGOCIO NO TIENE TOKEN:", data.name);
  return null;
}

  console.log("🏪 BUSINESS:", data);
  console.log("🏪 BUSINESS DETECTADO:", {
  name: data.name,
  phone_number_id: data.phone_number_id,
  tiene_token: !!data.access_token
});


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

function getEmptyState() {
  return {
    etapa: null,
    perfil: {},
    carrito: [],
    productoSeleccionado: null
  };
}


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
    productoSeleccionado: null,
    catalogoActual: []
  };
}

  if (!data) {
  return {
    etapa: null,
    perfil: {},
    productoSeleccionado: null,
    catalogoActual: [],
    categoriasActuales: []

  };
}

  return {
    etapa: data.etapa || null,
    perfil: data.perfil || {},
    productoSeleccionado: data.producto_seleccionado || null,
    catalogoActual: data.catalogo_actual || [],
    categoriasActuales: data.categorias_actuales || []
  };
}



async function saveCustomerState(businessId, customerId, state) {
  const payload = {
    business_id: businessId,
    customer_id: customerId,
    etapa: state.etapa || null,
    perfil: state.perfil || {},
    producto_seleccionado: state.productoSeleccionado || null,
    catalogo_actual: state.catalogoActual || [],
    categorias_actuales: state.categoriasActuales || [],
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
  const { data, error } = await supabase
    .from("customer_states")
    .delete()
    .eq("business_id", businessId)
    .eq("customer_id", customerId)
    .select();

  if (error) {
    console.error("❌ Error limpiando customer_state:", error);
  } else {
    console.log("🧹 customer_state eliminado:", data);
  }
}

async function calcularTotal(businessId, perfil, business) {
  const shippingCost = Number(business?.shipping_cost || 120);

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

  const cantidadPedido = Number(perfil.cantidad || 1);
  const subtotal = precioProducto * cantidadPedido;
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
    .select("id, name, price, image_url, active, stock, description, category, sku")
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

async function descontarStockProducto(productId, cantidad) {
  try {
    const qty = Number(cantidad || 1);

    if (!productId || qty <= 0) {
      return { ok: false, error: "Producto o cantidad inválida" };
    }

    const { data: product, error: getError } = await supabase
      .from("products")
      .select("id, stock")
      .eq("id", productId)
      .single();

    if (getError || !product) {
      return { ok: false, error: "Producto no encontrado" };
    }

    const stockActual = Number(product.stock || 0);

    if (stockActual < qty) {
      return {
        ok: false,
        error: `Stock insuficiente. Disponible: ${stockActual}`
      };
    }

    const nuevoStock = stockActual - qty;

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock: nuevoStock,
        updated_at: new Date().toISOString()
      })
      .eq("id", productId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return {
      ok: true,
      stockAnterior: stockActual,
      stockNuevo: nuevoStock
    };

  } catch (error) {
    console.error("❌ Error descontando stock:", error);
    return { ok: false, error: "Error descontando stock" };
  }
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findProductFromText(products, text) {
  const query = normalizeText(text);

  if (!query) return null;

  let bestProduct = null;
  let bestScore = 0;

  const queryWords = query
    .split(" ")
    .filter(word => word.length > 2);

  for (const product of products) {
    const productName = normalizeText(product.name);

    const searchableText = normalizeText([
      product.name,
      product.description,
      product.category,
      product.sku
    ].filter(Boolean).join(" "));

    if (!searchableText) continue;

    let score = 0;

    if (productName && query.includes(productName)) {
      score += 100;
    }

    const productWords = searchableText
      .split(" ")
      .filter(word => word.length > 2);

    for (const word of queryWords) {
      if (productWords.includes(word)) {
        score += 10;
      } else if (searchableText.includes(word)) {
        score += 3;
      }
    }

    // penaliza productos genéricos si el cliente escribió más detalles
    const missingImportantWords = queryWords.filter(word =>
      !["quiero", "busco", "tienes", "tiene", "para", "una", "uno"].includes(word) &&
      !productWords.includes(word)
    );

    score -= missingImportantWords.length * 12;

    console.log("🔎 MATCH SCORE:", {
      producto: product.name,
      score,
      query,
      missingImportantWords
    });

    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  }

  if (bestScore >= 12) {
    return bestProduct;
  }

  return null;
}

function findAlternativeProducts(products, unavailableProduct, limit = 3) {
  if (!unavailableProduct) return [];

  const unavailableText = normalizeText([
    unavailableProduct.name,
    unavailableProduct.description,
    unavailableProduct.category,
    unavailableProduct.sku
  ].filter(Boolean).join(" "));

  const unavailableWords = unavailableText
    .split(" ")
    .filter(word => word.length > 2 || /^\d+$/.test(word));

  const alternatives = products
    .filter(product =>
      product.id !== unavailableProduct.id &&
      Number(product.stock || 0) > 0
    )
    .map(product => {
      const productText = normalizeText([
        product.name,
        product.description,
        product.category,
        product.sku
      ].filter(Boolean).join(" "));

      let score = 0;

      for (const word of unavailableWords) {
        if (productText.includes(word)) {
          score += 1;
        }
      }

      return {
        product,
        score
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.product);

  return alternatives;
}

async function generarImagenCatalogo(productos) {
  try {
    const items = productos.slice(0, 6);

    const width = 1200;
    const height = 940;
    const cardWidth = 360;
    const cardHeight = 400;
    const gapX = 30;
    const gapY = 35;
    const startX = 45;
    const startY = 55;

    const composites = [];

    const baseSvg = `
      <svg width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="45" y="35" font-size="24" font-family="Arial" font-weight="700" fill="#111827">
          Opciones disponibles
        </text>
      </svg>
    `;

    const base = await sharp(Buffer.from(baseSvg)).png().toBuffer();

    for (let i = 0; i < items.length; i++) {
      const product = items[i];

      const col = i % 3;
      const row = Math.floor(i / 3);

      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      let imageBuffer = null;

      if (product.image_url) {
        try {
          const imgRes = await axios.get(product.image_url, {
            responseType: "arraybuffer"
          });

          imageBuffer = await sharp(Buffer.from(imgRes.data))
            .resize(320, 220, { fit: "cover" })
            .png()
            .toBuffer();

        } catch (err) {
          console.log("⚠️ No se pudo cargar imagen:", product.name);
        }
      }

      const cardSvg = `
        <svg width="${cardWidth}" height="${cardHeight}">
          <rect x="0" y="0" width="${cardWidth}" height="${cardHeight}" rx="24" fill="white"/>
          <rect x="20" y="20" width="320" height="220" rx="18" fill="#e5e7eb"/>

          <text x="20" y="278" font-size="18" font-family="Arial" font-weight="700" fill="#111827">
            ${i + 1}. ${String(product.name || "").slice(0, 28)}
          </text>

          <text x="20" y="318" font-size="26" font-family="Arial" font-weight="800" fill="#111827">
            $${Number(product.price || 0).toFixed(2)} MXN
          </text>

          <text x="20" y="355" font-size="17" font-family="Arial" fill="#16a34a">
            Stock: ${Number(product.stock || 0)}
          </text>
        </svg>
      `;

      composites.push({
        input: Buffer.from(cardSvg),
        left: x,
        top: y
      });

      if (imageBuffer) {
        composites.push({
          input: imageBuffer,
          left: x + 20,
          top: y + 20
        });
      }
    }

    const finalBuffer = await sharp(base)
      .composite(composites)
      .jpeg({ quality: 90 })
      .toBuffer();

    const fileName = `catalogo-${Date.now()}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("catalogos")
      .upload(fileName, finalBuffer, {
        contentType: "image/jpeg",
        upsert: true
      });

    if (error) {
      console.error("❌ Error subiendo catálogo:", error);
      return null;
    }

    const { data } = supabaseAdmin.storage
      .from("catalogos")
      .getPublicUrl(fileName);

    console.log("✅ Catálogo generado:", data.publicUrl);

    return data.publicUrl;

  } catch (error) {
    console.error("❌ Error generando imagen catálogo:", error);
    return null;
  }
}

async function findProductWithAI(products, text) {
  try {

    const catalog = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock
    }));

    const prompt = `
Cliente escribió:
"${text}"

Catálogo:
${JSON.stringify(catalog, null, 2)}

Devuelve únicamente el ID del producto que más probablemente busca el cliente.

Si no hay coincidencia clara devuelve:
NO_MATCH
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Eres un buscador de productos."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0
    });

    const result =
      response.choices?.[0]?.message?.content?.trim();

    console.log("🤖 AI PRODUCT MATCH:", result);

    if (!result || result === "NO_MATCH") {
      return null;
    }

    return products.find(p => p.id === result) || null;

  } catch (err) {
    console.error("❌ Error AI match:", err);
    return null;
  }
}

async function saveOrder(businessId, customerId, perfil, business) {
  console.log("📦 Intentando guardar pedido con perfil:", perfil);

  const { shippingCost, total } = await calcularTotal(
    businessId,
    perfil,
    business
  );

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
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const PALABRAS_PROHIBIDAS_NOMBRE = new Set([
  // catálogo / compra
  "catalogo", "catalogos", "catalog", "catálogo", "catalgo", "catalg",
  "producto", "productos", "precio", "precios", "costo", "costos",
  "pedido", "comprar", "compra", "quiero", "modelo", "funda", "iphone",
  "samsung", "xiaomi", "motorola", "huawei", "celular", "telefono",

  // saludos / relleno
  "hola", "buenas", "buenos", "dias", "día", "tardes", "noches",
  "ok", "sale", "va", "gracias", "si", "sí", "confirmo",

  // dirección / pago
  "direccion", "dirección", "calle", "colonia", "col", "cp", "c.p",
  "tarjeta", "transferencia", "efectivo", "pago",

  // ciudades / lugares
  "veracruz", "monterrey", "mexico", "méxico", "cdmx",

  // animales / palabras comunes
  "perro", "perra", "gato", "gata", "conejo", "caballo", "vaca",
  "pollo", "oso", "tigre", "leon", "león", "raton", "ratón"
]);

const NOMBRES_COMUNES = new Set([
  "juan", "jose", "josé", "maria", "maría", "luis", "miguel", "angel",
  "ángel", "carlos", "andres", "andrés", "pedro", "jorge", "manuel",
  "enrique", "fernando", "roberto", "rafael", "eduardo", "alejandro",
  "david", "daniel", "adrian", "adrián", "omar", "oscar", "óscar",
  "raul", "raúl", "antonio", "francisco", "jesus", "jesús", "ricardo",
  "martin", "martín", "sergio", "alberto", "alfonso", "victor", "víctor",
  "gabriel", "emmanuel", "ivan", "iván", "julio", "marvin", "edgar",
  "ana", "laura", "luisa", "fernanda", "sofia", "sofía", "patricia",
  "guadalupe", "adriana", "claudia", "diana", "paola", "gabriela",
  "karla", "carmen", "rosa", "marisol", "martha", "leticia", "veronica",
  "verónica", "alejandra", "monica", "mónica", "erika", "erica", "norma"
]);


function esNombreValido(texto) {
  const limpio = String(texto || "").trim().replace(/\s+/g, " ");
  const normalizado = normalizarTexto(limpio);

  if (!limpio) return false;
  if (limpio.length < 6 || limpio.length > 60) return false;

  // No números
  if (/\d/.test(limpio)) return false;

  // Solo letras y espacios
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(limpio)) return false;

  const palabras = limpio.split(" ").filter(Boolean);
  const palabrasNorm = normalizado.split(" ").filter(Boolean);

  // Nombre + apellido, máximo 4 palabras
  if (palabras.length < 2 || palabras.length > 4) return false;

  // Cada palabra razonable
  if (palabras.some(p => p.length < 2 || p.length > 20)) return false;

  // Bloqueo exacto
  if (palabrasNorm.some(p => PALABRAS_PROHIBIDAS_NOMBRE.has(p))) return false;

  // Bloqueo por frases/comercio/pedido
  const sospechosas = [
    "catalog", "catalogo", "catalago", "producto", "productos",
    "precio", "cuanto", "vale", "costo",
    "transferencia", "tarjeta", "efectivo", "pago",
    "envio", "direccion", "calle", "colonia", "numero",
    "funda", "iphone", "samsung", "xiaomi", "motorola",
    "cargador", "mica", "audifono", "audifonos",
    "hola", "buenas", "gracias", "quiero", "comprar",
    "si", "ok", "vale", "va", "confirmo",
    "veracruz", "mexico", "cdmx", "monterrey", "guadalajara"
  ];

  if (sospechosas.some(s => normalizado.includes(s))) return false;

  // Evitar nombres raros repetidos
  const unicas = new Set(palabrasNorm);
  if (unicas.size < palabrasNorm.length) return false;

  // Evitar palabras iguales tipo "Juan Juan"
  if (palabrasNorm[0] === palabrasNorm[1]) return false;

  // Rechazar si todas las palabras son demasiado genéricas
  const genericas = new Set([
    "nombre", "completo", "cliente", "persona", "usuario"
  ]);

  if (palabrasNorm.every(p => genericas.has(p))) return false;

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

Debes decidir si el texto parece un nombre real de persona hispana.

ACEPTA:
- Juan Pérez
- María López
- Enrique Ramírez
- Ana Sofía Torres

RECHAZA:
- perro
- Perro Pérez
- gato lopez
- catalogo
- hola amigo
- funda samsung
- transferencia bancaria
- calle rio bamba
- Veracruz México
- nombre completo

Reglas:
- Debe parecer nombre humano real.
- Debe tener nombre y apellido.
- No aceptes animales, objetos, productos, saludos, direcciones, ciudades ni frases.
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

async function validarNombrePersona(texto) {
  const nombre = String(texto || "").trim().replace(/\s+/g, " ");

  if (!esNombreValido(nombre)) {
    return {
      ok: false,
      motivo: "hard_filter"
    };
  }

  const validoIA = await esNombreRealConIA(nombre);

  if (!validoIA) {
    return {
      ok: false,
      motivo: "ia"
    };
  }

  return {
    ok: true,
    nombre
  };
}

function validarCiudad(texto) {
  const ciudad = String(texto || "").trim().replace(/\s+/g, " ");
  const normalizado = normalizarTexto(ciudad);

  if (!ciudad) return { ok: false };
  if (ciudad.length < 3 || ciudad.length > 50) return { ok: false };
  if (/\d/.test(ciudad)) return { ok: false };

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(ciudad)) {
    return { ok: false };
  }

  const palabras = normalizado.split(" ").filter(Boolean);
  if (palabras.length > 4) return { ok: false };

  const prohibidas = [
    "si", "ok", "vale", "va", "confirmo",
    "hola", "buenas", "gracias",
    "catalogo", "catalog", "productos", "producto",
    "funda", "iphone", "samsung", "xiaomi", "motorola",
    "cargador", "mica", "audifono", "audifonos",
    "transferencia", "efectivo", "tarjeta", "pago",
    "calle", "avenida", "colonia", "numero", "direccion",
    "nombre", "completo"
  ];

  if (prohibidas.some(p => normalizado.includes(p))) {
    return { ok: false };
  }

  if (palabras.some(p => p.length < 2 || p.length > 20)) {
    return { ok: false };
  }

  return {
    ok: true,
    ciudad
  };
}

function extractPerfil(perfil = {}, texto = "") {
  
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
    const businessDemo = {
      name: "Mi Tienda",
      city: "Veracruz",
      shipping_cost: 120,
      support_hours: "Lunes a Viernes 9am–6pm",
      payment_methods: "Tarjeta y transferencia",
      welcome_message: "Hola 👋 Gracias por escribirnos.",
      prompt: PERFIL_NEGOCIO
    };

    const respuesta = await procesarMensaje(clienteId, mensaje, businessDemo);
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
  try {
    const token = business.access_token;
    const phoneNumberId = business.phone_number_id;

    if (!token || !phoneNumberId) {
      throw new Error("Este negocio no tiene access_token o phone_number_id");
    }

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const response = await axios.post(
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

    console.log("✅ WhatsApp enviado:", response.data);

  } catch (error) {
    console.error("❌ Error enviando WhatsApp:", error.message);
    console.error("❌ META ERROR STATUS:", error.response?.status);
    console.error("❌ META ERROR DATA:", JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
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

async function procesarMensaje(clienteId, mensaje, business) {
  const state = getClientState(clienteId);

  state.perfil = state.perfil || {};
  state.perfil = extractPerfil(state.perfil, mensaje);

  state.history.push({ role: "user", content: mensaje });
  state.history = state.history.slice(-10);

const textLower = mensaje.toLowerCase();
// 🔎 Detectar producto automáticamente

const productos = await getBusinessProducts(business.id);

const productoDetectado = findProductFromText(productos, mensaje);

if (productoDetectado) {
  state.productoSeleccionado = productoDetectado;
  state.perfil.producto = productoDetectado.name;

  console.log("🛒 Producto detectado:", productoDetectado.name);
} else {
  // 🔥 fallback inteligente
  const posible = productos.find(p =>
    (p.name || "").toLowerCase().includes("iphone 13")
  );

  if (posible) {
    state.productoSeleccionado = posible;
    state.perfil.producto = posible.name;

    console.log("🧠 Producto inferido:", posible.name);
  }
}

  // 💰 CONTROL DE PAGOS INTELIGENTE
  if (
    !state.etapa &&
    !state.productoSeleccionado &&
    (
      textLower.includes("pago") ||
      textLower.includes("tarjeta") ||
      textLower.includes("transferencia") ||
      textLower.includes("como pago")
    )
  ) {
    // 👉 SI TIENE LINK ACTIVADO
    if (business.payment_enabled && business.payment_mode === "link") {
      return `Perfecto 👍 puedes pagar en línea aquí:

👉 https://TU-LINK-DE-PAGO.com

En cuanto se refleje el pago, procesamos tu pedido 🚀`;
    }

    // 👉 SI ES MANUAL
    const metodos = business.payment_methods || "transferencia o tarjeta";

    return `Sí 👌 aceptamos ${metodos}.
¿Qué producto te interesa para avanzar con tu pedido?`;
  }

  // 👇 TODO TU PROMPT SIGUE NORMAL


const promptBase = `
Eres un asistente de ventas por WhatsApp.

Tu trabajo es:
- responder como vendedor humano
- guiar al cliente paso a paso
- detectar intención de compra
- cerrar ventas
- no repetir preguntas ya respondidas
- no inventar productos ni precios
- siempre empujar al siguiente paso de compra

Reglas generales:
- Responde claro, corto y amable.
- Habla como vendedor real por WhatsApp.
- Si el cliente muestra intención, guía a cierre.
- Si ya tienes datos del cliente, no los vuelvas a pedir.
- Si falta solo un dato, pide solo ese dato.
- No des respuestas largas.
- Si el cliente pregunta por envío, responde con el costo y rapidez.
- Si el cliente pregunta por pago, responde con seguridad y usa eso para acercarte al cierre.
- Usa los datos del negocio para convencer.
`.trim();

const promptNegocio = `
Configuración del negocio:
- Nombre del negocio: ${business?.name || "Mi Tienda"}
- Ciudad base: ${business?.city || "No especificada"}

Envíos:
- El costo de envío es de $${Number(business?.shipping_cost || 0).toFixed(2)} MXN
- Si el cliente pregunta por envío, menciona claramente el costo
- Si el cliente está en la misma ciudad, úsalo como argumento de venta por rapidez

Pagos:
- Métodos de pago disponibles: ${business?.payment_methods || "No especificados"}
- Si el cliente pregunta cómo pagar, responde con los métodos disponibles
- Si acepta transferencia, dilo con seguridad y naturalidad
- Usa el tema del pago para acercarte al cierre de venta
- Si el cliente pregunta por tarjeta o transferencia, responde directo y luego intenta cerrar con una pregunta concreta como:
  "¿Para qué modelo buscas la funda?" o "¿Cuál producto te interesa para avanzarte el pedido?"
- No te quedes solo resolviendo la duda; después de responder, empuja la venta.



Horario:
- Horario de soporte: ${business?.support_hours || "No especificado"}

Mensaje de bienvenida sugerido:
${business?.welcome_message || "No especificado"}

Instrucciones específicas del negocio:
${business?.prompt || "Vende los productos del catálogo de forma clara y busca cerrar ventas."}
`.trim();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 180,
    messages: [
      {
        role: "system",
        content: `${promptBase}\n\n${promptNegocio}`
      },
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

// 🔧 Obtener configuración del negocio
app.get("/business/config", requireAuth, async (req, res) => {
  try {
    console.log("🧪 BUSINESS ID:", req.businessId);

    const { data, error } = await supabase
      .from("businesses")
      .select(`
        id,
        name,
        prompt,
        city,
        shipping_cost,
        support_hours,
        payment_methods,
        welcome_message,
        active,
        payment_enabled,
        payment_mode,
        payment_link_url
      `)
      .eq("id", req.businessId)
      .single();

    if (error) {
      console.error("❌ Error en /business/config:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Negocio no encontrado" });
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo configuración del negocio:", err);
    res.status(500).json({ error: "Error obteniendo configuración" });
  }
});

// 🔧 Guardar configuración del negocio
app.put("/business/config", requireAuth, async (req, res) => {
  try {
    const {
      name,
      prompt,
      city,
      shipping_cost,
      support_hours,
      payment_methods,
      welcome_message,
      active,
      payment_enabled,
      payment_mode,
      payment_link_url
    } = req.body;

    const payload = {};

    if (name !== undefined) payload.name = String(name).trim();
    if (prompt !== undefined) payload.prompt = String(prompt).trim();
    if (city !== undefined) payload.city = String(city).trim();
    if (shipping_cost !== undefined) payload.shipping_cost = Number(shipping_cost);
    if (support_hours !== undefined) payload.support_hours = String(support_hours).trim();
    if (payment_methods !== undefined) payload.payment_methods = String(payment_methods).trim();
    if (welcome_message !== undefined) payload.welcome_message = String(welcome_message).trim();
    if (active !== undefined) payload.active = !!active;

    if (payment_enabled !== undefined) payload.payment_enabled = !!payment_enabled;
    if (payment_mode !== undefined) payload.payment_mode = String(payment_mode).trim();

    if (payment_link_url !== undefined) {
  payload.payment_link_url = String(payment_link_url).trim();
}


    const { data, error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", req.businessId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true, business: data });
  } catch (err) {
    console.error("❌ Error actualizando configuración del negocio:", err);
    res.status(500).json({ error: "Error actualizando configuración" });
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

app.get('/whatsapp-connection', async (req, res) => {

  try {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'No autorizado'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: 'Sesión inválida'
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (!profile?.business_id) {
      return res.status(404).json({
        error: 'Business no encontrado'
      });
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', profile.business_id)
      .single();

    res.json({
      connected: !!business?.phone_number_id,
      connection: business
    });

  } catch (error) {

    console.error('Error whatsapp connection:', error);

    res.status(500).json({
      error: 'Error interno'
    });

  }
});

app.get("/business-config", requireAuth, async (req, res) => {
  try {
    const businessId = req.user?.business_id;

    if (!businessId || businessId === "undefined") {
      return res.status(400).json({
        error: "business_id requerido"
      });
    }

    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, city, prompt, phone_number_id, access_token")
      .eq("id", businessId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error("Error get business config:", error);
    res.status(500).json({ error: "Error cargando configuración" });
  }
});

app.put("/business-config", requireAuth, async (req, res) => {
  try {
    const businessId = req.user.business_id;

    const {
      name,
      city,
      prompt,
      phone_number_id,
      access_token
    } = req.body;

    const { data, error } = await supabase
      .from("businesses")
      .update({
        name,
        city,
        prompt,
        phone_number_id,
        access_token
      })
      .eq("id", businessId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      ok: true,
      business: data
    });
  } catch (error) {
    console.error("Error update business config:", error);
    res.status(500).json({ error: "Error guardando configuración" });
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
    const {
      name,
      price,
      image_url,
      active,
      description,
      stock,
      category,
      sku
    } = req.body;

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
        active: active === undefined ? true : !!active,
        description: description || null,
        stock: Number(stock || 0),
        category: category || null,
        sku: sku || null
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

    const {
      name,
      price,
      active,
      image_url,
      description,
      stock,
      category,
      sku
    } = req.body;

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

    const payload = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) payload.name = String(name).trim();

    if (price !== undefined) payload.price = Number(price);

    if (active !== undefined) payload.active = !!active;

    if (image_url !== undefined) payload.image_url = image_url;

    if (description !== undefined) payload.description = description;

    if (stock !== undefined) payload.stock = Number(stock || 0);

    if (category !== undefined) payload.category = category;

    if (sku !== undefined) payload.sku = sku;

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

app.delete("/products/:id", requireAuth, async (req, res) => {
  try {
    const productId = req.params.id;

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

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("business_id", req.businessId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    res.status(500).json({ error: "Error eliminando producto" });
  }
});

const PORT = process.env.PORT || 3000;

console.log("🚀 VERSION NUEVA WEBHOOK 2026-04-04 20:00");

app.post("/save-whatsapp-connection", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No auth token" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: "Sesión inválida" });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("business_id")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.business_id) {
      return res.status(400).json({
        error: "No se encontró business_id para este usuario"
      });
    }

    const {
      meta_business_id,
      waba_id,
      phone_number_id,
      display_phone_number,
      verified_name,
      access_token
    } = req.body;

    const { data, error } = await supabaseAdmin
      .from("whatsapp_connections")
      .upsert(
        {
          business_id: profile.business_id,
          user_id: userId,
          meta_business_id,
          waba_id,
          phone_number_id,
          display_phone_number,
          verified_name,
          access_token,
          status: phone_number_id
            ? "connected"
            : "pending_verification",
          connected_at: phone_number_id
            ? new Date().toISOString()
            : null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "business_id"
        }
      )
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({
        error: error.message
      });
    }

    return res.json({
      ok: true,
      connection: data
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Error interno"
    });
  }
});

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});