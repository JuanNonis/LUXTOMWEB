const ADMIN_STORAGE_KEY = 'luxtomAdminData';
const ADMIN_SESSION_KEY = 'luxtomAdminSession';
const ORDER_STATUSES = [
  'venta en proceso, esperando comprobante',
  'pedido confirmado',
  'preparando pedido',
  'pedido terminado',
  'pedido en camino',
  'pedido esperando ser retirado',
  'pedido entregado'
];

function loadAdminData() {
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) {
    saveAdminData(JSON.parse(JSON.stringify(ADMIN_DEFAULT_DATA)));
    return JSON.parse(JSON.stringify(ADMIN_DEFAULT_DATA));
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al leer datos admin:', error);
    saveAdminData(JSON.parse(JSON.stringify(ADMIN_DEFAULT_DATA)));
    return JSON.parse(JSON.stringify(ADMIN_DEFAULT_DATA));
  }
}

function saveAdminData(data) {
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('No se pudo guardar localmente admin data:', error);
  }
}

function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return null;
  }
}

function setAdminSession(user) {
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
}

function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function requireAdminSession() {
  const session = getAdminSession();
  if (session) {
    return session;
  }

  const data = loadAdminData();
  const owner = data.users.find(user => user.role === 'owner');
  if (owner) {
    setAdminSession({ username: owner.username, role: owner.role });
    console.info('Sesión de administrador creada automáticamente con el usuario por defecto.');
    return { username: owner.username, role: owner.role };
  }

  location.replace('admin-login.html');
  return null;
}

async function initAdminPage() {
  const page = document.body.dataset.adminPage;
  if (page === 'login') {
    initLoginPage();
  } else if (page === 'dashboard') {
    await initDashboardPage();
  }
}

async function initDashboardPage() {
  const session = requireAdminSession();
  if (!session) return;

  const userLabel = document.getElementById('adminUserLabel');
  const logoutBtn = document.getElementById('logoutBtn');
  const permissionsTab = document.getElementById('permissionsTab');

  userLabel.textContent = `${session.username} · ${session.role}`;
  logoutBtn.addEventListener('click', () => {
    clearAdminSession();
    location.replace('admin-login.html');
  });

  if (session.role !== 'owner') {
    permissionsTab.style.display = 'none';
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.target));
  });

  setActiveSection('boardSection');
  await renderBoard();
  await renderInventory();
  renderUsers();
  attachInventoryEvents();
  attachPermissionsEvents();
}

function initLoginPage() {
  const session = getAdminSession();
  if (session) {
    location.replace('admin-dashboard.html');
    return;
  }

  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');

  form.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = authenticateAdminUser(username, password);

    if (!user) {
      showLoginMessage('Usuario o contraseña incorrectos.', true);
      return;
    }

    setAdminSession({ username: user.username, role: user.role });
    location.replace('admin-dashboard.html');
  });

  function showLoginMessage(text, isError) {
    message.textContent = text;
    message.style.color = isError ? '#ff7d7d' : '#88ffb8';
  }
}

function authenticateAdminUser(username, password) {
  const data = loadAdminData();
  return data.users.find(user => user.username === username && user.password === password) || null;
}

function setActiveSection(sectionId) {
  document.querySelectorAll('.admin-panel').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === sectionId);
  });
}

async function renderBoard() {
  const data = loadAdminData();
  const supabaseOrders = await fetchSupabaseOrders();
  let orders = (Array.isArray(supabaseOrders) && supabaseOrders.length) ? supabaseOrders : data.orders;
  if (!Array.isArray(orders) || !orders.length) {
    orders = Array.isArray(ADMIN_DEFAULT_DATA.orders) ? ADMIN_DEFAULT_DATA.orders : [];
  }
  const container = document.getElementById('boardColumns');
  container.innerHTML = '';

  ORDER_STATUSES.forEach(status => {
    const column = document.createElement('section');
    column.className = 'board-column';
    column.dataset.status = status;
    column.innerHTML = `
      <h3>${status}</h3>
      <span class="column-count"></span>
      <div class="board-cards"></div>
    `;

    const countLabel = column.querySelector('.column-count');
    const cardsContainer = column.querySelector('.board-cards');
    const ordersByStatus = orders.filter(order => order.estado === status);

    countLabel.textContent = ordersByStatus.length;

    ordersByStatus.forEach(order => {
      const card = document.createElement('article');
      card.className = 'order-card';
      card.draggable = true;
      card.dataset.orderId = order.id;
      card.innerHTML = `
        <div>
          <h4>${order.cliente}</h4>
          <small>${order.id} · ${order.fecha}</small>
        </div>
        <div class="order-meta">
          <span><strong>Total:</strong> ${order.total}</span>
        </div>
        <div class="order-products">
          <strong>Productos:</strong>
          <ul>${order.productos.map(item => `<li>${item.cantidad} × ${renderProductName(item)}</li>`).join('')}</ul>
        </div>
      `;

      card.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', order.id);
        event.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('click', () => openOrderDetail(order.id));

      cardsContainer.append(card);
    });

    column.addEventListener('dragover', event => {
      event.preventDefault();
      column.classList.add('dragover');
    });

    column.addEventListener('dragleave', () => {
      column.classList.remove('dragover');
    });

    column.addEventListener('drop', event => {
      event.preventDefault();
      column.classList.remove('dragover');
      const orderId = event.dataTransfer.getData('text/plain');
      changeOrderStatus(orderId, status);
    });

    container.append(column);
  });
}

