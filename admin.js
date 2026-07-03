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

// ── Estado temporal del formulario de producto ──────────────────
let productSpecs = [];
let productFeatures = [];
let productImagesList = [];
let cachedProducts = {};
let cachedCategories = [];
let cachedCollections = [];

// ── Helpers de precio ───────────────────────────────────────────
function formatAdminPrice(num) {
  return '$' + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseAdminPrice(str) {
  return Number(String(str).replace(/[^0-9]/g, '')) || 0;
}

// ── Admin data / session ────────────────────────────────────────
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

async function requireAdminSession() {
  try {
    const client = getSupabaseClient();
    if (!client) { location.replace('admin-login.html'); return null; }
    const { data: { session } } = await client.auth.getSession();
    if (!session) { location.replace('admin-login.html'); return null; }
    return session;
  } catch {
    location.replace('admin-login.html');
    return null;
  }
}

// ── Init ────────────────────────────────────────────────────────
async function initAdminPage() {
  const page = document.body.dataset.adminPage;
  if (page === 'login') {
    initLoginPage();
  } else if (page === 'dashboard') {
    await initDashboardPage();
  }
}

async function initDashboardPage() {
  const session = await requireAdminSession();
  if (!session) return;

  document.body.style.visibility = 'visible';

  const userLabel = document.getElementById('adminUserLabel');
  const logoutBtn = document.getElementById('logoutBtn');
  const permissionsTab = document.getElementById('permissionsTab');

  userLabel.textContent = session.user.email;
  logoutBtn.addEventListener('click', async () => {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    location.replace('admin-login.html');
  });

  if (session.role !== 'owner') permissionsTab.style.display = 'none';

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.target));
  });

  setActiveSection('boardSection');
  await renderBoard();
  await renderInventory();
  renderImageSlots();
  renderUsers();
  await renderConfigSection();
  attachInventoryEvents();
  attachPermissionsEvents();
  attachConfigEvents();
}

async function initLoginPage() {
  const client = getSupabaseClient();
  try {
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      if (session) { location.replace('admin-dashboard.html'); return; }
    }
  } catch { }
  document.body.style.visibility = 'visible';

  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');
  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const email = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    message.textContent = '';

    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      message.textContent = 'Usuario o contraseña incorrectos.';
      message.style.color = '#ff7d7d';
      btn.disabled = false;
      btn.textContent = 'Ingresar';
    } else {
      location.replace('admin-dashboard.html');
    }
  });
}

function setActiveSection(sectionId) {
  document.querySelectorAll('.admin-panel').forEach(section => {
    section.classList.toggle('active', section.id === sectionId);
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === sectionId);
  });
}

