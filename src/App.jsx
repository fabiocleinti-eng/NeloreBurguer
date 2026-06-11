import { AuthNavigationBridge } from "@/components/common/AuthNavigationBridge";
import { PageTransition } from "@/components/common/PageTransition";
import { CartProvider } from "@/context/CartContext";
import NotFound from "@/pages/NotFound";
import Cadastro from "@/pages/auth/Cadastro";
import EsqueciSenha from "@/pages/auth/EsqueciSenha";
import HomePlaceholder from "@/pages/auth/HomePlaceholder";
import LoginPage from "@/pages/auth/Login";
import RedefinirSenha from "@/pages/auth/RedefinirSenha";
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
import RestauranteAvaliacoes from "@/pages/restaurante/RestauranteAvaliacoes";
import { getStoredToken } from "@/services/api";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

// ─── Helpers de token ──────────────────────────────────────────────────────────
function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false; // token sem exp = sem expiração definida, tratar como válido
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

function isRoleRestaurante(role) {
  return role === 'RESTAURANTE' || role === 'ADMIN';
}

/** Apenas clientes (role USER / USUARIO) */
function RequireCliente() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) return <Navigate to="/login" replace />;
  const role = getRoleFromToken(token);
  if (isRoleRestaurante(role)) return <Navigate to="/restaurante/dashboard" replace />;
  return <Outlet />;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Apenas restaurantes (role RESTAURANTE ou ADMIN) */
function RequireRestaurante() {
  const token = getStoredToken();
  if (!token || isTokenExpired(token)) return <Navigate to="/restaurante/login" replace />;
  const role = getRoleFromToken(token);
  if (role && !isRoleRestaurante(role)) return <Navigate to="/login" replace />;
  // Garante que o ID do restaurante é um UUID válido; se não for, força novo login
  const restId = sessionStorage.getItem('nelore_restaurante_id') || '';
  if (!UUID_REGEX.test(restId)) {
    sessionStorage.clear();
    return <Navigate to="/restaurante/login" replace />;
  }
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
              <Route path="/restaurante/avaliacoes" element={<RestauranteAvaliacoes />} />
            </Route>

            {/* ── 404 ── */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </PageTransition>
      </CartProvider>
    </BrowserRouter>
  );
}
