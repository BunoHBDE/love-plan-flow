import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { queryClient } from "./lib/queryClient";

// Pages
//
// As portas de entrada (landing e login) ficam no bundle inicial: são a
// primeira tela de quem chega e não podem esperar um segundo request.
// Todo o resto carrega sob demanda — quem abre o CRM não paga pelo motor
// de PDF dos orçamentos, e vice-versa.
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";

const Index = lazy(() => import("./pages/Index"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Clientes = lazy(() => import("./pages/Clientes"));
const CRM = lazy(() => import("./pages/CRM"));
const Orcamentos = lazy(() => import("./pages/Orcamentos"));
const NovoOrcamento = lazy(() => import("./pages/NovoOrcamento"));
const EditarOrcamento = lazy(() => import("./pages/EditarOrcamento"));
const Disponibilidade = lazy(() => import("./pages/Disponibilidade"));
const Contratos = lazy(() => import("./pages/Contratos"));
const NovoContrato = lazy(() => import("./pages/NovoContrato"));
const Pagamentos = lazy(() => import("./pages/Pagamentos"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));

/** O que aparece no instante entre clicar na rota e o pedaço dela chegar. */
const CarregandoPagina = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AuthRedirectHandler />
              <Suspense fallback={<CarregandoPagina />}>
                <Routes>
                  {/* Rotas públicas */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/login" element={<Auth />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/termos" element={<Termos />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/redefinir-senha" element={<RedefinirSenha />} />

                  {/* Rotas protegidas - Dashboard e funcionalidades */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/crm"
                    element={
                      <ProtectedRoute>
                        <CRM />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/clientes"
                    element={
                      <ProtectedRoute>
                        <Clientes />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orcamentos"
                    element={
                      <ProtectedRoute>
                        <Orcamentos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orcamentos/novo"
                    element={
                      <ProtectedRoute>
                        <NovoOrcamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orcamentos/:id/editar"
                    element={
                      <ProtectedRoute>
                        <EditarOrcamento />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/disponibilidade"
                    element={
                      <ProtectedRoute>
                        <Disponibilidade />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contratos"
                    element={
                      <ProtectedRoute>
                        <Contratos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contratos/novo"
                    element={
                      <ProtectedRoute>
                        <NovoContrato />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pagamentos"
                    element={
                      <ProtectedRoute>
                        <Pagamentos />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/configuracoes"
                    element={
                      <ProtectedRoute>
                        <Configuracoes />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all - redireciona para landing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </SubscriptionProvider>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>

    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;
