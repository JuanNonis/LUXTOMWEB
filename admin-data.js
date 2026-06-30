const ADMIN_DEFAULT_DATA = {
  categories: ['mesa', 'pie', 'pared'],
  collections: ['simple', 'deluxe'],
  products: {
    'velador-tom': {
      id: 'velador-tom',
      nombre: 'Velador TOM',
      tagline: 'minimalista · luz LED · 20 cm',
      precio: '$20.000',
      descuento: false,
      precioDescuento: null,
      categoria: 'mesa',
      coleccion: 'simple',
      stock: 12,
      imagenes: ['LUXTOM/IMG_0029.jpeg'],
      descripcion: 'Un velador moderno y minimalista que aporta calidez a cualquier espacio.'
    },
    'velador-spiral': {
      id: 'velador-spiral',
      nombre: 'Velador SPIRAL',
      tagline: 'luz rosada · diseño romántico · 38 cm',
      precio: '$20.000',
      descuento: false,
      precioDescuento: null,
      categoria: 'mesa',
      coleccion: 'simple',
      stock: 8,
      imagenes: ['LUXTOM/IMG_0619.jpeg'],
      descripcion: 'Diseño romántico que crea una atmósfera íntima y sofisticada.'
    }
  },
  orders: [
    {
      id: 'pedido-001',
      cliente: 'Ana Ruiz',
      productos: [
        { id: 'velador-tom', cantidad: 1 },
        { id: 'velador-spiral', cantidad: 1 }
      ],
      total: '$40.000',
      estado: 'venta en proceso, esperando comprobante',
      fecha: '2026-06-01',
      notas: 'Entrega en la mañana',
      comprobante: null
    },
    {
      id: 'pedido-002',
      cliente: 'Lucas Fernández',
      productos: [
        { id: 'velador-tom', cantidad: 2 }
      ],
      total: '$40.000',
      estado: 'preparando pedido',
      fecha: '2026-06-01',
      notas: 'Pedido para retirar en local',
      comprobante: null
    },
    {
      id: 'pedido-003',
      cliente: 'María Gómez',
      productos: [
        { id: 'velador-spiral', cantidad: 1 }
      ],
      total: '$20.000',
      estado: 'pedido en camino',
      fecha: '2026-05-31',
      notas: 'Enviar por moto',
      comprobante: null
    }
  ],
  users: [
    {
      username: 'juanN',
      password: 'Yrelpasion12',
      role: 'owner'
    }
  ]
};

function getSupabaseClient() {
  return globalThis.supabase || (typeof supabase !== 'undefined' ? supabase : null);
}

async function fetchSupabaseOrders() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('orders').select('*');
  if (error) {
    console.error('Error al leer pedidos de Supabase:', error);
    return null;
  }
  return (data || []).map(row => ({
    id: row.id,
    cliente: row.cliente,
    telefono: row.telefono || '',
    mail: row.mail || '',
    direccion: row.direccion || '',
    codigo_postal: row.codigo_postal || '',
    metodo_envio: row.metodo_envio || '',
    costo_envio: row.costo_envio ?? null,
    productos: row.productos || [],
    total: row.total,
    estado: row.estado,
    fecha: row.fecha,
    comprobante_url: row.comprobante_url || null
  }));
}

