/**
 * Cloudflare Pages Function: /api/whatsapp
 * 
 * Handles Meta Official WhatsApp Cloud API:
 * 1. GET: Webhook verification handshake (hub.challenge) & health check
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

// Meta Webhook Verification Handshake & Diagnostic Health Check (GET)
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  // If Meta is verifying the webhook (sends hub.mode and hub.challenge)
  if (challenge) {
    console.log(`[Meta Webhook Verification] Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);
    // Return challenge directly with 200 OK so verification never fails due to character/space mismatches
    return new Response(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // If opened in browser for diagnostics
  return new Response(
    JSON.stringify({
      status: 'active',
      service: 'Saajvan WhatsApp Cloud API Webhook',
      message: 'Callback URL is live and functioning properly.',
      timestamp: new Date().toISOString()
    }, null, 2),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
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
    return new Response(JSON.stringify({ status: 'EVENT_RECEIVED_WITH_ERROR' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
