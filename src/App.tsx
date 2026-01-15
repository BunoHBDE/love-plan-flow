import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthRedirectHandler } from "@/components/auth/AuthRedirectHandler";
import { queryClient } from "./lib/queryClient";

// Pages
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Cadastro from "./pages/Cadastro";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Cookies from "./pages/Cookies";
import Clientes from "./pages/Clientes";
import Visitas from "./pages/Visitas";
import Orcamentos from "./pages/Orcamentos";
import NovoOrcamento from "./pages/NovoOrcamento";
import EditarOrcamento from "./pages/EditarOrcamento";
import Disponibilidade from "./pages/Disponibilidade";
import Contratos from "./pages/Contratos";
import NovoContrato from "./pages/NovoContrato";
import Pagamentos from "./pages/Pagamentos";
import Configuracoes from "./pages/Configuracoes";
import RedefinirSenha from "./pages/RedefinirSenha";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <SidebarProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthRedirectHandler />
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
                path="/clientes" 
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/visitas" 
                element={
                  <ProtectedRoute>
                    <Visitas />
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
          </TooltipProvider>
        </SubscriptionProvider>
      </SidebarProvider>
    </BrowserRouter>
    
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;