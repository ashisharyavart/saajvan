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

  // 1. Check Cloudflare KV if bound
  if (env?.LEADS_KV) {
    try {
      const data = await env.LEADS_KV.get('saajvan_leads_list', { type: 'json' });
      if (Array.isArray(data)) {
        return new Response(JSON.stringify(data), { status: 200, headers: corsHeaders });
      }
    } catch (e) {
      console.error('KV get error:', e);
    }
  }

  // 2. Check Supabase
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

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const updatedLeads = await request.json();
    if (!Array.isArray(updatedLeads)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Payload must be an array of leads.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Sync to Cloudflare KV if available
    if (env?.LEADS_KV) {
      await env.LEADS_KV.put('saajvan_leads_list', JSON.stringify(updatedLeads));
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Leads database updated successfully.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Save leads error:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to update leads database.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestDelete(context) {
  const { env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    if (env?.LEADS_KV) {
      await env.LEADS_KV.put('saajvan_leads_list', JSON.stringify([]));
    }

    return new Response(
      JSON.stringify({ success: true, message: 'All leads cleared successfully.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Clear leads error:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to clear leads.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
