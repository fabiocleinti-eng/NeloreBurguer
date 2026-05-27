# 🧩 src/components/ — Componentes Reutilizáveis

---

## `RocketLoader.jsx`

**O indicador de carregamento principal do app.**
Exibe um foguete SVG realista voando horizontalmente enquanto aguarda dados da API.

### Props
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `mensagem` | string | `'Carregando…'` | Texto exibido abaixo da animação |
| `fullScreen` | boolean | `false` | Se true, ocupa 60vh centralizado; se false, usa padding |

### Estrutura Visual
```
[estrelas de fundo piscando]
[←  contrail laranja  🚀 foguete SVG  →]
         "mensagem pulsando"
```

### Animações
- `rocketLoop 2.2s linear infinite` — foguete de left=-140px até left=calc(100%+20px)
- `starBlink 1.2s` — 5 estrelas piscam em offsets diferentes
- `textPulse 1.4s` — mensagem pulsa entre opacidade 0.5 e 1.0
- Chama do foguete: SMIL animations (`<animate>`) dentro do SVG

### Onde é Usado
Substitui todos os textos "Carregando…" em:
- `LojaHome`, `LojaRestaurante`, `LojaCategoria`
- `LojaPedidos`, `LojaPedidoDetalhe`
- `RestauranteCardapio` (tabs Categorias e Itens)
- `RestauranteEntregadores`

### Exemplo de Uso
```jsx
import { RocketLoader } from '@/components/RocketLoader';

if (carregando) return <RocketLoader mensagem="Buscando restaurantes…" />;
if (carregando) return <RocketLoader mensagem="Carregando pedido…" fullScreen />;
```

---

## `PageTransition.jsx`

Wrapper de rotas. **Atualmente é um passthrough** — apenas renderiza `children`.

O emoji 🚀 de transição entre rotas foi removido (era animação de ~520ms ao trocar de rota).
Mantido como componente para facilitar a adição de novas transições no futuro.

```jsx
// Uso em App.jsx
<PageTransition>
  <Routes>...</Routes>
</PageTransition>
```

---

## `AuthNavigationBridge.jsx`

Componente invisível montado dentro do `BrowserRouter` que injeta a função `navigate` do React Router no serviço de API (`api.js`).

**Por que existe:** o `api.js` precisa redirecionar para `/login` em erros 401/403, mas não tem acesso direto ao React Router. Esse bridge resolve o problema injetando `navigate` via `setAuthNavigate()`.

```jsx
// Montado em App.jsx — não precisa de props, não renderiza nada visível
<AuthNavigationBridge />
```

---

## `loja/LojaHeader.jsx`

Header verde da área do cliente. Presente em todas as páginas da loja.

- Logo: 🚀 PedeFácil
- Botão de endereço: abre modal de localização
- Badge do carrinho: número de itens (via `useCart()`)
- Sino �campainha: abre `NotificacoesPanel`

---

## `loja/LojaBottomNav.jsx`

Barra de navegação inferior da área do cliente.

| Ícone | Label | Rota |
|-------|-------|------|
| 🏠 | Início | `/loja` |
| 📋 | Pedidos | `/loja/pedidos` |
| 🛒 | Carrinho | `/loja/carrinho` |
| 👤 | Perfil | `/loja/perfil` |

Item ativo destacado em verde (`#2D7A4F`), inativo em cinza.

---

## `loja/NotificacoesPanel.jsx`

Painel lateral deslizante de notificações.

- Abre/fecha via prop `aberto` + `onFechar`
- Tipos de notificação: `PEDIDO` (borda verde) e `CUPOM` (borda âmbar)
- "Marcar todas como lidas" → limpa badge do sino no Header
- Atualmente disparado apenas no carregamento da página (sem WebSocket ainda)
