export async function onRequestPost(context) {
  const { env, request } = context;
  const libraryId = env.BUNNY_LIBRARY_ID || '697414';
  const apiKey = env.BUNNY_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Bunny no configurado. Agregá BUNNY_API_KEY en las variables de entorno de Cloudflare Pages.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Paso 1: crear entrada de video en Bunny
  const createResp = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: `luxtom-${Date.now()}` }),
  });

  if (!createResp.ok) {
    return new Response(JSON.stringify({ error: 'Error al crear video en Bunny: ' + await createResp.text() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { guid } = await createResp.json();

  // Paso 2: subir el archivo
  const videoData = await request.arrayBuffer();
  const uploadResp = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
    method: 'PUT',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: videoData,
  });

  if (!uploadResp.ok) {
    return new Response(JSON.stringify({ error: 'Error al subir a Bunny: ' + await uploadResp.text() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ videoId: guid, libraryId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
