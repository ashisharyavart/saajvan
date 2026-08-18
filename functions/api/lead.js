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

    // 4. Supabase CRM Database Integration (if configured via env)
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

    // 5. Notification Email Integration (if Web3Forms / Resend API configured)
    const notificationEmail = env?.NOTIFICATION_EMAIL || 'z7f0v3@gmail.com';

    if (env?.WEB3FORMS_ACCESS_KEY) {
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: env.WEB3FORMS_ACCESS_KEY,
            subject: `New 3D Design Session Booking — ${name}`,
            from_name: 'Saajvan Studio Web Lead',
            to_email: notificationEmail,
            message: `
New 3D Design Session Booking Request:

• Name: ${name}
• Phone: +91 ${phone}
• Interested In: ${inquiry_type}
• Date: ${new Date(created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            `
          })
        });
      } catch (emailErr) {
        console.error('Email alert notification error:', emailErr);
      }
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
