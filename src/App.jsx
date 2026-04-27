import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthNavigationBridge } from '@/components/AuthNavigationBridge';
import LoginPage from '@/pages/login';
import HomePlaceholder from '@/pages/HomePlaceholder';
import CadastroPlaceholder from '@/pages/CadastroPlaceholder';
import AdminAccess from '@/pages/AdminAccess';
import { PreviewGate } from '@/pages/preview/PreviewGate';
import PreviewUnlock from '@/pages/preview/PreviewUnlock';
import LojaHome from '@/pages/loja/LojaHome';
import LojaCategoria from '@/pages/loja/LojaCategoria';
import LojaCarrinho from '@/pages/loja/LojaCarrinho';

export default function App() {
  return (
    <BrowserRouter>
      <AuthNavigationBridge />
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPlaceholder />} />
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