// ── Board ────────────────────────────────────────────────────────
async function renderBoard() {
  const orders = (await fetchSupabaseOrders()) || [];

  const container = document.getElementById('boardColumns');
  container.innerHTML = '';

  ORDER_STATUSES.forEach(status => {
    const column = document.createElement('section');
    column.className = 'board-column';
    column.dataset.status = status;
    column.innerHTML = `<h3>${status}</h3><span class="column-count"></span><div class="board-cards"></div>`;

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
        <div><h4>${order.cliente}</h4><small>${order.id} · ${order.fecha}</small></div>
        <div class="order-meta"><span><strong>Total:</strong> ${order.total}</span></div>
        <div class="order-products"><strong>Productos:</strong>
          <ul>${order.productos.map(item => `<li>${item.cantidad} × ${renderProductName(item)}</li>`).join('')}</ul>
        </div>`;

      card.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', order.id);
        event.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('click', () => openOrderDetail(order.id));
      cardsContainer.append(card);
    });

    column.addEventListener('dragover', event => { event.preventDefault(); column.classList.add('dragover'); });
    column.addEventListener('dragleave', () => column.classList.remove('dragover'));
    column.addEventListener('drop', event => {
      event.preventDefault();
      column.classList.remove('dragover');
      changeOrderStatus(event.dataTransfer.getData('text/plain'), status);
    });

    container.append(column);
  });
}

async function openOrderDetail(orderId) {
  const supabaseOrders = await fetchSupabaseOrders();
  const order = (supabaseOrders || []).find(item => item.id === orderId);
  if (!order) return;

  const modal = document.getElementById('orderDetailModal');
  const content = document.getElementById('orderDetailContent');
  const shippingCostText = (order.costo_envio !== null && order.costo_envio !== undefined)
    ? (Number(order.costo_envio) === 0 ? 'Gratis' : formatAdminPrice(Number(order.costo_envio)))
    : 'A cotizar';

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
        ${order.metodo_envio ? `<p><strong>Envío:</strong> ${order.metodo_envio} — ${shippingCostText}</p>` : ''}
      </div>
      <div class="order-detail-card">
        <h3>Datos del cliente</h3>
        ${order.telefono ? `<p><strong>Teléfono:</strong> ${order.telefono}</p>` : ''}
        ${order.mail     ? `<p><strong>Email:</strong> ${order.mail}</p>` : ''}
        ${order.direccion ? `<p><strong>Dirección:</strong> ${order.direccion}</p>` : ''}
      </div>
      <div class="order-detail-card">
        <h3>Productos</h3>
        <ul>${order.productos.map(item => `<li>${item.cantidad} × ${renderProductName(item)}</li>`).join('')}</ul>
      </div>
    </div>
    <div class="order-detail-card order-detail-proof">
      <h3>Comprobante de pago</h3>
      <div id="proofImageWrap" style="margin-top:8px;">
        ${order.comprobante_url
          ? `<img src="${order.comprobante_url}" alt="Comprobante" style="max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:12px;">
             <button id="adminDeleteProofBtn" data-order-id="${order.id}" data-url="${order.comprobante_url}" class="btn-ghost" style="color:#ff7d7d;font-size:13px;margin-bottom:12px;">✕ Eliminar comprobante</button>`
          : '<p style="color:var(--muted);font-size:13px;margin-bottom:12px;">No se subió comprobante aún.</p>'}
      </div>
      <label for="adminProofInput" class="proof-upload-label" id="adminProofLabel" style="max-width:320px;">
        <span class="proof-upload-icon">↑</span>
        <span class="proof-upload-text" id="adminProofText">${order.comprobante_url ? 'Reemplazar comprobante' : 'Subir comprobante'}</span>
        <span class="proof-upload-sub">JPG, PNG o HEIC</span>
      </label>
      <input type="file" id="adminProofInput" accept="image/*" style="display:none;" data-order-id="${order.id}">
      <p id="adminProofStatus" style="font-size:12px;color:var(--muted);margin-top:8px;"></p>
    </div>`;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('closeOrderDetailBtn').addEventListener('click', closeOrderDetail);

  const adminDeleteProofBtn = document.getElementById('adminDeleteProofBtn');
  if (adminDeleteProofBtn) {
    adminDeleteProofBtn.addEventListener('click', async () => {
      if (!confirm('¿Eliminás el comprobante de Supabase? Asegurate de haberlo guardado en tu PC.')) return;
      adminDeleteProofBtn.disabled = true;
      adminDeleteProofBtn.textContent = 'Eliminando...';
      try {
        await deleteComprobanteFromStorage(adminDeleteProofBtn.dataset.orderId, adminDeleteProofBtn.dataset.url);
        const wrap = document.getElementById('proofImageWrap');
        if (wrap) wrap.innerHTML = '<p style="color:var(--muted);font-size:13px;margin-bottom:12px;">No se subió comprobante aún.</p>';
        adminDeleteProofBtn.remove();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
        adminDeleteProofBtn.disabled = false;
        adminDeleteProofBtn.textContent = '✕ Eliminar comprobante';
      }
    });
  }

  const adminProofInput = document.getElementById('adminProofInput');
  if (adminProofInput) {
    adminProofInput.addEventListener('change', async () => {
      const file = adminProofInput.files && adminProofInput.files[0];
      if (!file) return;
      const statusEl = document.getElementById('adminProofStatus');
      const labelEl  = document.getElementById('adminProofLabel');
      if (statusEl) statusEl.textContent = 'Subiendo...';
      if (labelEl)  labelEl.classList.add('uploading');
      try {
        const url = await uploadComprobanteToStorage(adminProofInput.dataset.orderId, file);
        const wrap = document.getElementById('proofImageWrap');
        if (wrap) wrap.innerHTML = `<img src="${url}" alt="Comprobante" style="max-width:100%;border-radius:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:12px;">`;
        const textEl = document.getElementById('adminProofText');
        if (textEl) textEl.textContent = 'Reemplazar comprobante';
        if (statusEl) { statusEl.textContent = '✓ Comprobante guardado.'; statusEl.style.color = '#25d366'; }
        if (labelEl)  labelEl.classList.remove('uploading');
        adminProofInput.value = '';
      } catch (err) {
        if (labelEl) labelEl.classList.remove('uploading');
        alert('Error al subir comprobante:\n' + err.message);
      }
    });
  }
}

function closeOrderDetail() {
  const modal = document.getElementById('orderDetailModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderProductName(item) {
  const data = loadAdminData();
  const product = cachedProducts[item.id] || data.products[item.id];
  return product ? product.nombre : item.id;
}

async function changeOrderStatus(orderId, nextStatus) {
  try {
    await updateOrderStatusInSupabase(orderId, nextStatus);
  } catch (err) {
    console.error('Error actualizando estado en Supabase:', err);
  }
  await renderBoard();
}

// ── Inventory ────────────────────────────────────────────────────
async function renderInventory() {
  const data = loadAdminData();
  const [supabaseProducts, supabaseCollections, supabaseCategories] = await Promise.all([
    fetchSupabaseProducts(),
    fetchSupabaseCollections(),
    fetchSupabaseCategories()
  ]);

  let products = (supabaseProducts && Object.keys(supabaseProducts).length) ? supabaseProducts : data.products;
  if (!products || !Object.keys(products).length) products = ADMIN_DEFAULT_DATA.products;

  const collections = (supabaseCollections && supabaseCollections.length) ? supabaseCollections : data.collections;
  const categories = (supabaseCategories && supabaseCategories.length) ? supabaseCategories : data.categories;

  cachedProducts = products;
  cachedCategories = categories;
  cachedCollections = collections;
  renderCategoryList(categories);
  renderCollectionList(collections);
  renderProductTable(products);
  populateProductSelectors(categories, collections);
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
    </div>`).join('');

  container.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      const newName = prompt('Cambiar nombre de la categoría', name);
      if (newName && newName.trim() && newName.trim() !== name) updateCategory(name, newName.trim());
    });
  });
  container.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      if (confirm(`Eliminar la categoría "${name}"?`)) deleteCategory(name);
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
    </div>`).join('');

  container.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      const newName = prompt('Cambiar nombre de la colección', name);
      if (newName && newName.trim() && newName.trim() !== name) updateCollection(name, newName.trim());
    });
  });
  container.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.value;
      if (confirm(`Eliminar la colección "${name}"?`)) deleteCollection(name);
    });
  });
}