async function uploadFileToStorage(orderId, file) {
  const client = getSupabaseClient();
  if (!client) throw new Error('No hay cliente Supabase disponible.');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${orderId}/comprobante.${ext}`;

  const { error: uploadError } = await client.storage
    .from('comprobantes')
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error('Storage: ' + uploadError.message);

  const { data: urlData } = client.storage.from('comprobantes').getPublicUrl(path);
  return urlData.publicUrl;
}

async function uploadComprobanteToStorage(orderId, file) {
  const url = await uploadFileToStorage(orderId, file);

  const client = getSupabaseClient();
  const { error: updateError } = await client
    .from('orders')
    .update({ comprobante_url: url })
    .eq('id', orderId);

  if (updateError) throw new Error('Supabase: ' + updateError.message);

  return url;
}

async function fetchSupabaseProducts() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('products').select('*');
  if (error) {
    console.error('Error al leer productos de Supabase:', error);
    return null;
  }
  return (data || []).reduce((result, row) => {
    const product = {
      id: row.id,
      nombre: row.nombre,
      tagline: row.tagline,
      precio: row.precio,
      descuento: row.descuento,
      precioDescuento: row.precio_descuento || null,
      categoria: row.categoria,
      coleccion: row.coleccion,
      stock: row.stock,
      imagenes: row.imagenes || [],
      videos: row.videos || [],
      descripcion: row.descripcion
    };
    result[product.id] = product;
    return result;
  }, {});
}

async function saveOrderToSupabase(order) {
  const client = getSupabaseClient();
  if (!client) {
    console.error('No hay cliente Supabase disponible para guardar la orden.');
    return null;
  }

  const numericTotal = Number(String(order.total).replace(/[^0-9]/g, '')) || 0;
  const numericShipping = (order.costo_envio !== null && order.costo_envio !== undefined)
    ? Number(order.costo_envio) || 0
    : null;
  const row = {
    id: order.id,
    cliente: order.cliente,
    telefono: order.telefono || null,
    mail: order.mail || null,
    direccion: order.direccion || null,
    codigo_postal: order.codigo_postal || null,
    metodo_envio: order.metodo_envio || null,
    costo_envio: numericShipping,
    productos: order.productos,
    total: numericTotal,
    estado: order.estado,
    fecha: order.fecha,
    comprobante_url: order.comprobante_url || null
  };

  // Evitar enviar columnas vacías (p. ej. 'notas' inexistente en la tabla)
  const sanitized = Object.assign({}, row);
  Object.keys(sanitized).forEach(key => {
    const val = sanitized[key];
    if (val === null || typeof val === 'undefined') {
      delete sanitized[key];
      return;
    }
    if (typeof val === 'string' && val.trim() === '') {
      delete sanitized[key];
      return;
    }
    if (Array.isArray(val) && val.length === 0) {
      delete sanitized[key];
      return;
    }
  });

  let data = null;
  let error = null;
  try {
    const res = await client.from('orders').insert([sanitized]);
    data = res.data || null;
    error = res.error || null;
  } catch (err) {
    console.error('Exception calling Supabase insert:', err);
    error = err;
  }

  console.log('Supabase saveOrderToSupabase', { row, sanitized, data, error });

  if (error) {
    const msg = error.message || error.details || JSON.stringify(error);
    throw new Error('Supabase: ' + msg);
  }

  return (Array.isArray(data) && data[0]) ? data[0] : order;
}

async function saveProductToSupabase(product) {
  const client = getSupabaseClient();
  if (!client) return null;
  const row = {
    id: product.id,
    nombre: product.nombre,
    tagline: product.tagline,
    precio: product.precio,
    descuento: product.descuento,
    precio_descuento: product.precioDescuento || null,
    categoria: product.categoria,
    coleccion: product.coleccion,
    stock: product.stock,
    imagenes: product.imagenes,
    videos: product.videos || [],
    descripcion: product.descripcion,
    desc_corta: product.descCorta || null,
    desc_larga: product.descLarga || null,
    specs: product.specs || [],
    features: product.features || [],
    badge: product.badge || null,
    featured: product.featured || false,
    lamp_clase: product.lampClase || null,
    whatsapp: product.whatsapp || null,
    video: product.video || null
  };
  const { error } = await client.from('products').upsert([row], { onConflict: 'id' });
  if (error) {
    console.error('Error al guardar el producto en Supabase:', error);
    return null;
  }
  return product;
}

async function deleteProductFromSupabase(productId) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { error } = await client.from('products').delete().eq('id', productId);
  if (error) {
    console.error('Error al eliminar el producto de Supabase:', error);
    return null;
  }
  return true;
}

async function updateOrderStatusInSupabase(orderId, nextStatus) {
  const client = getSupabaseClient();
  if (!client) return null;
  const { error } = await client.from('orders').update({ estado: nextStatus }).eq('id', orderId);
  if (error) {
    console.error('Error al actualizar estado en Supabase:', error);
    return null;
  }
  return true;
}
