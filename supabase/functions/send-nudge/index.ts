/**
 * send-nudge — Supabase Edge Function
 *
 * Envoie la relance qu'un encadrant déclenche depuis /encadrement. Jusqu'ici la
 * relance n'était qu'une ligne dans student_nudges : le conseiller voyait un
 * accusé d'envoi alors que l'élève ne recevait rien.
 *
 * - Auth JWT obligatoire ; l'appelant doit être le conseiller de l'élève ou la
 *   direction de son organisation. La vérification est refaite ici côté serveur :
 *   la RLS protège l'insertion mais pas l'adresse de destination.
 * - Écrit la ligne student_nudges (status 'sent' ou 'failed'), de sorte que
 *   l'historique reflète ce qui est réellement parti.
 *
 * POST /functions/v1/send-nudge
 * Headers : Authorization: Bearer <supabase_jwt>
 * Body    : { student_id, org_id, message? }
 *
 * Secrets requis (Supabase → Edge Functions → Secrets) :
 *   RESEND_API_KEY   — re_...
 *   NUDGE_FROM       — ex. "Altio <coach@altio-wave.com>" (domaine vérifié Resend)
 *   APP_URL          — ex. https://app.altio-wave.com (lien dans l'email)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function buildEmail(
  studentName: string, coachName: string, orgName: string, message: string, appUrl: string,
  brand: { color: string; logoUrl: string | null },
) {
  const intro = message.trim()
    || `${coachName} t'encourage à reprendre ton parcours : quelques minutes suffisent pour avancer sur ton CV ou t'entraîner à l'entretien.`;
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#F5F6F9;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#14171F;">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px;">
    ${brand.logoUrl
      ? `<img src="${esc(brand.logoUrl)}" alt="${esc(orgName)}" style="max-height:44px;max-width:180px;display:block;margin:0 0 16px;" />`
      : `<p style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${esc(brand.color)};margin:0 0 14px;">${esc(orgName || 'Altio')}</p>`}
    <h1 style="font-size:22px;line-height:1.25;margin:0 0 14px;">Bonjour ${esc(studentName)},</h1>
    <p style="font-size:15px;line-height:1.6;color:#3A4156;margin:0 0 22px;">${esc(intro)}</p>
    <a href="${esc(appUrl)}" style="display:inline-block;background:${esc(brand.color)};color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 24px;border-radius:12px;">
      Reprendre mon parcours
    </a>
    <p style="font-size:13px;line-height:1.6;color:#9AA0AE;margin:26px 0 0;">
      Message envoyé par ${esc(coachName)}, ton conseiller.
    </p>
  </div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  );
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) return json({ error: 'unauthorized' }, 401);

    const { student_id, org_id, message = '' } = await req.json();
    if (!student_id || !org_id) return json({ error: 'missing_params' }, 400);

    // L'appelant encadre-t-il vraiment cet élève ?
    const { data: membership } = await supabaseAdmin
      .from('org_members')
      .select('manager_id, org_id')
      .eq('user_id', student_id).eq('org_id', org_id).eq('status', 'active')
      .maybeSingle();
    if (!membership) return json({ error: 'student_not_found' }, 404);

    if (membership.manager_id !== user.id) {
      const { data: caller } = await supabaseAdmin
        .from('org_members')
        .select('role')
        .eq('user_id', user.id).eq('org_id', org_id).eq('status', 'active')
        .maybeSingle();
      if (caller?.role !== 'admin') return json({ error: 'forbidden' }, 403);
    }

    const [{ data: student }, { data: coach }, { data: org }] = await Promise.all([
      supabaseAdmin.from('profiles').select('email, display_name').eq('id', student_id).maybeSingle(),
      supabaseAdmin.from('profiles').select('email, display_name').eq('id', user.id).maybeSingle(),
      supabaseAdmin.from('organizations').select('name, logo_url, brand_color, reply_to').eq('id', org_id).maybeSingle(),
    ]);
    if (!student?.email) return json({ error: 'student_has_no_email' }, 422);

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('NUDGE_FROM');
    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.altio-wave.com';
    if (!apiKey || !from) return json({ error: 'email_not_configured' }, 503);

    const studentName = student.display_name || student.email.split('@')[0];
    const coachName = coach?.display_name || 'Ton conseiller';
    const orgName = org?.name ?? '';
    // La relance part sous la marque de l'organisation : un coach indépendant
    // facture sous son nom et ne peut pas écrire à ses clients sous une autre.
    const brand = {
      color: /^#[0-9A-Fa-f]{6}$/.test(org?.brand_color ?? '') ? org.brand_color : '#0033A0',
      logoUrl: org?.logo_url || null,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [student.email],
        reply_to: org?.reply_to || coach?.email || undefined,
        subject: `${studentName}, on continue ton parcours ?`,
        html: buildEmail(studentName, coachName, orgName, message, appUrl, brand),
      }),
    });

    const sent = res.ok;
    const detail = sent ? null : await res.text();

    await supabaseAdmin.from('student_nudges').insert({
      student_id, org_id, manager_id: user.id, message,
      channel: 'email', status: sent ? 'sent' : 'failed',
    });

    if (!sent) {
      console.error('[send-nudge] resend:', detail);
      return json({ error: 'send_failed' }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('[send-nudge]', err);
    return json({ error: 'internal_error' }, 500);
  }
});