function renderProductTable(products) {
  const body = document.getElementById('productTableBody');
  const rows = Object.values(products).sort((a, b) => a.nombre.localeCompare(b.nombre));
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
    </tr>`).join('');

  body.querySelectorAll('[data-action="edit"]').forEach(button => {
    button.addEventListener('click', () => editProduct(button.dataset.id));
  });
  body.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      if (confirm('Eliminar este producto de forma permanente?')) deleteProduct(button.dataset.id);
    });
  });
}

function populateProductSelectors(categories, collections) {
  document.getElementById('productCategory').innerHTML = categories.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('productCollection').innerHTML = collections.map(v => `<option value="${v}">${v}</option>`).join('');
}

// ── Specs y Features (listas dinámicas) ─────────────────────────
function renderSpecs() {
  const container = document.getElementById('specsList');
  if (!container) return;
  container.innerHTML = productSpecs.map((spec, i) => `
    <div class="dynamic-item spec-item">
      <input type="text" placeholder="Altura" value="${escAttr(spec[0])}" data-spec="${i}" data-field="0">
      <input type="text" placeholder="20 cm" value="${escAttr(spec[1])}" data-spec="${i}" data-field="1">
      <button type="button" class="remove-btn" data-spec="${i}">✕</button>
    </div>`).join('');

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      productSpecs[Number(input.dataset.spec)][Number(input.dataset.field)] = input.value;
    });
  });
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => { productSpecs.splice(Number(btn.dataset.spec), 1); renderSpecs(); });
  });
}

const FEATURE_EMOJIS = [
  '⚡','💡','🔆','🔅','✨','💫','🌟','⭐','🕯️','🌙',
  '🎨','🛠️','💎','📐','🏆','🎯','🏠','🌿','🍃','🌸',
  '🌺','♻️','🎁','🔌','🌈','🖤','🔶','🔮','🎭','🔋'
];

function renderFeatures() {
  const container = document.getElementById('featuresList');
  if (!container) return;
  container.innerHTML = productFeatures.map((feat, i) => `
    <div class="feature-item-wrap">
      <div class="dynamic-item feature-item">
        <input type="text" placeholder="💡" value="${escAttr(feat.icon || '')}" data-feat="${i}" data-field="icon" class="icon-input">
        <input type="text" placeholder="Título" value="${escAttr(feat.titulo || '')}" data-feat="${i}" data-field="titulo">
        <input type="text" placeholder="Descripción corta" value="${escAttr(feat.texto || '')}" data-feat="${i}" data-field="texto">
        <button type="button" class="remove-btn" data-feat="${i}">✕</button>
      </div>
      <div class="emoji-row">
        ${FEATURE_EMOJIS.map(e => `<button type="button" class="emoji-opt${feat.icon === e ? ' selected' : ''}" data-feat="${i}" data-emoji="${e}">${e}</button>`).join('')}
      </div>
    </div>`).join('');

  container.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      productFeatures[Number(input.dataset.feat)][input.dataset.field] = input.value;
    });
  });
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => { productFeatures.splice(Number(btn.dataset.feat), 1); renderFeatures(); });
  });
  container.querySelectorAll('.emoji-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.feat);
      const emoji = btn.dataset.emoji;
      productFeatures[idx].icon = emoji;
      const iconInput = container.querySelector(`input[data-feat="${idx}"][data-field="icon"]`);
      if (iconInput) iconInput.value = emoji;
      container.querySelectorAll(`.emoji-opt[data-feat="${idx}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Descuento: calcular y mostrar preview ────────────────────────
function updateDiscountPreview() {
  const priceRaw = parseAdminPrice(document.getElementById('productPrice').value);
  const pct = Number(document.getElementById('productDiscountPct').value) || 0;
  const preview = document.getElementById('discountPreview');
  if (!preview) return;
  if (priceRaw > 0 && pct > 0) {
    const final = Math.round(priceRaw * (1 - pct / 100));
    preview.textContent = `Con ${pct}% de descuento → ${formatAdminPrice(final)}`;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
}

// ── Guardar producto ─────────────────────────────────────────────
async function saveProduct() {
  const data = loadAdminData();
  const idValue = document.getElementById('productId').value;

  // Preserve fields not editable in the form from the existing cached product
  const existing = idValue ? (cachedProducts[idValue] || {}) : {};

  const nombre = document.getElementById('productName').value.trim();
  const tagline = document.getElementById('productTagline').value.trim();
  const priceRaw = parseAdminPrice(document.getElementById('productPrice').value);
  const precio = formatAdminPrice(priceRaw);
  const descuento = document.getElementById('productDiscount').value === 'true';
  const descuentoPct = Number(document.getElementById('productDiscountPct').value) || 0;
  const categoria = document.getElementById('productCategory').value;
  const coleccion = document.getElementById('productCollection').value;
  const stock = Number(document.getElementById('productStock').value) || 0;
  const featured = document.getElementById('productFeatured').value === 'true';

  const badgeText = document.getElementById('productBadgeText').value.trim();
  const badgeClass = document.getElementById('productBadgeClass').value;
  const badge = (badgeText && badgeClass) ? { texto: badgeText, clase: badgeClass } : null;

  const whatsapp = `Hola! Me interesa el ${nombre} 💡`;

  const imagenes = [...productImagesList];

  // Video
  const videoType = document.getElementById('productVideoType').value;
  let video = null;
  if (videoType === 'local') {
    const src = document.getElementById('productVideoSrc').value.trim();
    const poster = document.getElementById('productVideoPoster').value.trim();
    if (src) video = { tipo: 'local', src, poster: poster || undefined };
  } else if (videoType === 'youtube') {
    const id = document.getElementById('productVideoId').value.trim();
    const orient = document.getElementById('productVideoOrient').value || '16/9';
    if (id) video = { tipo: 'youtube', id, orientacion: orient };
  }

  const descCorta = document.getElementById('productDescCorta').value.trim();
  const descLarga = document.getElementById('productDescLarga').value.trim();

  // Precio con descuento calculado
  let precioDescuento = null;
  if (descuento && descuentoPct > 0 && priceRaw > 0) {
    precioDescuento = formatAdminPrice(Math.round(priceRaw * (1 - descuentoPct / 100)));
  }

  if (!nombre || !precio || !categoria || !coleccion) {
    alert('Completa nombre, precio, categoría y colección.');
    return;
  }

  const product = {
    id: idValue || createProductId(nombre),
    nombre,
    tagline,
    precio,
    descuento,
    descuentoPct,
    precioDescuento,
    categoria,
    coleccion,
    stock,
    featured,
    badge,
    whatsapp,
    imagenes,
    video,
    descCorta,
    descLarga,
    specs: productSpecs.filter(s => s[0] || s[1]),
    features: productFeatures.filter(f => f.titulo || f.texto),
    descripcion: descCorta,
    lampClase: existing.lampClase || '',
    videos: existing.videos || []
  };

  if (!product.id) { alert('El nombre no es válido para generar un ID.'); return; }

  if (!idValue) {
    let finalId = product.id;
    let suffix = 1;
    while (cachedProducts[finalId]) finalId = `${product.id}-${suffix++}`;
    product.id = finalId;
  }

  await saveProductToSupabase(product);
  await renderInventory();
  resetProductForm();
}

function createProductId(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function resetProductForm() {
  document.getElementById('productFormTitle').textContent = 'Agregar producto';
  document.getElementById('productId').value = '';
  document.getElementById('productName').value = '';
  document.getElementById('productTagline').value = '';
  document.getElementById('productPrice').value = '';
  document.getElementById('productDiscount').value = 'false';
  document.getElementById('productDiscountPct').value = '';
  document.getElementById('productStock').value = 0;
  document.getElementById('productFeatured').value = 'false';
  document.getElementById('productBadgeText').value = '';
  document.getElementById('productBadgeClass').value = '';
  document.getElementById('badgeFields').style.display = 'none';
  productImagesList = [];
  renderImageSlots();
  document.getElementById('productVideoType').value = '';
  document.getElementById('productVideoSrc').value = '';
  document.getElementById('productVideoPoster').value = '';
  document.getElementById('productVideoId').value = '';
  const orientEl = document.getElementById('productVideoOrient');
  if (orientEl) orientEl.value = '16/9';
  document.getElementById('productDescCorta').value = '';
  document.getElementById('productDescLarga').value = '';
  productSpecs = [];
  productFeatures = [];
  renderSpecs();
  renderFeatures();

  // Reset discount toggle
  const discountSection = document.getElementById('discountSection');
  const discountToggleBtn = document.getElementById('discountToggleBtn');
  if (discountSection) discountSection.style.display = 'none';
  if (discountToggleBtn) {
    discountToggleBtn.classList.remove('active');
    discountToggleBtn.querySelector('#discountToggleIcon').textContent = '＋';
  }

  // Reset featured toggle
  const featuredToggle = document.getElementById('featuredToggle');
  if (featuredToggle) {
    featuredToggle.classList.remove('active');
    featuredToggle.textContent = 'No destacado';
  }

  // Reset video fields
  const videoLocal = document.getElementById('videoLocalFields');
  const videoYt = document.getElementById('videoYoutubeFields');
  if (videoLocal) videoLocal.style.display = 'none';
  if (videoYt) videoYt.style.display = 'none';

  const discountPreview = document.getElementById('discountPreview');
  if (discountPreview) discountPreview.style.display = 'none';
}

function editProduct(productId) {
  const data = loadAdminData();
  const product = cachedProducts[productId] || data.products[productId];
  if (!product) return;

  document.getElementById('productFormTitle').textContent = 'Editar producto';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.nombre;
  document.getElementById('productTagline').value = product.tagline || '';
  document.getElementById('productPrice').value = parseAdminPrice(product.precio);
  document.getElementById('productCategory').value = product.categoria;
  document.getElementById('productCollection').value = product.coleccion;
  document.getElementById('productStock').value = product.stock || 0;
  productImagesList = (product.imagenes || []).slice(0, 3);
  renderImageSlots();
  document.getElementById('productDescCorta').value = product.descCorta || product.descripcion || '';
  document.getElementById('productDescLarga').value = product.descLarga || '';

  // Featured
  const featuredVal = product.featured ? 'true' : 'false';
  document.getElementById('productFeatured').value = featuredVal;
  const featuredToggle = document.getElementById('featuredToggle');
  if (featuredToggle) {
    featuredToggle.classList.toggle('active', !!product.featured);
    featuredToggle.textContent = product.featured ? '★ Destacado' : 'No destacado';
  }
  document.getElementById('badgeFields').style.display = product.featured ? 'block' : 'none';

  // Badge
  if (product.badge) {
    document.getElementById('productBadgeText').value = product.badge.texto || '';
    document.getElementById('productBadgeClass').value = product.badge.clase || '';
  } else {
    document.getElementById('productBadgeText').value = '';
    document.getElementById('productBadgeClass').value = '';
  }

  // Descuento
  const hasDiscount = !!product.descuento;
  document.getElementById('productDiscount').value = hasDiscount ? 'true' : 'false';
  const discountSection = document.getElementById('discountSection');
  const discountToggleBtn = document.getElementById('discountToggleBtn');
  if (hasDiscount) {
    discountSection.style.display = 'block';
    discountToggleBtn.classList.add('active');
    discountToggleBtn.querySelector('#discountToggleIcon').textContent = '✓';
    const pct = product.descuentoPct || 0;
    document.getElementById('productDiscountPct').value = pct;
    updateDiscountPreview();
  } else {
    discountSection.style.display = 'none';
    discountToggleBtn.classList.remove('active');
    discountToggleBtn.querySelector('#discountToggleIcon').textContent = '＋';
  }

  // Video
  const video = product.video || null;
  const videoTypeEl = document.getElementById('productVideoType');
  const videoLocal = document.getElementById('videoLocalFields');
  const videoYt = document.getElementById('videoYoutubeFields');
  if (video && video.tipo === 'local') {
    videoTypeEl.value = 'local';
    videoLocal.style.display = 'block';
    videoYt.style.display = 'none';
    document.getElementById('productVideoSrc').value = video.src || '';
    document.getElementById('productVideoPoster').value = video.poster || '';
  } else if (video && video.tipo === 'youtube') {
    videoTypeEl.value = 'youtube';
    videoLocal.style.display = 'none';
    videoYt.style.display = 'block';
    document.getElementById('productVideoId').value = video.id || '';
    const orientEl = document.getElementById('productVideoOrient');
    if (orientEl) orientEl.value = video.orientacion || '16/9';
  } else {
    videoTypeEl.value = '';
    videoLocal.style.display = 'none';
    videoYt.style.display = 'none';
  }

  // Specs
  productSpecs = (product.specs || []).map(s => Array.isArray(s) ? [s[0], s[1]] : ['', '']);
  renderSpecs();

  // Features
  productFeatures = (product.features || []).map(f => ({ icon: f.icon || '', titulo: f.titulo || '', texto: f.texto || '' }));
  renderFeatures();

  // Scroll al form
  document.getElementById('productForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteProduct(productId) {
  await deleteProductFromSupabase(productId);
  await renderInventory();
}

// ── Image slots ──────────────────────────────────────────────────
function renderImageSlots() {
  const container = document.getElementById('imageSlots');
  if (!container) return;

  let html = productImagesList.map((url, i) => `
    <div class="image-slot has-image ${i === 0 ? 'is-main' : ''}" data-index="${i}" draggable="true">
      ${i === 0 ? '<span class="slot-label">Principal</span>' : ''}
      <img src="${url}" alt="Imagen ${i + 1}">
      <button type="button" class="slot-delete" data-index="${i}">✕</button>
    </div>`).join('');

  if (productImagesList.length < 3) {
    html += `
      <div class="image-slot empty" data-index="${productImagesList.length}">
        <button type="button" class="slot-add">
          <span class="slot-add-icon">+</span>
          <span class="slot-add-text">${productImagesList.length === 0 ? 'Foto principal' : 'Agregar foto'}</span>
        </button>
      </div>`;
  }

  container.innerHTML = html;
  document.getElementById('productImages').value = productImagesList.join(', ');

  container.querySelectorAll('.slot-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      productImagesList.splice(Number(btn.dataset.index), 1);
      renderImageSlots();
    });
  });

  container.querySelectorAll('.slot-add').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('imageFileInput').click());
  });

  let dragIndex = null;
  container.querySelectorAll('.image-slot.has-image').forEach(slot => {
    slot.addEventListener('dragstart', () => {
      dragIndex = Number(slot.dataset.index);
      slot.classList.add('dragging');
    });
    slot.addEventListener('dragend', () => {
      slot.classList.remove('dragging');
      dragIndex = null;
    });
    slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', e => {
      e.preventDefault();
      slot.classList.remove('drag-over');
      const targetIndex = Number(slot.dataset.index);
      if (dragIndex !== null && dragIndex !== targetIndex) {
        const [moved] = productImagesList.splice(dragIndex, 1);
        productImagesList.splice(targetIndex, 0, moved);
        renderImageSlots();
      }
    });
  });
}

