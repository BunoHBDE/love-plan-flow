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
    
    const { error } = await supabase.auth.signUp({
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

    // Save onboarding data to profile
    if (user) {
      await supabase
        .from('profiles')
        .update({
          company_name: finalData.spaceName,
          whatsapp: finalData.whatsapp,
        })
        .eq('id', user.id);
    }

    setIsSubmitting(false);
    navigate('/');
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
        </div>
      </div>

      {/* Sidebar - Hidden on mobile */}
      <OnboardingSidebar />
    </div>
  );
}
