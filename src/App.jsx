import { AuthNavigationBridge } from "@/components/AuthNavigationBridge";
import { PageTransition } from "@/components/PageTransition";
import { CartProvider } from "@/context/CartContext";
import AdminAccess from "@/pages/AdminAccess";
import NotFound from "@/pages/NotFound";
import Cadastro from "@/pages/Cadastro";
import EsqueciSenha from "@/pages/EsqueciSenha";
import HomePlaceholder from "@/pages/HomePlaceholder";
import LoginPage from "@/pages/login";
import RedefinirSenha from "@/pages/RedefinirSenha";
import LojaCarrinho from "@/pages/loja/LojaCarrinho";
import LojaCategoria from "@/pages/loja/LojaCategoria";
import LojaHome from "@/pages/loja/LojaHome";
import LojaRestaurante from "@/pages/loja/LojaRestaurante";
import LojaPedidoDetalhe from "@/pages/loja/LojaPedidoDetalhe";
import LojaPedidos from "@/pages/loja/LojaPedidos";
import LojaPerfil from "@/pages/loja/LojaPerfil";
import { PreviewGate } from "@/pages/preview/PreviewGate";
import PreviewUnlock from "@/pages/preview/PreviewUnlock";
import RestauranteCadastro from "@/pages/restaurante/RestauranteCadastro";
import RestauranteDashboard from "@/pages/restaurante/RestauranteDashboard";
import RestauranteEntregadores from "@/pages/restaurante/RestauranteEntregadores";
import RestauranteCardapio from "@/pages/restaurante/RestauranteCardapio";
import RestaurantePerfil from "@/pages/restaurante/RestaurantePerfil";
import RestauranteLogin from "@/pages/restaurante/RestauranteLogin";
import { getStoredToken } from "@/services/api";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

function RequireAuth() {
  if (DEV_BYPASS) return <Outlet />;
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthNavigationBridge />
      <CartProvider>
        <PageTransition>
        <Routes>
          {/* ── Login unificado (toggle usuário / restaurante) ── */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/preview" element={<PreviewUnlock />} />

          {/* ── Restaurante (público) ── */}
          <Route path="/restaurante/login" element={<RestauranteLogin />} />
          <Route path="/restaurante/cadastro" element={<RestauranteCadastro />} />

          {/* ── Restaurante (autenticado) ── */}
          <Route element={<RequireAuth />}>
            <Route path="/restaurante/dashboard" element={<RestauranteDashboard />} />
            <Route path="/restaurante/perfil" element={<RestaurantePerfil />} />
            <Route path="/restaurante/entregadores" element={<RestauranteEntregadores />} />
            <Route path="/restaurante/cardapio" element={<RestauranteCardapio />} />
          </Route>

          {/* ── Área do cliente (autenticada) ── */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminAccess />} />
            <Route path="/home" element={<HomePlaceholder />} />
            <Route path="/loja" element={<PreviewGate />}>
              <Route index element={<LojaHome />} />
              <Route path="restaurante/:restauranteId" element={<LojaRestaurante />} />
              <Route path="categoria/:id" element={<LojaCategoria />} />
              <Route path="carrinho" element={<LojaCarrinho />} />
              <Route path="pedidos" element={<LojaPedidos />} />
              <Route path="pedidos/:id" element={<LojaPedidoDetalhe />} />
              <Route path="perfil" element={<LojaPerfil />} />
            </Route>
          </Route>

          {/* ── 404 — foguete explode ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
      </CartProvider>
    </BrowserRouter>
  );
}
