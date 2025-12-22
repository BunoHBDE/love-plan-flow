import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";
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
            {/* Rotas públicas */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Auth />} />
            
            {/* Rotas principais */}
            <Route path="/" element={<Index />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/visitas" element={<Visitas />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/orcamentos/novo" element={<NovoOrcamento />} />
            <Route path="/orcamentos/:id/editar" element={<EditarOrcamento />} />
            <Route path="/disponibilidade" element={<Disponibilidade />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/pagamentos" element={<Pagamentos />} />

            {/* Catch-all - redireciona para home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TooltipProvider>
      </SidebarProvider>
    </BrowserRouter>
    
    {/* DevTools - Apenas em desenvolvimento */}
    {/* Remove automaticamente em produção */}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default App;