async function openOrderDetail(orderId) {
  const data = loadAdminData();
  let order = data.orders.find(item => item.id === orderId);
  if (!order) {
    const supabaseOrders = await fetchSupabaseOrders();
    order = (supabaseOrders || []).find(item => item.id === orderId);
  }
  if (!order) return;

  const modal = document.getElementById('orderDetailModal');
  const content = document.getElementById('orderDetailContent');
  content.innerHTML = `
    <div class="order-detail-header">
      <div>
        <span class="section-label">Pedido detallado</span>
        <h2>${order.cliente}</h2>
        <p>${order.id} · ${order.fecha}</p>
      </div>
      <button id="closeOrderDetailBtn" class="btn-ghost">Cerrar</button>
    </div>
    <div class="order-detail-grid">
      <div class="order-detail-card">
        <h3>Resumen</h3>
        <p><strong>Estado:</strong> ${order.estado}</p>
        <p><strong>Total:</strong> ${order.total}</p>
      </div>
      <div class="order-detail-card">
        <h3>Productos</h3>
        <ul>${order.productos.map(item => `<li>${item.cantidad} × ${renderProductName(item)}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="order-detail-card order-detail-proof">
      <h3>Comprobante de pago</h3>
      ${order.comprobante ? `
        <div style="margin-top:8px;"><img src="${order.comprobante}" alt="Comprobante" style="max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.06);"></div>
      ` : '<p>No se subió comprobante aún.</p>'}
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('closeOrderDetailBtn').addEventListener('click', closeOrderDetail);
}

function closeOrderDetail() {
  const modal = document.getElementById('orderDetailModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderProductName(item) {
  const data = loadAdminData();
  const product = data.products[item.id];
  const productName = product ? product.nombre : item.id;
  return `${productName}`;
}

async function changeOrderStatus(orderId, nextStatus) {
  const data = loadAdminData();
  let order = data.orders.find(item => item.id === orderId);

  // Si no está en local, intentar traerlo desde Supabase y guardarlo localmente
  if (!order) {
    try {
      const supabaseOrders = await fetchSupabaseOrders();
      const remote = (supabaseOrders || []).find(item => item.id === orderId);
      if (remote) {
        data.orders.push(remote);
        saveAdminData(data);
        order = remote;
      }
    } catch (err) {
      console.error('Error al buscar pedido en Supabase para cambiar estado:', err);
    }
  }

  if (!order) {
    console.warn('Pedido no encontrado para cambiar estado:', orderId);
    return;
  }

  if (order.estado === nextStatus) return;

  const prevStatus = order.estado;
  // Actualización optimista local
  order.estado = nextStatus;
  saveAdminData(data);

  // Intentar actualizar en Supabase, no bloquear la UI si falla
  try {
    const ok = await updateOrderStatusInSupabase(orderId, nextStatus);
    if (!ok) {
      console.warn('La actualización remota falló, manteniendo cambio local hasta reintento.');
      // opcional: revertir si quieres, por ahora lo dejamos local
    }
  } catch (err) {
    console.error('Error actualizando estado en Supabase:', err);
  }

  await renderBoard();
}

async function renderInventory() {
  const data = loadAdminData();
  const supabaseProducts = await fetchSupabaseProducts();
  let products = (supabaseProducts && Object.keys(supabaseProducts).length) ? supabaseProducts : data.products;
  if (!products || !Object.keys(products).length) {
    products = ADMIN_DEFAULT_DATA.products;
  }
  renderCategoryList(data.categories);
  renderCollectionList(data.collections);
  renderProductTable(products);
  populateProductSelectors(data.categories, data.collections);
}

function renderCategoryList(categories) {
  const container = document.getElementById('categoryList');
  container.innerHTML = categories.map(category => `
    <div class="tag-item" data-value="${category}">
      <span>${category}</span>
      <div class="tag-actions">
        <button type="button" data-action="edit" data-value="${category}">Editar</button>
        <button type="button" data-action="delete" data-value="${category}">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      const newName = prompt('Cambiar nombre de la categoría', name);
      if (newName && newName.trim() && newName.trim() !== name) {
        updateCategory(name, newName.trim());
      }
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      if (confirm(`Eliminar la categoría "${name}"? Esto también dejará sin categoría a los productos que la usan.`)) {
        deleteCategory(name);
      }
    });
  });
}

function renderCollectionList(collections) {
  const container = document.getElementById('collectionList');
  container.innerHTML = collections.map(collection => `
    <div class="tag-item" data-value="${collection}">
      <span>${collection}</span>
      <div class="tag-actions">
        <button type="button" data-action="edit" data-value="${collection}">Editar</button>
        <button type="button" data-action="delete" data-value="${collection}">Eliminar</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      const newName = prompt('Cambiar nombre de la colección', name);
      if (newName && newName.trim() && newName.trim() !== name) {
        updateCollection(name, newName.trim());
      }
    });
  });

  container.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      if (confirm(`Eliminar la colección "${name}"? Esto también dejará sin colección a los productos que la usan.`)) {
        deleteCollection(name);
      }
    });
  });
}

