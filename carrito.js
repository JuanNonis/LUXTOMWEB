const CART_KEY = 'LUXTOM_cart';
const SUPPORT_WHATSAPP_NUMBER = '5491173689423';
const CHECKOUT_CVU = '0000000000000000000000';
const CHECKOUT_ALIAS = 'luxtom.pago';
const CHECKOUT_BANK = 'Banco LUXTOM';

function parsePrice(value) {
  return Number(String(value).replace(/[^0-9]/g, '')) || 0;
}

function formatPrice(value) {
  return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateNavCartCount();
  renderCartPage();
  renderCheckoutPage();
}

function cartItemCount(cart = getCart()) {
  return Object.values(cart).reduce((sum, qty) => sum + Math.max(0, Number(qty)), 0);
}

function cartItems(cart = getCart()) {
  return Object.entries(cart)
    .map(([id, qty]) => ({ id, qty: Number(qty), producto: PRODUCTOS[id] }))
    .filter(item => item.producto && item.qty > 0);
}

function cartSubtotal(cart = getCart()) {
  return cartItems(cart).reduce((total, item) => {
    const price = parsePrice(item.producto.precioDescuento || item.producto.precio);
    return total + price * item.qty;
  }, 0);
}

function updateNavCartCount() {
  const counter = document.getElementById('navCartCount');
  if (!counter) return;
  const count = cartItemCount();
  counter.textContent = count;
  counter.classList.toggle('has-items', count > 0);
}

function addToCart(id, amount = 1) {
  const producto = PRODUCTOS[id];
  if (!producto) return;

  const cart = getCart();
  const current = Math.max(0, Number(cart[id] || 0));
  cart[id] = current + Number(amount);

  if (cart[id] <= 0) {
    delete cart[id];
  }

  saveCart(cart);
  showCartNotification(`${producto.nombre} agregado al carrito (${cart[id]} unidad${cart[id] === 1 ? '' : 'es'})`);
}

function setCartQuantity(id, amount) {
  const cart = getCart();
  if (amount > 0) {
    cart[id] = amount;
  } else {
    delete cart[id];
  }
  saveCart(cart);
}

function removeCartItem(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
}

function showCartNotification(message) {
  const existing = document.getElementById('cart-toast');
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.className = 'cart-toast';
  toast.textContent = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));

  window.setTimeout(() => toast.classList.remove('visible'), 2600);
  window.setTimeout(() => toast.remove(), 3000);
}

function buildCheckoutMessage() {
  const items = cartItems();
  if (!items.length) {
    return 'Hola! Quiero armar un pedido en LUXTOM.';
  }

  const lines = items.map(item => {
    const price = formatPrice(parsePrice(item.producto.precioDescuento || item.producto.precio));
    return `- ${item.producto.nombre} x${item.qty} (${price} c/u)`;
  });

  const total = formatPrice(cartSubtotal());
  return `Hola! Estoy interesado en este pedido de LUXTOM:\n${lines.join('\n')}\nTotal: ${total}`;
}

function renderCartPage() {
  const itemsContainer = document.getElementById('cartItems');
  const summaryCount = document.getElementById('cartItemCount');
  const summaryTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const emptyState = document.getElementById('cartEmpty');

  if (!itemsContainer || !summaryTotal || !checkoutBtn) return;

  const items = cartItems();

  if (!items.length) {
    itemsContainer.innerHTML = '';
    summaryCount.textContent = '0';
    summaryTotal.textContent = formatPrice(0);
    emptyState.style.display = 'block';
    checkoutBtn.href = '#';
    checkoutBtn.textContent = 'Tu carrito está vacío';
    checkoutBtn.classList.add('btn-disabled');
    return;
  }

  emptyState.style.display = 'none';
  summaryCount.textContent = items.reduce((sum, item) => sum + item.qty, 0);
  summaryTotal.textContent = formatPrice(cartSubtotal());
  checkoutBtn.href = 'checkout.html';
  checkoutBtn.textContent = 'Finalizar compra';
  checkoutBtn.classList.remove('btn-disabled');

  // El botón de "Finalizar compra" solo redirige a checkout; la orden se crea
  // cuando el usuario confirma y toca el botón de WhatsApp en checkout.html.

  itemsContainer.innerHTML = items.map(item => {
    const price = parsePrice(item.producto.precioDescuento || item.producto.precio);
    const subtotal = formatPrice(price * item.qty);
    const image = item.producto.imagenes && item.producto.imagenes.length > 0
      ? item.producto.imagenes[0]
      : null;

    return `
      <article class="cart-item">
        <div class="cart-item__image">
          ${image ? `<img src="${image}" alt="${item.producto.nombre}">` : `<div class="cart-item__placeholder"></div>`}
        </div>
        <div class="cart-item__content">
          <div class="cart-item__header">
            <div>
              <h3>${item.producto.nombre}</h3>
              <p>${item.producto.tagline}</p>
            </div>
            <button type="button" class="cart-item__remove" data-id="${item.id}">Eliminar</button>
          </div>
          <div class="cart-item__meta">
            <span>${formatPrice(price)} cada uno</span>
            <span>Subtotal: <strong>${subtotal}</strong></span>
          </div>
          <div class="cart-item__qty">
            <button type="button" class="qty-button" data-action="decrease" data-id="${item.id}">-</button>
            <input type="number" min="1" value="${item.qty}" data-id="${item.id}">
            <button type="button" class="qty-button" data-action="increase" data-id="${item.id}">+</button>
          </div>
        </div>
      </article>`;
  }).join('');

  itemsContainer.querySelectorAll('.qty-button').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const action = button.dataset.action;
      const current = Number(getCart()[id] || 1);
      const next = action === 'increase' ? current + 1 : Math.max(1, current - 1);
      setCartQuantity(id, next);
    });
  });

  itemsContainer.querySelectorAll('.cart-item__content input[type="number"]').forEach(input => {
    input.addEventListener('change', () => {
      const id = input.dataset.id;
      const next = Math.max(1, Number(input.value) || 1);
      input.value = next;
      setCartQuantity(id, next);
    });
  });

  itemsContainer.querySelectorAll('.cart-item__remove').forEach(button => {
    button.addEventListener('click', () => removeCartItem(button.dataset.id));
  });
}

