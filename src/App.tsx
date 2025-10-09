import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HTMLViewer } from "@/components/FichaTecnica/HTMLViewer";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Lazy load das rotas principais
const NovaFicha = lazy(() => import("./pages/NovaFicha"));
const ConsultarFichas = lazy(() => import("./pages/ConsultarFichas"));

// Lazy load dos novos módulos (Feature Flags)
const Compras = lazy(() => import("./pages/Compras"));
const Comercial = lazy(() => import("./pages/Comercial"));
const PCP = lazy(() => import("./pages/PCP"));
const Producao = lazy(() => import("./pages/Producao"));
const Cadastros = lazy(() => import("./pages/Cadastros"));
const ControleProducao = lazy(() => import("./pages/ControleProducao"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <ThemeToggle />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/nova-ficha" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <NovaFicha />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/nova-ficha/:id" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <NovaFicha />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/consultar-fichas" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <ConsultarFichas />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/view-html/*" element={<HTMLViewer />} />
              {/* Novos módulos com Feature Flags */}
              <Route path="/compras" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <Compras />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/comercial" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <Comercial />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/pcp" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <PCP />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/producao" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <Producao />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/cadastros" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <Cadastros />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/controle-producao" element={
                <ProtectedRoute>
                  <Suspense fallback={<div className="flex items-center justify-center h-64">Carregando...</div>}>
                    <ControleProducao />
                  </Suspense>
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;