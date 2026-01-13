import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { OnboardingSidebar } from '@/components/onboarding/OnboardingSidebar';
import { Step1CreateAccount } from '@/components/onboarding/Step1CreateAccount';
import { Step2SpaceProfile } from '@/components/onboarding/Step2SpaceProfile';
import { Step3BusinessOperation } from '@/components/onboarding/Step3BusinessOperation';

export interface OnboardingData {
  // Step 1
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  allowContact: boolean;
  // Step 2
  spaceName: string;
  spaceType: string;
  userRole: string;
  // Step 3
  mainChallenge: string;
  quotesPerMonth: string;
  eventType: string;
  socialContact: string;
}

export default function Cadastro() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    allowContact: true,
    spaceName: '',
    spaceType: '',
    userRole: '',
    mainChallenge: '',
    quotesPerMonth: '',
    eventType: '',
    socialContact: '',
  });
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in and on step 1, skip to step 2
    if (!loading && user && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [user, loading, currentStep]);

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const handleStep1Complete = async (data: { name: string; email: string; password: string; whatsapp: string; allowContact: boolean }) => {
    setIsSubmitting(true);
    updateData(data);

    const redirectUrl = `${window.location.origin}/`;
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: data.name,
          whatsapp: data.whatsapp,
          allow_contact: data.allowContact,
        },
      },
    });

    setIsSubmitting(false);

    if (error) {
      throw error;
    }

    // Check if user already exists (Supabase returns user with empty identities)
    if (signUpData?.user?.identities?.length === 0) {
      throw new Error('User already registered');
    }

    setCurrentStep(2);
  };

  const handleStep2Complete = (data: { spaceName: string; spaceType: string; userRole: string }) => {
    updateData(data);
    setCurrentStep(3);
  };

  const handleStep3Complete = async (data: { mainChallenge: string; quotesPerMonth: string; eventType: string; socialContact: string }) => {
    setIsSubmitting(true);
    const finalData = { ...onboardingData, ...data };
    updateData(data);

    if (user) {
      // Save to profiles table
      await supabase
        .from('profiles')
        .update({
          company_name: finalData.spaceName,
          whatsapp: finalData.whatsapp,
        })
        .eq('id', user.id);

      // Save onboarding data for analytics
      await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          whatsapp: finalData.whatsapp,
          allow_contact: finalData.allowContact,
          space_name: finalData.spaceName,
          space_type: finalData.spaceType,
          user_role: finalData.userRole,
          main_challenge: finalData.mainChallenge,
          quotes_per_month: finalData.quotesPerMonth,
          event_type: finalData.eventType,
          social_contact: finalData.socialContact,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    setIsSubmitting(false);
    
    // Show email confirmation message
    setShowEmailConfirmation(true);
    
    // Try to auto-login with the credentials from onboarding
    if (finalData.email && finalData.password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: finalData.email,
        password: finalData.password,
      });
      
      // If login succeeds, redirect to dashboard after a short delay
      if (!signInError) {
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-lg">
          {showEmailConfirmation ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">Confirme seu email</h2>
                <p className="text-muted-foreground">
                  Enviamos um link de confirmação para <span className="font-medium text-foreground">{onboardingData.email}</span>.
                </p>
                <p className="text-muted-foreground mt-2">
                  Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                </p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado automaticamente...
                </p>
                <Loader2 className="h-5 w-5 animate-spin text-accent mx-auto mt-3" />
              </div>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
                <Step1CreateAccount 
                  onComplete={handleStep1Complete}
                  isSubmitting={isSubmitting}
                  defaultValues={onboardingData}
                />
              )}
              {currentStep === 2 && (
                <Step2SpaceProfile 
                  onComplete={handleStep2Complete}
                  defaultValues={onboardingData}
                />
              )}
              {currentStep === 3 && (
                <Step3BusinessOperation 
                  onComplete={handleStep3Complete}
                  isSubmitting={isSubmitting}
                  defaultValues={onboardingData}
                />
              )}

              {/* Step indicator */}
              <div className="flex justify-center gap-2 mt-8">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step === currentStep 
                        ? 'w-8 bg-accent' 
                        : step < currentStep 
                          ? 'w-2 bg-accent/50' 
                          : 'w-2 bg-border'
                    }`}
                  />
                ))}
              </div>

              {/* Login link on step 1 */}
              {currentStep === 1 && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  Já tem uma conta?{' '}
                  <a href="/auth" className="text-accent hover:underline font-medium">
                    Fazer login
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <OnboardingSidebar />
    </div>
  );
}
