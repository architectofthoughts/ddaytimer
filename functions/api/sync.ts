interface Env {
  SYNC_KV: KVNamespace;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS - CORS preflight
export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

// GET - retrieve synced data
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const data = await context.env.SYNC_KV.get('app-data', 'text');
  return new Response(data || '{}', {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
};

// PUT - store synced data
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const body = await context.request.text();
  // Validate JSON
  JSON.parse(body);
  await context.env.SYNC_KV.put('app-data', body);
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
};
