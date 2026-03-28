// 🔐 Obtener token del login
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/";
}

// 📦 Referencias del DOM
const form = document.getElementById("product-form");
const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const activeInput = document.getElementById("active");
const editingIdInput = document.getElementById("editing-id");
const productsBody = document.getElementById("products-body");
const formTitle = document.getElementById("form-title");
const saveBtn = document.getElementById("save-btn");

// 🔌 Función base para llamadas API
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error en la petición");
  }

  return data;
}

// 🔄 Resetear formulario
function resetForm() {
  editingIdInput.value = "";
  nameInput.value = "";
  priceInput.value = "";
  activeInput.value = "true";
  formTitle.textContent = "Agregar producto";
  saveBtn.textContent = "Guardar";
}

// 💰 Formato moneda
function currency(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

// 🎨 Renderizar productos en tabla
function renderProducts(products) {
  productsBody.innerHTML = "";

  for (const product of products) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${product.name || ""}</td>
      <td>${currency(product.price)}</td>
      <td>
        <span style="
          padding:6px 10px;
          border-radius:999px;
          font-size:12px;
          font-weight:700;
          background:${product.active ? "#dcfce7" : "#fee2e2"};
          color:${product.active ? "#166534" : "#991b1b"};
        ">
          ${product.active ? "ACTIVO" : "INACTIVO"}
        </span>
      </td>
      <td>
        <button onclick="editarProducto('${product.id}')">Editar</button>
        <button onclick="toggleProducto('${product.id}')">
          ${product.active ? "Desactivar" : "Activar"}
        </button>
      </td>
    `;

    productsBody.appendChild(tr);
  }
}

// 📦 Lista en memoria
let currentProducts = [];

// 🔄 Cargar productos
async function loadProducts() {
  try {
    const products = await api("/products");
    currentProducts = products;
    renderProducts(products);
  } catch (error) {
    alert(error.message);
  }
}

// ✏️ Editar producto
function editarProducto(id) {
  const product = currentProducts.find(p => p.id === id);
  if (!product) return;

  editingIdInput.value = product.id;
  nameInput.value = product.name || "";
  priceInput.value = product.price || "";
  activeInput.value = String(!!product.active);

  formTitle.textContent = "Editar producto";
  saveBtn.textContent = "Actualizar";
}

// 🔄 Activar / desactivar
async function toggleProducto(id) {
  try {
    await api(`/products/${id}/toggle`, {
      method: "POST"
    });

    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
}

// 💾 Guardar producto
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    price: Number(priceInput.value),
    active: activeInput.value === "true"
  };

  try {
    const editingId = editingIdInput.value;

    if (editingId) {
      await api(`/products/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await api("/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetForm();
    await loadProducts();
  } catch (error) {
    alert(error.message);
  }
});

// 🚀 Inicializar
loadProducts();