// ── Events ───────────────────────────────────────────────────────
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

  // Poster picker
  document.getElementById('posterPickerBtn').addEventListener('click', () => {
    document.getElementById('posterFileInput').click();
  });
  document.getElementById('posterFileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('productVideoPoster').value = 'LUXTOM/' + file.name;
    event.target.value = '';
  });

  // Discount toggle
  document.getElementById('discountToggleBtn').addEventListener('click', () => {
    const isActive = document.getElementById('productDiscount').value === 'true';
    const next = !isActive;
    document.getElementById('productDiscount').value = next ? 'true' : 'false';
    const section = document.getElementById('discountSection');
    const btn = document.getElementById('discountToggleBtn');
    const icon = document.getElementById('discountToggleIcon');
    section.style.display = next ? 'block' : 'none';
    btn.classList.toggle('active', next);
    icon.textContent = next ? '✓' : '＋';
    if (!next) {
      document.getElementById('productDiscountPct').value = '';
      const preview = document.getElementById('discountPreview');
      if (preview) preview.style.display = 'none';
    }
  });

  // Live discount preview
  document.getElementById('productDiscountPct').addEventListener('input', updateDiscountPreview);
  document.getElementById('productPrice').addEventListener('input', updateDiscountPreview);

  // Featured toggle
  document.getElementById('featuredToggle').addEventListener('click', () => {
    const current = document.getElementById('productFeatured').value === 'true';
    const next = !current;
    document.getElementById('productFeatured').value = next ? 'true' : 'false';
    const btn = document.getElementById('featuredToggle');
    btn.classList.toggle('active', next);
    btn.textContent = next ? '★ Destacado' : 'No destacado';
    document.getElementById('badgeFields').style.display = next ? 'block' : 'none';
    if (!next) {
      document.getElementById('productBadgeText').value = '';
      document.getElementById('productBadgeClass').value = '';
    }
  });

  // Video type toggle
  document.getElementById('productVideoType').addEventListener('change', () => {
    const tipo = document.getElementById('productVideoType').value;
    document.getElementById('videoLocalFields').style.display = tipo === 'local' ? 'block' : 'none';
    document.getElementById('videoYoutubeFields').style.display = tipo === 'youtube' ? 'block' : 'none';
  });

  // File pickers
  const imagePickerBtn = document.getElementById('imagePickerBtn');
  if (imagePickerBtn) {
    imagePickerBtn.addEventListener('click', () => document.getElementById('imageFileInput').click());
  }
  document.getElementById('imageFileInput').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file || productImagesList.length >= 3) return;

    const addBtn = document.getElementById('imageSlots').querySelector('.slot-add');
    if (addBtn) { addBtn.disabled = true; addBtn.querySelector('.slot-add-icon').textContent = '⏳'; }

    const nombre = document.getElementById('productName').value.trim();
    const productId = document.getElementById('productId').value || (nombre ? createProductId(nombre) : `temp-${Date.now()}`);

    try {
      const url = await uploadProductImageToStorage(productId, file);
      productImagesList.push(url);
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    }

    renderImageSlots();
    event.target.value = '';
  });

  document.getElementById('videoPickerBtn').addEventListener('click', () => {
    document.getElementById('videoFileInput').click();
  });
  document.getElementById('videoFileInput').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    document.getElementById('productVideoSrc').value = 'LUXTOM/videos/' + file.name;
    event.target.value = '';
  });

  // Specs
  document.getElementById('addSpecBtn').addEventListener('click', () => {
    productSpecs.push(['', '']);
    renderSpecs();
  });

  // Features
  document.getElementById('addFeatureBtn').addEventListener('click', () => {
    productFeatures.push({ icon: '', titulo: '', texto: '' });
    renderFeatures();
  });
}

