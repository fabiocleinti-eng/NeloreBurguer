import { AuthNavigationBridge } from "@/components/AuthNavigationBridge";
import { CartProvider } from "@/context/CartContext";
import AdminAccess from "@/pages/AdminAccess";
import Cadastro from "@/pages/Cadastro";
import EsqueciSenha from "@/pages/EsqueciSenha";
import HomePlaceholder from "@/pages/HomePlaceholder";
import LoginPage from "@/pages/login";
import RedefinirSenha from "@/pages/RedefinirSenha";
import LojaCarrinho from "@/pages/loja/LojaCarrinho";
import LojaCategoria from "@/pages/loja/LojaCategoria";
import LojaHome from "@/pages/loja/LojaHome";
import LojaPedidoDetalhe from "@/pages/loja/LojaPedidoDetalhe";
import LojaPedidos from "@/pages/loja/LojaPedidos";
import LojaPerfil from "@/pages/loja/LojaPerfil";
import { PreviewGate } from "@/pages/preview/PreviewGate";
import PreviewUnlock from "@/pages/preview/PreviewUnlock";
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

function RequireAuth() {
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
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/preview" element={<PreviewUnlock />} />

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminAccess />} />
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

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
