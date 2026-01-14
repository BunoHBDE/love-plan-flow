import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  trialDays: number;
  trialEndsAt: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    logStep("Resend key verified");

    const resend = new Resend(resendKey);

    const { email, name, trialDays, trialEndsAt }: WelcomeEmailRequest = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }
    logStep("Request parsed", { email, name, trialDays });

    const firstName = name ? name.split(' ')[0] : 'Usuário';
    const trialEndDate = new Date(trialEndsAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Ayllah!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">🎉 Bem-vindo ao Ayllah!</h1>
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; margin: 12px 0 0 0;">Seu período de teste começou</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #111827; margin: 0 0 20px 0;">
                Olá, <strong>${firstName}</strong>! 👋
              </p>
              
              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                Estamos muito felizes em ter você conosco! Seu trial gratuito de <strong>${trialDays} dias</strong> 
                foi ativado com sucesso e você já pode aproveitar todas as funcionalidades do Plano Pro.
              </p>

              <!-- Trial Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 14px; color: #059669; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                      📅 Seu trial é válido até
                    </p>
                    <p style="font-size: 24px; color: #065f46; font-weight: 700; margin: 0;">
                      ${trialEndDate}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                Durante esse período, você terá acesso a:
              </p>

              <!-- Features List -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">✅</td>
                        <td style="font-size: 15px; color: #374151;">Gestão completa de clientes</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">✅</td>
                        <td style="font-size: 15px; color: #374151;">Orçamentos ilimitados com PDF</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">✅</td>
                        <td style="font-size: 15px; color: #374151;">Agendamento de visitas</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">✅</td>
                        <td style="font-size: 15px; color: #374151;">Controle de disponibilidade</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 28px; vertical-align: top;">✅</td>
                        <td style="font-size: 15px; color: #374151;">Configurações personalizadas de preços</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="https://ayllah.lovable.app" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 40px; border-radius: 8px;">
                      Acessar minha conta →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                Precisa de ajuda? Responda este email que teremos prazer em ajudar. 💚
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center;">
              <p style="font-size: 13px; color: #9ca3af; margin: 0;">
                © ${new Date().getFullYear()} Ayllah. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Ayllah <contato@ayllah.com>",
      to: [email],
      subject: "🎉 Seu trial de 14 dias começou! Bem-vindo ao Ayllah",
      html: emailHtml,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-welcome-email", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