function attachPermissionsEvents() {
  document.getElementById('userForm').addEventListener('submit', event => {
    event.preventDefault();
    const username = document.getElementById('userName').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    createUser(username, password, role);
  });
}

// ── Categories / Collections CRUD ───────────────────────────────
async function addCategory(value) {
  if (cachedCategories.includes(value)) { alert('La categoría ya existe.'); return; }
  await saveCategoryToSupabase(value);
  await renderInventory();
}

async function addCollection(value) {
  if (cachedCollections.includes(value)) { alert('La colección ya existe.'); return; }
  await saveCollectionToSupabase(value);
  await renderInventory();
}

async function updateCategory(oldValue, newValue) {
  if (cachedCategories.includes(newValue)) { alert('Ya existe otra categoría con ese nombre.'); return; }
  await deleteCategoryFromSupabase(oldValue);
  await saveCategoryToSupabase(newValue);
  const client = getSupabaseClient();
  if (client) await client.from('products').update({ categoria: newValue }).eq('categoria', oldValue);
  await renderInventory();
}

async function updateCollection(oldValue, newValue) {
  if (cachedCollections.includes(newValue)) { alert('Ya existe otra colección con ese nombre.'); return; }
  await deleteCollectionFromSupabase(oldValue);
  await saveCollectionToSupabase(newValue);
  const client = getSupabaseClient();
  if (client) await client.from('products').update({ coleccion: newValue }).eq('coleccion', oldValue);
  await renderInventory();
}

