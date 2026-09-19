/**
 * Cloudflare Pages Function: POST /api/lead
 * 
 * Receives and validates 3D design session lead submissions.
 * Stores lead in Supabase/CRM with field mapping ('inquiry_type' -> 'Interested In')
 * and triggers notification alerts.
 */

const ALLOWED_INQUIRIES = [
  'Interior Design Services',
  'Residential Interiors',
  'Commercial Interiors',
  'Renovation / Remodeling',
  'Project Pricing',
  'Project Timeline',
  'Something Else'
];

// Duplicate SMS prevention memory cache (per isolate)
const recentSmsSubmissions = new Map();
const SMS_DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds

function cleanAscii(str) {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\n]/g, '')
    .trim();
}

function truncateString(str, maxLen) {
  if (!str) return '';
  const cleaned = cleanAscii(str);
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, Math.max(0, maxLen - 3)) + '...';
}

function formatIstDate(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/,/g, '');
  } catch {
    return 'Recent';
  }
}

function buildLeadSms({ name, phone, service, dateStr }) {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const cleanDate = cleanAscii(dateStr) || 'Recent';

  let safeName = truncateString(name, 25);
  let safeService = truncateString(service, 35);

  let message =
    `New Website Lead\n` +
    `Name: ${safeName}\n` +
    `Phone: ${cleanPhone}\n` +
    `Service: ${safeService}\n` +
    `Time: ${cleanDate}`;

  // Enforce strict limit <= 140 chars
  if (message.length > 140) {
    const overflow = message.length - 140;
    safeService = truncateString(safeService, Math.max(10, safeService.length - overflow));
    message =
      `New Website Lead\n` +
      `Name: ${safeName}\n` +
      `Phone: ${cleanPhone}\n` +
      `Service: ${safeService}\n` +
      `Time: ${cleanDate}`;
  }

  return message;
}

