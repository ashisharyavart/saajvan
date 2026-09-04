/**
 * Cloudflare Pages Function: /api/whatsapp
 * 
 * Handles Meta Official WhatsApp Cloud API:
 * 1. GET: Webhook verification handshake (hub.challenge)
 * 2. POST: Inbound webhook notifications (message status, user replies)
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Meta Webhook Verification Handshake (GET)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // Accepted tokens: Environment variable, or fallback to default tokens
  const configuredToken = env?.META_VERIFY_TOKEN || env?.WHATSAPP_VERIFY_TOKEN;
  const knownTokens = [
    configuredToken,
    'EAAO8nq4LjjwBSYr65fzeo6TSqaHoAb4nya35bN59Mjn4nmZCPkvjurNXLbdpmEH8nXwMsdmtBjpt1Tt6x24oBLW2yWoCVmZAycmDxN9X0eV',
    'saajvan_meta_webhook_2026',
    'saajvan'
  ].filter(Boolean);

  console.log(`[Meta Webhook Verification] mode=${mode}, token=${token}, challenge=${challenge}`);

  if (mode === 'subscribe' && token && knownTokens.includes(token)) {
    console.log('[Meta Webhook Verification] Successfully verified challenge token.');
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  console.warn('[Meta Webhook Verification] Verification failed. Token mismatch or missing mode.');
  return new Response('Forbidden: Verification token mismatch', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Inbound WhatsApp Event Notifications (POST)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const payload = await request.json();
    console.log('[Meta WhatsApp Webhook Event]:', JSON.stringify(payload));

    // Process status updates or inbound customer messages
    if (payload?.entry) {
      for (const entry of payload.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            const value = change.value;
            if (value?.messages) {
              console.log('[Meta WhatsApp Incoming Message]:', JSON.stringify(value.messages));
            }
            if (value?.statuses) {
              console.log('[Meta WhatsApp Message Status]:', JSON.stringify(value.statuses));
            }
          }
        }
      }
    }

    // Always respond with 200 OK to Meta immediately
    return new Response(JSON.stringify({ status: 'EVENT_RECEIVED' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('[Meta WhatsApp Webhook Error]:', err);
    // Return 200 to prevent Meta from retrying indefinitely on unparseable payloads
    return new Response(JSON.stringify({ status: 'EVENT_RECEIVED_WITH_ERROR' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
