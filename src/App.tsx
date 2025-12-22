import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryClient } from "./lib/queryClient";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Clientes from "./pages/Clientes";
import Visitas from "./pages/Visitas";
import Orcamentos from "./pages/Orcamentos";
import NovoOrcamento from "./pages/NovoOrcamento";
import EditarOrcamento from "./pages/EditarOrcamento";
import Disponibilidade from "./pages/Disponibilidade";
import Contratos from "./pages/Contratos";
import Pagamentos from "./pages/Pagamentos";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <SidebarProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rotas públicas - SEM proteção */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            
            {/* Rotas protegidas - COM ProtectedRoute */}
            <Route 
              path="/" 
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
              path="/pagamentos" 
              element={
                <ProtectedRoute>
                  <Pagamentos />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all - redireciona para home (que exigirá login) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </SidebarProvider>
    </BrowserRouter>
    
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;