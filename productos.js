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

  "artico-alto": {
    nombre:          "Velador Ártico Alto",
    tagline:         "Luz fría · Estructura de metal · 160 cm",
    precio:          "$32.000",
    descuento:       false,
    precioDescuento: null,
    badge:           { texto: "Nuevo", clase: "badge--new" },
    featured:        false,
    categoria:       "pie",
    coleccion:       "deluxe",
    lampClase:       "lamp--cool",
    stock:           true,
    descCorta:       "Una lámpara de pie de presencia imponente. La luz fría y la estructura slim de metal negro mate le dan un carácter contemporáneo y arquitectónico.",
    specs: [
      ["Altura",        "160 cm"],
      ["Tipo de luz",   "Fría (5000 K)"],
      ["Material base", "Metal negro mate"],
      ["Pantalla",      "Metal perforado"],
      ["Casquillo",     "E27"],
      ["Incluye",       "Lámpara LED 12 W"],
    ],
    whatsapp:  "Hola! Me interesa el Velador Ártico Alto 💡",
    video:     null,
    descLarga: "El <strong>Velador Ártico Alto</strong> está diseñado para quienes quieren que la iluminación sea también una declaración de estilo. Su estructura slim de metal negro mate sube hasta los 160 cm con elegancia austera.<br><br>La luz fría de 5000 K lo hace ideal para estudios, oficinas en casa o espacios de inspiración nórdica.",
    features: [
      { icon: "❄", titulo: "Luz fría",       texto: "5000 K para máxima concentración y claridad." },
      { icon: "◈", titulo: "Perfil slim",     texto: "Estructura de metal que apenas ocupa espacio." },
      { icon: "◎", titulo: "Metal perforado", texto: "Pantalla que proyecta luz sobre el techo." },
      { icon: "⚡", titulo: "Alta potencia", texto: "LED 12 W de alta luminosidad incluido." },
    ],
    imagenes: [],
  },

  "fuego-vintage": {
    nombre:          "Velador Fuego Vintage",
    tagline:         "Luz naranja · Estilo retro · 42 cm",
    precio:          "$21.000",
    descuento:       true,
    precioDescuento: "$17.400",
    badge:           { texto: "Oferta", clase: "badge--sale" },
    featured:        false,
    categoria:       "mesa",
    coleccion:       "deluxe",
    lampClase:       "lamp--amber",
    stock:           true,
    descCorta:       "Para los que aman lo clásico de verdad. La pantalla estilo farol y la base de hierro envejecido crean una pieza con alma de otra época, perfecta para ambientes con identidad propia.",
    specs: [
      ["Altura",        "42 cm"],
      ["Tipo de luz",   "Naranja cálida"],
      ["Material base", "Hierro envejecido"],
      ["Pantalla",      "Vidrio ámbar"],
      ["Casquillo",     "E27"],
      ["Incluye",       "Lámpara filamento 8 W"],
    ],
    whatsapp:  "Hola! Me interesa el Velador Fuego Vintage 💡",
    video:     null,
    descLarga: "El <strong>Velador Fuego Vintage</strong> rinde homenaje a la iluminación de principios del siglo XX. La base de hierro con textura envejecida y la pantalla de vidrio ámbar recrean esa calidez con materiales contemporáneos y mayor durabilidad.<br><br>La bombilla de filamento visible añade ese toque de nostalgia que lo convierte en el centro de atención de cualquier rincón.",
    features: [
      { icon: "✦", titulo: "Estilo retro",       texto: "Diseño inspirado en la iluminación del 1900." },
      { icon: "◎", titulo: "Hierro envejecido",  texto: "Base con textura y pátina auténtica." },
      { icon: "◇", titulo: "Vidrio ámbar",       texto: "Pantalla de vidrio soplado de tono único." },
      { icon: "☀", titulo: "Filamento visible",  texto: "Bombilla de filamento decorativo 8 W incluida." },
    ],
    imagenes: [],
  },

  "pared-blanc": {
    nombre:          "Aplique Pared Blanc",
    tagline:         "Luz blanca · Aplique empotrado · 22 cm",
    precio:          "$11.800",
    descuento:       false,
    precioDescuento: null,
    badge:           null,
    featured:        false,
    categoria:       "pared",
    coleccion:       "simple",
    lampClase:       "lamp--white",
    stock:           true,
    descCorta:       "Un aplique mural de diseño limpio que funciona tanto como iluminación funcional como elemento decorativo. Perfecto para pasillos, cabeceras de cama o entradas.",
    specs: [
      ["Ancho",       "22 cm"],
      ["Tipo de luz", "Blanca (4000 K)"],
      ["Material",    "Hierro blanco mate"],
      ["Montaje",     "Pared — incluye herrajes"],
      ["Casquillo",   "E14"],
      ["Incluye",     "Lámpara LED 7 W"],
    ],
    whatsapp:  "Hola! Me interesa el Aplique Pared Blanc 💡",
    video:     null,
    descLarga: "El <strong>Aplique Pared Blanc</strong> es la solución perfecta para iluminar sin ocupar espacio en la mesita o el escritorio. Su diseño minimalista en hierro blanco mate se integra en cualquier estilo decorativo.<br><br>Viene con todos los herrajes necesarios para la instalación y la bombilla LED incluida.",
    features: [
      { icon: "◈", titulo: "Ahorra espacio",    texto: "Va directo a la pared." },
      { icon: "☀", titulo: "Luz blanca",        texto: "4000 K para iluminación funcional." },
      { icon: "◎", titulo: "Hierro mate",       texto: "Acabado mate que envejece con elegancia." },
      { icon: "◇", titulo: "Fácil instalación", texto: "Incluye herrajes y manual de montaje." },
    ],
    imagenes: [],
  },

  "esfera-gris": {
    nombre:          "Velador Esfera Gris",
    tagline:         "Luz difusa · Pantalla esférica · 30 cm",
    precio:          "$14.200",
    descuento:       false,
    precioDescuento: null,
    badge:           { texto: "Top ventas", clase: "badge--hot" },
    featured:        false,
    categoria:       "mesa",
    coleccion:       "simple",
    lampClase:       "lamp--neutral",
    stock:           true,
    descCorta:       "La pantalla esférica de vidrio opalino dispersa la luz en todas direcciones, creando un ambiente suave y uniforme sin sombras duras.",
    specs: [
      ["Altura",        "30 cm"],
      ["Tipo de luz",   "Difusa neutra (3000 K)"],
      ["Material base", "Mármol gris"],
      ["Pantalla",      "Vidrio opalino"],
      ["Casquillo",     "E27"],
      ["Incluye",       "Lámpara LED 8 W"],
    ],
    whatsapp:  "Hola! Me interesa el Velador Esfera Gris 💡",
    video:     null,
    descLarga: "El <strong>Velador Esfera Gris</strong> combina dos materiales nobles: el mármol gris de la base y el vidrio opalino de la pantalla esférica. La esfera actúa como difusor total, eliminando sombras y distribuyendo la luz de manera pareja en todo el ambiente.<br><br>Su escala compacta lo hace ideal para mesitas de luz.",
    features: [
      { icon: "◎", titulo: "Luz 360°",           texto: "La esfera opalina difunde en todas las direcciones." },
      { icon: "◈", titulo: "Base de mármol",     texto: "Mármol gris natural, cada base tiene vetas únicas." },
      { icon: "◇", titulo: "Vidrio opalino",     texto: "Pantalla soplada a mano de grosor uniforme." },
      { icon: "☀", titulo: "Sin sombras duras",  texto: "Luz suave ideal para quienes trabajan en pantallas." },
    ],
    imagenes: [],
  },

  "rose-slim": {
    nombre:          "Velador Rose Slim",
    tagline:         "Luz rosada · Estructura slim · 155 cm",
    precio:          "$28.500",
    descuento:       false,
    precioDescuento: null,
    badge:           null,
    featured:        false,
    categoria:       "pie",
    coleccion:       "deluxe",
    lampClase:       "lamp--rose",
    stock:           true,
    descCorta:       "La versión de pie del clásico rosa. Estructura ultra delgada de acero pintado con una pantalla de tela rosada que crea el ambiente más sofisticado sin ocupar espacio visual.",
    specs: [
      ["Altura",        "155 cm"],
      ["Tipo de luz",   "Rosada cálida"],
      ["Material base", "Acero slim pintado"],
      ["Pantalla",      "Tela rosada"],
      ["Casquillo",     "E14"],
      ["Incluye",       "Lámpara LED 6 W"],
    ],
    whatsapp:  "Hola! Me interesa el Velador Rose Slim 💡",
    video:     null,
    descLarga: "El <strong>Velador Rose Slim</strong> lleva el universo estético del Rosa Noche a una escala de pie. La estructura slim de acero pintado sube con gracia hasta los 155 cm sin parecer pesada ni invasiva.<br><br>Ideal para rincones de lectura, espacios de meditación o dormitorios con personalidad.",
    features: [
      { icon: "✦", titulo: "Perfil de lujo", texto: "Estructura ultra fina que sube con elegancia." },
      { icon: "◇", titulo: "Tela rosada",    texto: "Mismo tejido que el Rosa Noche." },
      { icon: "◎", titulo: "Acero pintado",  texto: "Acabado suave al tacto, resistente." },
      { icon: "⚡", titulo: "Bajo consumo", texto: "LED 6 W incluido." },
    ],
    imagenes: [],
  },

  "ambar-industrial": {
    nombre:          "Aplique Ámbar Industrial",
    tagline:         "Luz cálida · Estilo industrial · 28 cm",
    precio:          "$13.500",
    descuento:       true,
    precioDescuento: "$10.900",
    badge:           { texto: "Oferta", clase: "badge--sale" },
    featured:        false,
    categoria:       "pared",
    coleccion:       "simple",
    lampClase:       "lamp--amber",
    stock:           true,
    descCorta:       "Hierro negro, tubo de acero y vidrio ámbar. Un aplique con actitud industrial que lleva calidez a la pared sin concesiones estéticas. Para espacios que hablan fuerte.",
    specs: [
      ["Ancho",       "28 cm"],
      ["Tipo de luz", "Cálida naranja"],
      ["Material",    "Hierro negro + acero"],
      ["Pantalla",    "Vidrio ámbar"],
      ["Montaje",     "Pared — incluye herrajes"],
      ["Casquillo",   "E27"],
    ],
    whatsapp:  "Hola! Me interesa el Aplique Ámbar Industrial 💡",
    video:     null,
    descLarga: "El <strong>Aplique Ámbar Industrial</strong> toma los códigos visuales de la arquitectura de fábrica y los lleva al interior con refinamiento.<br><br>Recomendado especialmente para cocinas de estilo loft, livings con piso de hormigón o bares con identidad propia.",
    features: [
      { icon: "◈", titulo: "Estilo industrial", texto: "Tubo de acero y hierro negro sin concesiones." },
      { icon: "◎", titulo: "Vidrio ámbar",      texto: "Globo de vidrio que calidifica la luz naranja." },
      { icon: "✦", titulo: "En conjunto",       texto: "Multiplicá el efecto usando 2 o 3 en la misma pared." },
      { icon: "◇", titulo: "Fácil montaje",     texto: "Incluye herrajes, instalable en 15 minutos." },
    ],
    imagenes: [],
  },

};


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
