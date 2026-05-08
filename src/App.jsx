import { AuthNavigationBridge } from "@/components/AuthNavigationBridge";
import { CartProvider } from "@/context/CartContext";
import AdminAccess from "@/pages/AdminAccess";
import Cadastro from "@/pages/Cadastro";
import HomePlaceholder from "@/pages/HomePlaceholder";
import LoginPage from "@/pages/login";
import LojaCarrinho from "@/pages/loja/LojaCarrinho";
import LojaCategoria from "@/pages/loja/LojaCategoria";
import LojaHome from "@/pages/loja/LojaHome";
import { PreviewGate } from "@/pages/preview/PreviewGate";
import PreviewUnlock from "@/pages/preview/PreviewUnlock";
import { BrowserRouter, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AuthNavigationBridge />
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/admin" element={<AdminAccess />} />
          <Route path="/preview" element={<PreviewUnlock />} />
          <Route path="/loja" element={<PreviewGate />}>
            <Route index element={<LojaHome />} />
            <Route path="categoria/:slug" element={<LojaCategoria />} />
            <Route path="carrinho" element={<LojaCarrinho />} />
          </Route>
          <Route path="/home" element={<HomePlaceholder />} />
          <Route path="/" element={<LoginPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