function renderProductTable(products) {
  const body = document.getElementById('productTableBody');
  const rows = Object.values(products).sort((a,b) => a.nombre.localeCompare(b.nombre));
  body.innerHTML = rows.map(product => `
    <tr>
      <td>${product.nombre}</td>
      <td>${product.categoria}</td>
      <td>${product.coleccion}</td>
      <td>${product.stock}</td>
      <td>
        <button type="button" data-action="edit" data-id="${product.id}">Editar</button>
        <button type="button" data-action="delete" data-id="${product.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => editProduct(button.dataset.id));
  });

  body.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      if (confirm('Eliminar este producto de forma permanente?')) {
        deleteProduct(button.dataset.id);
      }
    });
  });
}

function populateProductSelectors(categories, collections) {
  const categorySelect = document.getElementById('productCategory');
  const collectionSelect = document.getElementById('productCollection');

  categorySelect.innerHTML = categories.map(value => `<option value="${value}">${value}</option>`).join('');
  collectionSelect.innerHTML = collections.map(value => `<option value="${value}">${value}</option>`).join('');
}

function attachInventoryEvents() {
  document.getElementById('categoryForm').addEventListener('submit', event => {
    event.preventDefault();
    const value = document.getElementById('categoryName').value.trim();
    if (!value) return;
    addCategory(value);
    document.getElementById('categoryName').value = '';
  });

  document.getElementById('collectionForm').addEventListener('submit', event => {
    event.preventDefault();
    const value = document.getElementById('collectionName').value.trim();
    if (!value) return;
    addCollection(value);
    document.getElementById('collectionName').value = '';
  });

  document.getElementById('productForm').addEventListener('submit', event => {
    event.preventDefault();
    saveProduct();
  });

  document.getElementById('cancelProductBtn').addEventListener('click', resetProductForm);
  document.getElementById('resetProductBtn').addEventListener('click', resetProductForm);
}

function attachPermissionsEvents() {
  const form = document.getElementById('userForm');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('userName').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    createUser(username, password, role);
  });
}

function addCategory(value) {
  const data = loadAdminData();
  if (data.categories.includes(value)) {
    alert('La categoría ya existe.');
    return;
  }
  data.categories.push(value);
  saveAdminData(data);
  renderInventory();
}

function addCollection(value) {
  const data = loadAdminData();
  if (data.collections.includes(value)) {
    alert('La colección ya existe.');
    return;
  }
  data.collections.push(value);
  saveAdminData(data);
  renderInventory();
}

function updateCategory(oldValue, newValue) {
  const data = loadAdminData();
  if (data.categories.includes(newValue)) {
    alert('Ya existe otra categoría con ese nombre.');
    return;
  }
  data.categories = data.categories.map(name => name === oldValue ? newValue : name);
  Object.values(data.products).forEach(product => {
    if (product.categoria === oldValue) {
      product.categoria = newValue;
    }
  });
  saveAdminData(data);
  renderInventory();
}

function updateCollection(oldValue, newValue) {
  const data = loadAdminData();
  if (data.collections.includes(newValue)) {
    alert('Ya existe otra colección con ese nombre.');
    return;
  }
  data.collections = data.collections.map(value => value === oldValue ? newValue : value);
  Object.values(data.products).forEach(product => {
    if (product.coleccion === oldValue) {
      product.coleccion = newValue;
    }
  });
  saveAdminData(data);
  renderInventory();
}

async function saveProduct() {
  const data = loadAdminData();
  const idInput = document.getElementById('productId');
  const idValue = idInput.value;
  const nombre = document.getElementById('productName').value.trim();
  const tagline = document.getElementById('productTagline').value.trim();
  const precio = document.getElementById('productPrice').value.trim();
  const descuento = document.getElementById('productDiscount').checked;
  const precioDescuento = document.getElementById('productPriceDiscount').value.trim() || null;
  const categoria = document.getElementById('productCategory').value;
  const coleccion = document.getElementById('productCollection').value;
  const stock = Number(document.getElementById('productStock').value);
  const imagenes = document.getElementById('productImages').value.split(',').map(url => url.trim()).filter(Boolean);
  const videos = document.getElementById('productVideos').value.split(',').map(url => url.trim()).filter(Boolean);
  const descripcion = document.getElementById('productDescription').value.trim();

  if (!nombre || !tagline || !precio || !categoria || !coleccion) {
    alert('Completa los datos principales del producto.');
    return;
  }

  const product = {
    id: idValue || createProductId(nombre),
    nombre,
    tagline,
    precio,
    descuento,
    precioDescuento: descuento ? precioDescuento || precio : null,
    categoria,
    coleccion,
    stock: Number.isFinite(stock) ? stock : 0,
    imagenes,
    videos,
    descripcion
  };

  if (!product.id) {
    alert('El nombre del producto no es válido para generar un identificador.');
    return;
  }

  if (idValue && data.products[idValue]) {
    data.products[idValue] = product;
  } else {
    let finalId = product.id;
    let suffix = 1;
    while (data.products[finalId]) {
      finalId = `${product.id}-${suffix++}`;
    }
    product.id = finalId;
    data.products[finalId] = product;
  }

  saveAdminData(data);
  await saveProductToSupabase(product);
  await renderInventory();
  resetProductForm();
}

function createProductId(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function resetProductForm() {
  document.getElementById('productFormTitle').textContent = 'Agregar producto';
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productTagline').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productDiscount').checked = false;
  document.getElementById('productPriceDiscount').value = '';
  document.getElementById('productStock').value = 0;
  document.getElementById('productImages').value = '';
  document.getElementById('productVideos').value = '';
  document.getElementById('productDescription').value = '';
}

function editProduct(productId) {
  const data = loadAdminData();
  const product = data.products[productId];
  if (!product) return;

  document.getElementById('productFormTitle').textContent = 'Editar producto';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.nombre;
  document.getElementById('productTagline').value = product.tagline;
  document.getElementById('productPrice').value = product.precio;
  document.getElementById('productDiscount').checked = product.descuento;
  document.getElementById('productPriceDiscount').value = product.precioDescuento || '';
  document.getElementById('productCategory').value = product.categoria;
  document.getElementById('productCollection').value = product.coleccion;
  document.getElementById('productStock').value = product.stock;
  document.getElementById('productImages').value = product.imagenes.join(', ');
  document.getElementById('productVideos').value = (product.videos || []).join(', ');
  document.getElementById('productDescription').value = product.descripcion || '';
}

async function deleteProduct(productId) {
  const data = loadAdminData();
  delete data.products[productId];
  saveAdminData(data);
  await deleteProductFromSupabase(productId);
  await renderInventory();
}

function renderUsers() {
  const data = loadAdminData();
  const tbody = document.getElementById('userTableBody');
  const session = getAdminSession();

  tbody.innerHTML = data.users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>
        <button type="button" data-action="delete" data-user="${user.username}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const username = button.dataset.user;
      if (username === session.username) {
        alert('No puedes eliminar tu propia sesión desde aquí.');
        return;
      }
      if (confirm(`Eliminar la cuenta ${username}?`)) {
        deleteUser(username);
      }
    });
  });
}

function createUser(username, password, role) {
  const data = loadAdminData();
  if (!username || !password) {
    alert('Completa usuario y contraseña.');
    return;
  }
  if (data.users.some(user => user.username === username)) {
    alert('Ya existe un usuario con ese nombre.');
    return;
  }
  data.users.push({ username, password, role });
  saveAdminData(data);
  document.getElementById('userForm').reset();
  renderUsers();
}

function deleteUser(username) {
  const data = loadAdminData();
  data.users = data.users.filter(user => user.username !== username);
  saveAdminData(data);
  renderUsers();
}

function deleteCategory(name) {
  const data = loadAdminData();
  data.categories = data.categories.filter(c => c !== name);
  Object.values(data.products).forEach(product => {
    if (product.categoria === name) product.categoria = '';
  });
  saveAdminData(data);
  renderInventory();
}

function deleteCollection(name) {
  const data = loadAdminData();
  data.collections = data.collections.filter(c => c !== name);
  Object.values(data.products).forEach(product => {
    if (product.coleccion === name) product.coleccion = '';
  });
  saveAdminData(data);
  renderInventory();
}

window.addEventListener('DOMContentLoaded', initAdminPage);