function buildReceiptMessage() {
  const items = cartItems();
  if (!items.length) {
    return 'Hola! Ya realicé el pago y adjunto el comprobante de la transferencia.';
  }

  const lines = items.map(item => {
    const price = formatPrice(parsePrice(item.producto.precioDescuento || item.producto.precio));
    return `- ${item.producto.nombre} x${item.qty} (${price} c/u)`;
  });

  const total = formatPrice(cartSubtotal());
  return `Hola! Ya realicé la transferencia al CVU de LUXTOM. Adjunto comprobante.\n${lines.join('\n')}\nTotal: ${total}`;
}

function renderCheckoutPage() {
  const checkoutItems = document.getElementById('checkoutItems');
  const totalEl = document.getElementById('checkoutTotal');
  const itemCountEl = document.getElementById('checkoutItemCount');
  const cvuEl = document.getElementById('checkoutCvu');
  const aliasEl = document.getElementById('checkoutAlias');
  const bankEl = document.getElementById('checkoutBank');
  const sendBtn = document.getElementById('sendReceiptBtn');
  const emptyState = document.getElementById('checkoutEmpty');

  if (!checkoutItems || !totalEl || !itemCountEl || !cvuEl || !aliasEl || !bankEl || !sendBtn) return;

  const items = cartItems();
  if (!items.length) {
    checkoutItems.innerHTML = '';
    itemCountEl.textContent = '0';
    totalEl.textContent = formatPrice(0);
    emptyState.style.display = 'block';
    sendBtn.href = '#';
    sendBtn.classList.add('btn-disabled');
    return;
  }

  emptyState.style.display = 'none';
  itemCountEl.textContent = items.reduce((sum, item) => sum + item.qty, 0);
  totalEl.textContent = formatPrice(cartSubtotal());
  cvuEl.textContent = CHECKOUT_CVU;
  aliasEl.textContent = CHECKOUT_ALIAS;
  bankEl.textContent = CHECKOUT_BANK;
  sendBtn.href = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(buildReceiptMessage())}`;
  sendBtn.classList.remove('btn-disabled');

  checkoutItems.innerHTML = items.map(item => {
    const price = parsePrice(item.producto.precioDescuento || item.producto.precio);
    const subtotal = formatPrice(price * item.qty);
    return `
      <div class="checkout-item">
        <strong>${item.producto.nombre}</strong>
        <span>${item.qty} x ${formatPrice(price)}</span>
        <span>${subtotal}</span>
      </div>`;
  }).join('');
}

function setupProductPageCart(productId) {
  const qtyInput = document.getElementById('js-qty-input');
  const addBtn = document.getElementById('js-add-cart');
  if (!qtyInput || !addBtn) return;

  addBtn.addEventListener('click', () => {
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    addToCart(productId, qty);
  });

  const changeQty = (amount) => {
    const current = Math.max(1, Number(qtyInput.value) || 1);
    qtyInput.value = Math.max(1, current + amount);
  };

  const decrease = document.getElementById('js-qty-decrease');
  const increase = document.getElementById('js-qty-increase');
  if (decrease) decrease.addEventListener('click', () => changeQty(-1));
  if (increase) increase.addEventListener('click', () => changeQty(1));
}

function initCartUI() {
  updateNavCartCount();
  renderCartPage();
  renderCheckoutPage();
}

window.addToCart = addToCart;
window.setCartQuantity = setCartQuantity;
window.removeCartItem = removeCartItem;
window.setupProductPageCart = setupProductPageCart;

window.addEventListener('DOMContentLoaded', initCartUI);