async function sendFast2Sms({ apiKey, numbers, message }) {
  if (!apiKey || !numbers) {
    console.warn('[Fast2SMS] Missing FAST2SMS_API_KEY or CLIENT_PHONE_NUMBER.');
    return { skipped: true, reason: 'Missing credentials' };
  }

  // Parse comma-separated recipient numbers (10 digits each)
  const recipientList = numbers
    .split(',')
    .map(n => n.replace(/\D/g, '').slice(-10))
    .filter(n => /^[6-9]\d{9}$/.test(n));

  if (recipientList.length === 0) {
    console.warn('[Fast2SMS] No valid 10-digit Indian recipient numbers found in CLIENT_PHONE_NUMBER.');
    return { skipped: true, reason: 'No valid recipient numbers' };
  }

  const formattedNumbers = recipientList.join(',');

  const payload = {
    route: 'q',
    message: message,
    numbers: formattedNumbers,
    sms_details: '1'
  };

  console.log(`[Fast2SMS] Dispatching Quick SMS to ${formattedNumbers} (${message.length} chars):`);
  console.log(message);

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await res.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    responseJson = { raw: responseText };
  }

  console.log(`[Fast2SMS] HTTP Status: ${res.status}, Response:`, JSON.stringify(responseJson));
  return {
    ok: res.ok,
    status: res.status,
    data: responseJson
  };
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    let { inquiry_type, name, phone, created_at } = body || {};

    // 1. Sanitize & Trim
    inquiry_type = (inquiry_type || '').toString().trim();
    name = (name || '').toString().trim();
    phone = (phone || '').toString().replace(/\D/g, '').trim();
    created_at = created_at || new Date().toISOString();

    // 2. Server-side Validation
    if (!inquiry_type || !ALLOWED_INQUIRIES.includes(inquiry_type)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid or missing inquiry selection.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!name || name.length < 2) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please enter a valid name.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. CRM Table Field Mapping
    // "What would you like to know more about?" -> "Interested In"
    const crmPayload = {
      name: name,
      phone: `+91 ${phone}`,
      interested_in: inquiry_type, // Mapped for CRM display as "Interested In"
      inquiry_type: inquiry_type,
      status: 'New Lead',
      source: '15s Lead Popup',
      created_at: created_at
    };

    // 3.5. Cloudflare KV Persistence (if LEADS_KV namespace is bound in Cloudflare dashboard)
    if (env?.LEADS_KV) {
      try {
        const existing = (await env.LEADS_KV.get('saajvan_leads_list', { type: 'json' })) || [];
        existing.unshift(crmPayload);
        await env.LEADS_KV.put('saajvan_leads_list', JSON.stringify(existing));
      } catch (kvErr) {
        console.error('Cloudflare KV lead save error:', kvErr);
      }
    }
    const supabaseUrl = env?.SUPABASE_URL;
    const supabaseKey = env?.SUPABASE_KEY || env?.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(crmPayload)
        });
      } catch (dbErr) {
        console.error('Supabase CRM log error:', dbErr);
      }
    }

    // 5. WhatsApp Notification via Zaptilo.ai (Supports single or multiple comma-separated numbers)
    const zaptiloToken = env?.ZAPTILO_API_TOKEN;
    const notifyToRaw = env?.WHATSAPP_NOTIFY_TO; // e.g. "916263952434,919582300708"

    if (zaptiloToken && notifyToRaw) {
      try {
        const dateStr = new Date(created_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const whatsappMessage =
          `🏠 *New 3D Design Session Booking*\n\n` +
          `👤 *Name:* ${name}\n` +
          `📱 *Phone:* +91 ${phone}\n` +
          `🎯 *Interested In:* ${inquiry_type}\n` +
          `🕐 *Date:* ${dateStr}\n\n` +
          `Tap to call: +91 ${phone}`;

        // Parse comma-separated phone numbers
        const recipientNumbers = notifyToRaw
          .split(',')
          .map(num => num.replace(/\D/g, '').trim())
          .filter(num => num.length >= 10);

        for (const targetNum of recipientNumbers) {
          try {
            const zapRes = await fetch('https://web.zaptilo.ai/api/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${zaptiloToken}`
              },
              body: JSON.stringify({
                phone: targetNum,
                message: whatsappMessage
              })
            });
            const zapBody = await zapRes.text();
            console.log(`[Zaptilo -> ${targetNum}] status=${zapRes.status} body=${zapBody}`);
          } catch (singleErr) {
            console.error(`Error sending Zaptilo alert to ${targetNum}:`, singleErr);
          }
        }
      } catch (waErr) {
        console.error('Zaptilo WhatsApp notification error:', waErr);
      }
    }

    // 5.1 Meta Official WhatsApp Cloud API (Parallel integration)
    const metaToken = env?.META_ACCESS_TOKEN;
    const metaPhoneId = env?.META_PHONE_NUMBER_ID;

    if (metaToken && metaPhoneId && notifyToRaw) {
      try {
        const dateStr = new Date(created_at).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const whatsappMessage =
          `🏠 *New 3D Design Session Booking*\n\n` +
          `👤 *Name:* ${name}\n` +
          `📱 *Phone:* +91 ${phone}\n` +
          `🎯 *Interested In:* ${inquiry_type}\n` +
          `🕐 *Date:* ${dateStr}\n\n` +
          `Tap to call: +91 ${phone}`;

        const recipientNumbers = notifyToRaw
          .split(',')
          .map(num => num.replace(/\D/g, '').trim())
          .filter(num => num.length >= 10);

        for (const targetNum of recipientNumbers) {
          try {
            const metaRes = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${metaToken}`
              },
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: targetNum,
                type: 'text',
                text: {
                  preview_url: false,
                  body: whatsappMessage
                }
              })
            });
            const metaBody = await metaRes.text();
            console.log(`[Meta WhatsApp -> ${targetNum}] status=${metaRes.status} body=${metaBody}`);
          } catch (singleMetaErr) {
            console.error(`Error sending Meta WhatsApp alert to ${targetNum}:`, singleMetaErr);
          }
        }
      } catch (metaErr) {
        console.error('Meta WhatsApp notification error:', metaErr);
      }
    }

    // 5.2 Fast2SMS Quick SMS Notification
    const fast2smsApiKey = env?.FAST2SMS_API_KEY;
    const clientPhoneNumber = env?.CLIENT_PHONE_NUMBER;

    if (fast2smsApiKey && clientPhoneNumber) {
      try {
        const now = Date.now();
        const lastSent = recentSmsSubmissions.get(phone);
        let isDuplicate = lastSent && (now - lastSent < SMS_DEDUP_WINDOW_MS);

        // Check KV for distributed duplicate suppression if available
        if (!isDuplicate && env?.LEADS_KV) {
          try {
            const kvDedup = await env.LEADS_KV.get(`sms_dedup_${phone}`);
            if (kvDedup) {
              isDuplicate = true;
            }
          } catch (kvReadErr) {
            console.warn('[Fast2SMS] KV dedup read error:', kvReadErr);
          }
        }

        if (isDuplicate) {
          console.log(`[Fast2SMS] Duplicate lead submission detected for phone ${phone} within 60s. Skipping SMS to prevent double charge.`);
        } else {
          // Record dedup timestamp in memory & KV
          recentSmsSubmissions.set(phone, now);
          if (env?.LEADS_KV) {
            try {
              await env.LEADS_KV.put(`sms_dedup_${phone}`, '1', { expirationTtl: 60 });
            } catch (kvErr) {
              console.warn('[Fast2SMS] KV dedup put error:', kvErr);
            }
          }

          const dateFormatted = formatIstDate(created_at);
          const smsMessage = buildLeadSms({
            name,
            phone,
            service: inquiry_type,
            dateStr: dateFormatted
          });

          await sendFast2Sms({
            apiKey: fast2smsApiKey,
            numbers: clientPhoneNumber,
            message: smsMessage
          });
        }
      } catch (smsErr) {
        // Never fail the user lead submission if SMS fails
        console.error('[Fast2SMS Notification Error]:', smsErr);
      }
    } else {
      if (!fast2smsApiKey) console.warn('[Fast2SMS] FAST2SMS_API_KEY environment variable is not configured.');
      if (!clientPhoneNumber) console.warn('[Fast2SMS] CLIENT_PHONE_NUMBER environment variable is not configured.');
    }

    // 6. Return Success Response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request received successfully. Our design team will contact you shortly.',
        lead: {
          name,
          phone: `+91 ${phone}`,
          interested_in: inquiry_type
        }
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Cloudflare Lead Function Error:', err);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error processing lead.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