async function deleteCategory(name) {
  await deleteCategoryFromSupabase(name);
  await renderInventory();
}

async function deleteCollection(name) {
  await deleteCollectionFromSupabase(name);
  await renderInventory();
}

// ── Users ────────────────────────────────────────────────────────
function renderUsers() {
  const data = loadAdminData();
  const tbody = document.getElementById('userTableBody');
  const session = null;

  tbody.innerHTML = data.users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td><button type="button" data-action="delete" data-user="${user.username}">Eliminar</button></td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-action="delete"]').forEach(button => {
    button.addEventListener('click', () => {
      const username = button.dataset.user;
      if (username === session.username) { alert('No puedes eliminar tu propia sesión desde aquí.'); return; }
      if (confirm(`Eliminar la cuenta ${username}?`)) deleteUser(username);
    });
  });
}

function createUser(username, password, role) {
  const data = loadAdminData();
  if (!username || !password) { alert('Completa usuario y contraseña.'); return; }
  if (data.users.some(u => u.username === username)) { alert('Ya existe un usuario con ese nombre.'); return; }
  data.users.push({ username, password, role });
  saveAdminData(data);
  document.getElementById('userForm').reset();
  renderUsers();
}

function deleteUser(username) {
  const data = loadAdminData();
  data.users = data.users.filter(u => u.username !== username);
  saveAdminData(data);
  renderUsers();
}

