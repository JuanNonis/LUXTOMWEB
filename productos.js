/* ════════════════════════════════════════════════════════════════
   PRODUCTOS.JS — Base de datos de todos los veladores LUXTOM
   ────────────────────────────────────────────────────────────────
   CÓMO EDITAR UN PRODUCTO:

   · precio          → precio normal (se tacha si descuento: true)
   · descuento       → true/false — activa el precio tachado
   · precioDescuento → precio final con descuento (solo si descuento: true)
   · featured        → true = aparece en "Nuestros favoritos" del inicio
   · categoria       → "mesa" | "pie" | "pared"  (filtros del Shop)
   · coleccion       → "simple" | "deluxe"      (nuevos filtros del Shop)
                       Los productos con descuento:true se agregan solos al filtro Ofertas
   · imagenes        → ["foto1.jpg", "foto2.jpg", ...]
                       Primera foto = portada en todas las tarjetas
   · video           → null
                    ó { tipo: "youtube", id: "VIDEO_ID" }
                    ó { tipo: "local",   src: "video.mp4", poster: "portada.jpg" }
════════════════════════════════════════════════════════════════ */

const PRODUCTOS = {

  "velador-tom": {
    nombre:          "Velador TOM",
    tagline:         "minimalista · luz LED · 20 cm",
    precio:          "$20.000",
    descuento:       false,
    precioDescuento: null,
    badge:           { texto: "Nuevo", clase: "badge--new" },
    featured:        true,
    categoria:       "mesa",
    coleccion:       "simple",
    lampClase:       "lamp--warm",
    stock:           true,
    descCorta:       "Un velador moderno y minimalista con un diseño que decora tu espacio. La luz cálida que proyecta crea un ambiente íntimo, perfecto para dormitorios y livings.",
    specs: [
      ["Altura",        "20 cm"],
      ["Tipo de luz",   "LED"],
      ["Material",      "PLA impreso en 3D"],
      ["Portalámparas", "E27"],
    ],
    whatsapp:  "Hola! Me interesa el Velador TOM 💡",
    video:     { tipo: "local", src: "LUXTOM/videos%20terminados/TOM/Atom_video_si.mp4", poster: "20260206_155859.jpg" },
    descLarga: "El <strong>Velador TOM</strong> nace de la búsqueda de un equilibrio perfecto entre lo moderno y minimalista. Su diseño limpio y geométrico se integra con facilidad en cualquier estilo decorativo, mientras que la luz cálida que emite crea un ambiente acogedor y relajante.<br><br>Fabricado con tecnología de impresión 3D en PLA, cada velador es una pieza única que combina innovación y estética. Ideal para quienes buscan una lámpara de mesa que sea tanto funcional como un elemento de diseño distintivo.",
    features: [
      { icon: "☀", titulo: "Luz cálida",    texto: "2700 K para ambientes íntimos y acogedores." },
      { icon: "◎", titulo: "Luz fría",      texto: "6000 K para ambientes neutros." },
      { icon: "◇", titulo: "Luz ideal",     texto: "Recomendado bombillas E27 \"gotita\"." },
      { icon: "⚡", titulo: "No halógenas", texto: "Solo compatible con luces LED." },
    ],
    imagenes: ["LUXTOM/IMG_0029.jpeg"],
  },

  "velador-tili": {
    nombre:          "Velador TILI",
    tagline:         "minimalista · luz LED · 20 cm",
    precio:          "$20.000",
    descuento:       false,
    precioDescuento: null,
    badge:           { texto: "Top ventas", clase: "badge--hot" },
    featured:        true,
    categoria:       "mesa",
    coleccion:       "simple",
    lampClase:       "lamp--neutral",
    stock:           true,
    descCorta:       "Un velador moderno y minimalista con un diseño ondulado como olas que decora tu espacio con suavidad. La luz cálida que proyecta crea un ambiente íntimo, perfecto para dormitorios y livings.",
    specs: [
      ["Altura",        "20 cm"],
      ["Tipo de luz",   "LED"],
      ["Material",      "PLA impreso en 3D"],
      ["Portalámparas", "E27"],
    ],
    whatsapp:  "Hola! Me interesa el Velador TILI 💡",
    video:     { tipo: "local", src: "LUXTOM/videos%20terminados/tili_video_si.mp4", poster: "20260206_155859.jpg" },
    descLarga: "El <strong>Velador TILI</strong> nace de la búsqueda de un ambiente relajante. Su diseño ondulado como olas se integra con facilidad en cualquier estilo decorativo dandole al ambiente una sensacion de tranquilidad, mientras que la luz que emite crea un ambiente acogedor y relajante.<br><br>Fabricado con tecnología de impresión 3D en PLA, cada velador es una pieza única que combina innovación y estética. Ideal para quienes buscan una lámpara de mesa que sea tanto funcional como un elemento de diseño distintivo.",
    features: [
      { icon: "☀", titulo: "Luz cálida",    texto: "2700 K para ambientes íntimos y acogedores." },
      { icon: "◎", titulo: "Luz fría",      texto: "6000 K para ambientes neutros." },
      { icon: "◇", titulo: "Luz ideal",     texto: "Recomendado bombillas E27 \"gotita\"." },
      { icon: "⚡", titulo: "No halógenas", texto: "Solo compatible con luces LED." },
    ],
    imagenes: ["LUXTOM/IMG_0067.jpeg"],
  },

  "velador-spiral": {
    nombre:          "Velador SPIRAL",
    tagline:         "Luz rosada · Diseño romántico · 38 cm",
    precio:          "$20.000",
    descuento:       false,
    precioDescuento: null,
    badge:           { texto: "Oferta", clase: "badge--sale" },
    featured:        true,
    categoria:       "mesa",
    coleccion:       "simple",
    lampClase:       "lamp--rose",
    stock:           true,
    descCorta:       "Una pieza pensada para crear el ambiente más íntimo. La pantalla difumina una luz rosada suave que transforma cualquier dormitorio en un espacio de calma y romanticismo.",
    specs: [
      ["Altura",        "20 cm"],
      ["Tipo de luz",   "LED"],
      ["Material",      "PLA impreso en 3D"],
      ["Portalámparas", "E27"],
    ],
    whatsapp:  "Hola! Me interesa el Velador SPIRAL 💡",
    video:     { tipo: "local", src: "LUXTOM/videos%20terminados/SPIRAL/Aspiral_video_si.mp4", poster: "20260206_155859.jpg" },
    descLarga: "El <strong>Velador SPIRAL</strong> nació de la idea de que la luz puede ser tan importante como el perfume o la música a la hora de crear un ambiente special y sofisticado. Su pantalla elegante genera una iluminación cálida, envolvente y delicada.",
    features: [
      { icon: "☀", titulo: "Luz cálida",    texto: "2700 K para ambientes íntimos y acogedores." },
      { icon: "◎", titulo: "Luz fría",      texto: "6000 K para ambientes neutros." },
      { icon: "◇", titulo: "Luz ideal",     texto: "Recomendado bombillas E27 \"gotita\"." },
      { icon: "⚡", titulo: "No halógenas", texto: "Solo compatible con luces LED." },
    ],
    imagenes: ["LUXTOM/IMG_0619.jpeg"],
  },

  
};


