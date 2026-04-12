const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/";
}

const form = document.getElementById("config-form");
const msgBox = document.getElementById("msg");
const reloadBtn = document.getElementById("reload-btn");

const fields = {
  name: document.getElementById("name"),
  city: document.getElementById("city"),
  shipping_cost: document.getElementById("shipping_cost"),
  support_hours: document.getElementById("support_hours"),
  payment_methods: document.getElementById("payment_methods"),
  welcome_message: document.getElementById("welcome_message"),
  prompt: document.getElementById("prompt"),
  active: document.getElementById("active")
};

function showMessage(text, type = "ok") {
  msgBox.className = `msg ${type}`;
  msgBox.textContent = text;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Error en la petición");
  }

  return data;
}

async function loadConfig() {
  try {
    const data = await api("/business/config");

    fields.name.value = data.name || "";
    fields.city.value = data.city || "";
    fields.shipping_cost.value = data.shipping_cost ?? "";
    fields.support_hours.value = data.support_hours || "";
    fields.payment_methods.value = data.payment_methods || "";
    fields.welcome_message.value = data.welcome_message || "";
    fields.prompt.value = data.prompt || "";
    fields.active.value = String(data.active ?? true);

    showMessage("Configuración cargada correctamente.", "ok");
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Error cargando configuración.", "error");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      name: fields.name.value,
      city: fields.city.value,
      shipping_cost: Number(fields.shipping_cost.value || 0),
      support_hours: fields.support_hours.value,
      payment_methods: fields.payment_methods.value,
      welcome_message: fields.welcome_message.value,
      prompt: fields.prompt.value,
      active: fields.active.value === "true"
    };

    await api("/business/config", {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    showMessage("Configuración guardada correctamente.", "ok");
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Error guardando configuración.", "error");
  }
});

reloadBtn.addEventListener("click", loadConfig);

loadConfig();