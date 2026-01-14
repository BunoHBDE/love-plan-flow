import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[START-TRIAL] ${step}${detailsStr}`);
};

const TRIAL_DAYS = 14;

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
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    const user = userData.user;
    if (!user) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user already has a trial
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("trial_started_at, trial_ends_at, full_name")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error(`Error fetching profile: ${profileError.message}`);
    }

    if (profile?.trial_started_at) {
      logStep("User already has a trial", { 
        trial_started_at: profile.trial_started_at,
        trial_ends_at: profile.trial_ends_at 
      });
      return new Response(
        JSON.stringify({ 
          error: "Trial já foi iniciado anteriormente",
          already_started: true,
          trial_started_at: profile.trial_started_at,
          trial_ends_at: profile.trial_ends_at
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Start the trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error(`Error starting trial: ${updateError.message}`);
    }

    logStep("Trial started successfully", {
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      trial_days: TRIAL_DAYS
    });

    // Send welcome email in background (don't block the response)
    const sendWelcomeEmail = async () => {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            email: user.email,
            name: profile?.full_name || user.user_metadata?.full_name || "",
            trialDays: TRIAL_DAYS,
            trialEndsAt: trialEnd.toISOString(),
          }),
        });
        
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          logStep("Failed to send welcome email", { error: errorData });
        } else {
          logStep("Welcome email sent successfully");
        }
      } catch (emailError) {
        logStep("Error sending welcome email", { 
          error: emailError instanceof Error ? emailError.message : String(emailError) 
        });
      }
    };

    // Fire and forget - don't block the response
    sendWelcomeEmail();

    return new Response(
      JSON.stringify({
        success: true,
        trial_started_at: now.toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        trial_days: TRIAL_DAYS,
        message: `Trial de ${TRIAL_DAYS} dias iniciado com sucesso!`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in start-trial", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
