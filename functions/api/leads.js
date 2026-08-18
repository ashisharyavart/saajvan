/**
 * Cloudflare Pages Function: /api/leads
 * 
 * GET: Retrieve all CRM leads
 * DELETE: Clear/delete leads
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  const supabaseUrl = env?.SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_KEY || env?.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
      }
    } catch (e) {
      console.error('Supabase GET leads error:', e);
    }
  }

  return new Response(JSON.stringify([]), { status: 200, headers: corsHeaders });
}
