// supabase/functions/send-reservation-notification/index.ts
// Edge Function: fires after a reservation is created via a Supabase Database Webhook.
//
// Setup in Supabase Dashboard:
//   Database → Webhooks → Create Webhook
//   Table: reservations, Event: INSERT
//   URL: https://<project-ref>.functions.supabase.co/send-reservation-notification
//   HTTP Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const NOTIFY_EMAIL   = Deno.env.get('NOTIFY_EMAIL')   ?? 'admin@kanalla.es';

interface ReservationPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    notes?: string;
  };
}

serve(async (req: Request) => {
  try {
    const payload: ReservationPayload = await req.json();
    const { record } = payload;

    // ── Send confirmation email to customer ──────────────────────────────
    await sendEmail({
      to: record.email,
      subject: '✅ Reserva recibida — Kanalla Sky Bar',
      html: `
        <h2>¡Gracias, ${record.name}!</h2>
        <p>Hemos recibido tu solicitud de reserva para el <strong>${record.date}</strong>
        a las <strong>${record.time}</strong> para <strong>${record.guests} persona(s)</strong>.</p>
        <p>Te confirmaremos en breve. ¡Hasta pronto!</p>
        <hr/>
        <p style="color:#888;font-size:12px">Kanalla Sky Bar</p>
      `,
    });

    // ── Notify admin ─────────────────────────────────────────────────────
    await sendEmail({
      to: NOTIFY_EMAIL,
      subject: `🔔 Nueva reserva: ${record.name} — ${record.date} ${record.time}`,
      html: `
        <h3>Nueva reserva recibida</h3>
        <table>
          <tr><td><b>Nombre:</b></td><td>${record.name}</td></tr>
          <tr><td><b>Email:</b></td><td>${record.email}</td></tr>
          <tr><td><b>Teléfono:</b></td><td>${record.phone}</td></tr>
          <tr><td><b>Fecha:</b></td><td>${record.date} ${record.time}</td></tr>
          <tr><td><b>Personas:</b></td><td>${record.guests}</td></tr>
          <tr><td><b>Notas:</b></td><td>${record.notes ?? '—'}</td></tr>
        </table>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Notification error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'reservas@kanalla.es',
      to:   opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend API error: ${await res.text()}`);
  }
}
