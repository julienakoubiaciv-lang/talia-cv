/**
 * stripe-webhook — Supabase Edge Function
 *
 * Reçoit et valide les webhooks Stripe, met à jour la table subscriptions.
 *
 * Événements traités :
 *   - checkout.session.completed      → créer/activer subscription
 *   - customer.subscription.updated   → changer le tier
 *   - customer.subscription.deleted   → repasser en Free
 *   - invoice.payment_failed          → marquer la subscription en past_due
 *
 * Variables d'environnement :
 *   STRIPE_SECRET_KEY        — clé secrète Stripe
 *   STRIPE_WEBHOOK_SECRET    — whsec_... (depuis le dashboard Stripe)
 *   SUPABASE_SERVICE_ROLE_KEY— pour écrire en base sans RLS
 */
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient(),
});

/** Mappe un price_id Stripe → tier TaliaCV */
const PRICE_TO_TIER: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_PERSONAL') ?? '']: 'personal',
  [Deno.env.get('STRIPE_PRICE_BUSINESS')  ?? '']: 'business',
};

function tierFromSubscription(sub: Stripe.Subscription): string {
  const priceId = sub.items.data[0]?.price?.id ?? '';
  return PRICE_TO_TIER[priceId] ?? 'free';
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

Deno.serve(async (req) => {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    );
  } catch (err) {
    console.error('[stripe-webhook] signature invalide:', err.message);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  console.log('[stripe-webhook] event:', event.type);

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.user_id;
      if (!userId || session.mode !== 'subscription') break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      await supabaseAdmin.from('subscriptions').upsert({
        user_id:            userId,
        stripe_customer_id: session.customer as string,
        stripe_sub_id:      sub.id,
        tier:               tierFromSubscription(sub),
        status:             sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at:         new Date().toISOString(),
      }, { onConflict: 'user_id' });
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_sub_id', sub.id)
        .single();
      if (!existing) break;

      await supabaseAdmin.from('subscriptions').update({
        tier:               tierFromSubscription(sub),
        status:             sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        updated_at:         new Date().toISOString(),
      }).eq('stripe_sub_id', sub.id);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from('subscriptions').update({
        tier:       'free',
        status:     'canceled',
        updated_at: new Date().toISOString(),
      }).eq('stripe_sub_id', sub.id);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await supabaseAdmin.from('subscriptions').update({
          status:     'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_sub_id', invoice.subscription as string);
      }
      break;
    }

    default:
      console.log('[stripe-webhook] événement ignoré:', event.type);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
