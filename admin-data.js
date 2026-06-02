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
