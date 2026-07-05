export async function onRequestPost(context) {
  const { env } = context;
  const accountId = env.CF_ACCOUNT_ID;
  const token = env.CF_STREAM_TOKEN;

  if (!accountId || !token) {
    return new Response(JSON.stringify({ error: 'Stream no configurado. Agregá CF_ACCOUNT_ID y CF_STREAM_TOKEN en las variables de entorno del proyecto en Cloudflare.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 600,
        requireSignedURLs: false,
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    return new Response(JSON.stringify({ error: 'Error de Cloudflare: ' + err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await resp.json();
  return new Response(JSON.stringify({
    uploadURL: data.result.uploadURL,
    uid: data.result.uid,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
