import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

/**
 * Item alinhado ao uso em checkout (Fabio / Jorge): id, nome, preço unitário, quantidade.
 * Campos extra são ignorados pelo total mas podem ir no payload do pedido.
 */
const CartContext = createContext(null);

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [addTick, setAddTick] = useState(0);

  const total = useMemo(
    () =>
      roundMoney(
        items.reduce((sum, it) => sum + roundMoney(it.preco) * (it.quantidade || 0), 0)
      ),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((n, it) => n + (it.quantidade || 0), 0),
    [items]
  );

  const addItem = useCallback((item) => {
    const id = item.id ?? item.produtoId ?? item.codigo;
    const preco = roundMoney(item.preco ?? item.valor ?? 0);
    const quantidade = Math.max(1, Number(item.quantidade) || 1);

    setItems((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) {
        return [...prev, { ...item, id, preco, quantidade }];
      }
      const next = [...prev];
      const q = (next[idx].quantidade || 0) + quantidade;
      next[idx] = { ...next[idx], ...item, id, preco, quantidade: q };
      return next;
    });
    setAddTick((t) => t + 1);
  }, []);

  const updateQuantity = useCallback((id, quantidade) => {
    const q = Math.max(0, Math.floor(Number(quantidade) || 0));
    setItems((prev) => {
      if (q === 0) {
        return prev.filter((p) => String(p.id) !== String(id));
      }
      return prev.map((p) =>
        String(p.id) === String(id) ? { ...p, quantidade: q } : p
      );
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      total,
      itemCount,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      addTick,
    }),
    [items, total, itemCount, addItem, updateQuantity, removeItem, clearCart, addTick]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }
  return ctx;
}
