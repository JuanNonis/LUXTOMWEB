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
  users: []
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

function compressToWebP(file, quality = 0.78, maxDim = 1400) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => resolve(blob || file), 'image/webp', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadProductImageToStorage(productId, file) {
  const client = getSupabaseClient();
  if (!client) throw new Error('No hay cliente Supabase disponible.');

  const compressed = await compressToWebP(file, 0.65, 1000);
  const path = `${productId}/${Date.now()}.webp`;

  const { error: uploadError } = await client.storage
    .from('productos')
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' });

  if (uploadError) throw new Error('Storage: ' + uploadError.message);

  const { data: urlData } = client.storage.from('productos').getPublicUrl(path);
  return urlData.publicUrl;
}

async function uploadFileToStorage(orderId, file) {
  const client = getSupabaseClient();
  if (!client) throw new Error('No hay cliente Supabase disponible.');

  const compressed = await compressToWebP(file, 0.78);
  const path = `${orderId}/comprobante.webp`;

  const { error: uploadError } = await client.storage
    .from('comprobantes')
    .upload(path, compressed, { upsert: true, contentType: 'image/webp' });

  if (uploadError) throw new Error('Storage: ' + uploadError.message);

  const { data: urlData } = client.storage.from('comprobantes').getPublicUrl(path);
  return urlData.publicUrl;
}

async function deleteComprobanteFromStorage(orderId, url) {
  const client = getSupabaseClient();
  if (!client) throw new Error('No hay cliente Supabase disponible.');

  const prefix = `${SUPABASE_URL}/storage/v1/object/public/comprobantes/`;
  const path = url.replace(prefix, '');

  const { error: storageError } = await client.storage.from('comprobantes').remove([path]);
  if (storageError) throw new Error('Storage: ' + storageError.message);

  const { error: dbError } = await client.from('orders').update({ comprobante_url: null }).eq('id', orderId);
  if (dbError) throw new Error('Supabase: ' + dbError.message);
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
    const precioNum = Number(String(row.precio || '').replace(/[^0-9]/g, '')) || 0;
    const descuentoNum = Number(String(row.precio_descuento || '').replace(/[^0-9]/g, '')) || 0;
    const descuentoPct = (row.descuento && precioNum > 0 && descuentoNum > 0)
      ? Math.round((1 - descuentoNum / precioNum) * 100) : 0;

    const product = {
      id: row.id,
      nombre: row.nombre,
      tagline: row.tagline || '',
      precio: row.precio,
      descuento: row.descuento || false,
      descuentoPct,
      precioDescuento: row.precio_descuento || null,
      categoria: row.categoria,
      coleccion: row.coleccion,
      stock: row.stock,
      imagenes: row.imagenes || [],
      videos: row.videos || [],
      descripcion: row.descripcion || '',
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

async function fetchSupabaseCollections() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('collections').select('name').order('name');
  if (error) { console.error('Error al leer colecciones:', error); return null; }
  return (data || []).map(r => r.name);
}

async function fetchSupabaseCategories() {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from('categories').select('name').order('name');
  if (error) { console.error('Error al leer categorías:', error); return null; }
  return (data || []).map(r => r.name);
}

async function saveCollectionToSupabase(name) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('collections').upsert([{ name }], { onConflict: 'name' });
  if (error) console.error('Error al guardar colección:', error);
}

async function saveCategoryToSupabase(name) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('categories').upsert([{ name }], { onConflict: 'name' });
  if (error) console.error('Error al guardar categoría:', error);
}

async function deleteCollectionFromSupabase(name) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('collections').delete().eq('name', name);
  if (error) console.error('Error al eliminar colección:', error);
}

async function deleteCategoryFromSupabase(name) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('categories').delete().eq('name', name);
  if (error) console.error('Error al eliminar categoría:', error);
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

// ── Compresor de video (FFmpeg.wasm, carga lazy) ─────────────────
let _ffmpegProgressCb = null;
let _ffmpegInstance   = null;

async function ensureFFmpeg() {
  if (_ffmpegInstance && _ffmpegInstance.isLoaded()) return _ffmpegInstance;
  if (!window.FFmpeg) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar el compresor'));
      document.head.appendChild(s);
    });
  }
  const { createFFmpeg } = FFmpeg;
  _ffmpegInstance = createFFmpeg({
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.0/dist/ffmpeg-core.js',
    log: false,
    progress: ({ ratio }) => { if (_ffmpegProgressCb) _ffmpegProgressCb(Math.round(ratio * 100)); }
  });
  await _ffmpegInstance.load();
  return _ffmpegInstance;
}

async function compressVideo(file, onProgress) {
  _ffmpegProgressCb = onProgress || null;
  const ffmpeg = await ensureFFmpeg();
  const { fetchFile } = FFmpeg;
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const inName = `in.${ext}`;
  ffmpeg.FS('writeFile', inName, await fetchFile(file));
  await ffmpeg.run(
    '-i', inName,
    '-vf', 'scale=-2:min(720\\,ih)',
    '-c:v', 'libx264',
    '-crf', '28',
    '-preset', 'fast',
    '-c:a', 'aac', '-b:a', '96k',
    '-movflags', '+faststart',
    'out.mp4'
  );
  const data = ffmpeg.FS('readFile', 'out.mp4');
  try { ffmpeg.FS('unlink', inName); } catch(e) {}
  try { ffmpeg.FS('unlink', 'out.mp4'); } catch(e) {}
  _ffmpegProgressCb = null;
  return new File([data.buffer], 'video.mp4', { type: 'video/mp4' });
}

async function uploadVideoToStorage(productId, file) {
  const client = getSupabaseClient();
  if (!client) throw new Error('No hay cliente Supabase disponible.');
  const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  const path = `${productId}/video-${Date.now()}.${ext}`;
  const { error } = await client.storage
    .from('productos')
    .upload(path, file, { upsert: true, contentType: file.type || 'video/mp4' });
  if (error) throw new Error('Storage: ' + error.message);
  const { data } = client.storage.from('productos').getPublicUrl(path);
  return data.publicUrl;
}

async function fetchSettings() {
  const client = getSupabaseClient();
  if (!client) return {};
  const { data, error } = await client.from('settings').select('*');
  if (error) { console.error('Error al leer settings:', error); return {}; }
  return (data || []).reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

async function saveSettingToSupabase(key, value) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from('settings').upsert([{ key, value }], { onConflict: 'key' });
  if (error) console.error('Error al guardar setting:', error);
}

async function uploadToStream(file, onProgress) {
  // Pide una URL de subida de un solo uso a nuestra Pages Function
  const resp = await fetch('/api/stream-upload', { method: 'POST' });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || 'No se pudo obtener URL de subida');
  }
  const { uploadURL, uid } = await resp.json();

  // Carga tus-js-client si no está disponible
  if (!window.tus) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tus-js-client@3/dist/tus.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar el cliente de subida'));
      document.head.appendChild(s);
    });
  }

  // Sube el video usando el protocolo TUS (Cloudflare Stream lo requiere)
  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl: uploadURL,
      chunkSize: 50 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      metadata: { filename: file.name, filetype: file.type },
      onProgress(bytesUploaded, bytesTotal) {
        if (onProgress && bytesTotal) {
          onProgress(Math.round((bytesUploaded / bytesTotal) * 100));
        }
      },
      onSuccess: resolve,
      onError: reject,
    });
    upload.start();
  });

  return uid;
}
