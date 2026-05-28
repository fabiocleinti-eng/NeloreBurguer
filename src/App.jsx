import { AuthNavigationBridge } from "@/components/AuthNavigationBridge";
import { PageTransition } from "@/components/PageTransition";
import { CartProvider } from "@/context/CartContext";
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
import RestauranteCadastro from "@/pages/restaurante/RestauranteCadastro";
import RestauranteDashboard from "@/pages/restaurante/RestauranteDashboard";
import RestauranteEntregadores from "@/pages/restaurante/RestauranteEntregadores";
import RestauranteCardapio from "@/pages/restaurante/RestauranteCardapio";
import RestaurantePerfil from "@/pages/restaurante/RestaurantePerfil";
import RestauranteLogin from "@/pages/restaurante/RestauranteLogin";
import RestaurantePedidos from "@/pages/restaurante/RestaurantePedidos";
import RestauranteFinanceiro from "@/pages/restaurante/RestauranteFinanceiro";
import { getStoredToken } from "@/services/api";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

// ─── Helpers de token ──────────────────────────────────────────────────────────
function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return true;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true;
  }
}

function getRoleFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || payload.roles?.[0] || null;
  } catch {
    return null;
  }
}

// ─── Guards de rota ────────────────────────────────────────────────────────────

/** Qualquer usuário autenticado (cliente ou restaurante) */
function RequireAuth() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Apenas clientes (role USUARIO / USER) */
function RequireCliente() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) return <Navigate to="/login" replace />;
  const role = getRoleFromToken(token);
  if (role === 'RESTAURANTE') return <Navigate to="/restaurante/dashboard" replace />;
  return <Outlet />;
}

/** Apenas restaurantes (role RESTAURANTE) */
function RequireRestaurante() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) return <Navigate to="/restaurante/login" replace />;
  const role = getRoleFromToken(token);
  if (role && role !== 'RESTAURANTE') return <Navigate to="/login" replace />;
  return <Outlet />;
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthNavigationBridge />
      <CartProvider>
        <PageTransition>
          <Routes>

            {/* ── Públicas ── */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />

            {/* ── Restaurante (público) ── */}
            <Route path="/restaurante/login" element={<RestauranteLogin />} />
            <Route path="/restaurante/cadastro" element={<RestauranteCadastro />} />

            {/* ── Visualização da loja — cliente E restaurante podem acessar ── */}
            <Route element={<RequireAuth />}>
              <Route path="/loja/restaurante/:restauranteId" element={<LojaRestaurante />} />
            </Route>

            {/* ── Área do cliente (apenas USUARIO) ── */}
            <Route element={<RequireCliente />}>
              <Route path="/home" element={<HomePlaceholder />} />
              <Route path="/loja" element={<PreviewGate />}>
                <Route index element={<LojaHome />} />
                <Route path="categoria/:id" element={<LojaCategoria />} />
                <Route path="carrinho" element={<LojaCarrinho />} />
                <Route path="pedidos" element={<LojaPedidos />} />
                <Route path="pedidos/:id" element={<LojaPedidoDetalhe />} />
                <Route path="perfil" element={<LojaPerfil />} />
              </Route>
            </Route>

            {/* ── Área do restaurante (apenas RESTAURANTE) ── */}
            <Route element={<RequireRestaurante />}>
              <Route path="/restaurante/dashboard" element={<RestauranteDashboard />} />
              <Route path="/restaurante/perfil" element={<RestaurantePerfil />} />
              <Route path="/restaurante/entregadores" element={<RestauranteEntregadores />} />
              <Route path="/restaurante/cardapio" element={<RestauranteCardapio />} />
              <Route path="/restaurante/pedidos" element={<RestaurantePedidos />} />
              <Route path="/restaurante/financeiro" element={<RestauranteFinanceiro />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </PageTransition>
      </CartProvider>
    </BrowserRouter>
  );
}
