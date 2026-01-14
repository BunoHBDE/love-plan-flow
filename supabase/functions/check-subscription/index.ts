import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Verificar profile: override E trial do app
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_override, trial_started_at, trial_ends_at')
      .eq('id', user.id)
      .single();

    // 1. Verificar override primeiro
    if (profile?.subscription_override === true) {
      logStep("Subscription override found, granting access", { userId: user.id });
      return new Response(JSON.stringify({
        subscribed: true,
        status: 'override',
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
        price_id: null,
        app_trial: false,
        can_start_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 2. Verificar trial gerenciado pelo app
    const now = new Date();
    const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
    const trialStartedAt = profile?.trial_started_at ? new Date(profile.trial_started_at) : null;
    const hasAppTrial = trialStartedAt !== null;
    const isAppTrialActive = trialEndsAt !== null && trialEndsAt > now;

    if (isAppTrialActive && profile) {
      logStep("App trial is active", { 
        trial_started_at: profile.trial_started_at,
        trial_ends_at: profile.trial_ends_at 
      });
      return new Response(JSON.stringify({
        subscribed: true,
        status: 'trialing',
        trial_end: profile.trial_ends_at,
        current_period_end: null,
        cancel_at_period_end: false,
        price_id: null,
        app_trial: true,
        can_start_trial: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3. Continua verificação normal do Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: null,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
        price_id: null,
        app_trial: false,
        can_start_trial: !hasAppTrial, // Pode iniciar trial se nunca iniciou
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get all subscriptions (active, trialing, past_due)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscriptions found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        status: null,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
        price_id: null,
        app_trial: false,
        can_start_trial: !hasAppTrial, // Pode iniciar trial se nunca iniciou
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const isActive = ["active", "trialing"].includes(subscription.status);
    const trialEnd = subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString() 
      : null;
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const priceId = subscription.items.data[0]?.price.id || null;

    logStep("Subscription found", { 
      subscriptionId: subscription.id, 
      status: subscription.status,
      isActive,
      trialEnd,
      currentPeriodEnd,
      priceId,
    });

    return new Response(JSON.stringify({
      subscribed: isActive,
      status: subscription.status,
      trial_end: trialEnd,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
      price_id: priceId,
      app_trial: false,
      can_start_trial: false, // Já tem assinatura Stripe
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