window._productosCache = null;

async function getProductos() {
  if (window._productosCache) return window._productosCache;
  try {
    const client = globalThis.supabase || null;
    if (!client) { window._productosCache = PRODUCTOS; return window._productosCache; }
    const { data, error } = await client.from('products').select('*');
    if (error || !data || !data.length) { window._productosCache = PRODUCTOS; return window._productosCache; }
    window._productosCache = data.reduce((acc, row) => {
      acc[row.id] = {
        nombre: row.nombre,
        tagline: row.tagline,
        precio: row.precio,
        descuento: row.descuento,
        precioDescuento: row.precio_descuento || null,
        categoria: row.categoria,
        coleccion: row.coleccion,
        stock: row.stock,
        imagenes: row.imagenes || [],
        descCorta: row.desc_corta || row.descripcion || '',
        descLarga: row.desc_larga || '',
        specs: row.specs || [],
        features: row.features || [],
        badge: row.badge || null,
        featured: row.featured || false,
        lampClase: row.lamp_clase || '',
        whatsapp: row.whatsapp || '',
        video: row.video || null
      };
      return acc;
    }, {});
  } catch(e) {
    window._productosCache = PRODUCTOS;
  }
  return window._productosCache;
}

/* ════ FUNCIÓN COMPARTIDA — Genera el HTML de una tarjeta de producto ════ */
function renderCard(id, p) {
  const url  = `producto.html?id=${id}`;
  const cats = [p.categoria, p.coleccion, p.descuento ? 'oferta' : ''].filter(Boolean).join(' ');

  // Imagen real o placeholder CSS
  const imgInner = (p.imagenes && p.imagenes.length > 0)
    ? `<img src="${p.imagenes[0]}" alt="${p.nombre}"
         style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`
    : `<div class="product-card__placeholder ${p.lampClase}">
         <div class="lamp-thumb">
           <div class="lamp-thumb__glow"></div>
           <div class="lamp-thumb__shade"></div>
           <div class="lamp-thumb__neck"></div>
           <div class="lamp-thumb__base"></div>
         </div>
       </div>`;

  const badge = p.badge
    ? `<span class="product-card__badge ${p.badge.clase}">${p.badge.texto}</span>`
    : '';

  // Precio: tachado si descuento:true
  const precioHTML = (p.descuento && p.precioDescuento)
    ? `<div>
         <span class="product-card__price-old">${p.precio}</span>
         <span class="product-card__price">${p.precioDescuento}</span>
       </div>`
    : `<span class="product-card__price">${p.precio}</span>`;

  return `
  <div class="product-card" data-cat="${cats}"
       onclick="location.href='${url}'" style="cursor:pointer;">
    <div class="product-card__img">
      ${imgInner}
      ${badge}
      <div class="product-card__overlay">
        <a href="${url}" class="product-card__quick-btn">Ver detalles &rarr;</a>
      </div>
    </div>
    <div class="product-card__info">
      <h3 class="product-card__name">${p.nombre}</h3>
      <p class="product-card__desc">${p.tagline}</p>
      <div class="product-card__footer">
        ${precioHTML}
        <button type="button" class="product-card__add" onclick="event.stopPropagation(); addToCart('${id}', 1);" aria-label="Agregar ${p.nombre} al carrito">+</button>
      </div>
    </div>
  </div>`;
}