// ── Config ───────────────────────────────────────────────────────
async function renderConfigSection() {
  try {
    const settings = await fetchSettings();
    const type = settings['hero_video_type'] || 'local';
    const src  = settings['hero_video_src']  || 'LUXTOM/veladoresjuntos.mp4';

    const typeEl       = document.getElementById('configVideoType');
    const localField   = document.getElementById('configVideoLocalField');
    const ytField      = document.getElementById('configVideoYoutubeField');
    if (!typeEl) return;

    typeEl.value = type;
    if (type === 'youtube') {
      const idEl = document.getElementById('configVideoId');
      if (idEl) idEl.value = src;
      if (localField) localField.style.display = 'none';
      if (ytField)    ytField.style.display    = 'block';
    } else {
      const srcEl = document.getElementById('configVideoSrc');
      if (srcEl) srcEl.value = src;
      if (localField) localField.style.display = 'block';
      if (ytField)    ytField.style.display    = 'none';
    }
  } catch(e) {
    console.error('Error en renderConfigSection:', e);
  }
}

function attachConfigEvents() {
  const typeEl = document.getElementById('configVideoType');
  if (typeEl) {
    typeEl.addEventListener('change', () => {
      const t = typeEl.value;
      document.getElementById('configVideoLocalField').style.display  = t === 'local'   ? 'block' : 'none';
      document.getElementById('configVideoYoutubeField').style.display = t === 'youtube' ? 'block' : 'none';
    });
  }

  const form = document.getElementById('configHeroForm');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const type = document.getElementById('configVideoType').value;
      const src  = type === 'youtube'
        ? document.getElementById('configVideoId').value.trim()
        : document.getElementById('configVideoSrc').value.trim();

      const statusEl = document.getElementById('configSaveStatus');
      if (statusEl) { statusEl.textContent = 'Guardando...'; statusEl.style.color = '#8f9cb4'; }

      try {
        await saveSettingToSupabase('hero_video_type', type);
        await saveSettingToSupabase('hero_video_src', src);
        if (statusEl) { statusEl.textContent = '✓ Guardado. El cambio se verá la próxima vez que se cargue el inicio.'; statusEl.style.color = '#8dffb0'; }
      } catch (err) {
        if (statusEl) { statusEl.textContent = '✗ Error al guardar: ' + err.message; statusEl.style.color = '#ff7d7d'; }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', initAdminPage);
setTimeout(() => {
  if (document.body.style.visibility !== 'visible') {
    const page = document.body.dataset.adminPage;
    if (page === 'dashboard') location.replace('admin-login.html');
    else document.body.style.visibility = 'visible';
  }
}, 4000);
