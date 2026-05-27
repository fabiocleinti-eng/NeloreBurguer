# 🛍️ Área do Cliente — pages/loja/

Experiência de compra do usuário final. Tema visual: **verde (#3CB371/#2D7A4F) + fundo claro (#F0F7F1)**.

---

## Arquivos e Responsabilidades

### `LojaHome.jsx`
- Lista todos os restaurantes disponíveis
- Barra de busca por nome ou tipo de restaurante
- Ao clicar em um restaurante: salva seu ID em `sessionStorage['nelore_restaurante_id']` e navega para `/loja/restaurante/:id`
- Estado inicial: `RESTAURANTES_MOCK` (dados mock instantâneos)
- API: `restaurantesApi.listar()` — timeout de segurança 2s, atualiza se API responder
- RocketLoader enquanto carrega (máx 2 segundos)
- Componentes internos: `CardRestaurante`, `BadgeStatus`

### `LojaRestaurante.jsx`
- Exibe as categorias do cardápio de um restaurante específico
- Estado inicial: mock `CATEGORIAS` + restaurante do `RESTAURANTES_MOCK`
- API: `restaurantesApi.buscarPorId(id)` + `cardapioApi.categoriasPorRestaurante(id)`
- Timeout de segurança: 2 segundos → mostra mock se API não responder
- Cards de categoria: imagem, título, destaque, descrição
- Link: `/loja/categoria/:categoriaId`
- RocketLoader enquanto carrega

### `LojaCategoria.jsx`
- Grid 2 colunas com itens de uma categoria específica
- Botão "Adicionar" → adiciona ao carrinho via `useCart()` + feedback visual "✓ Adicionado" por 1.2s
- Estado inicial: `MOCK_ITENS` (4 produtos genéricos)
- API: `cardapioApi.itensPorCategoria(id)`
- Normalização de preço: aceita `preco_centavos`, `precoCentavos`, `price_cents` ou `preco`
- RocketLoader enquanto carrega

### `LojaCarrinho.jsx`
- Resumo do pedido com todos os itens
- Seleção de forma de pagamento: PIX, Cartão Crédito, Cartão Débito, Dinheiro, Vale-Refeição
- Campo de observações
- Botão "Confirmar Pedido" → `pedidosApi.criar()` → POST `/api/pedidos`
- Payload inclui: itens (com quantidade e preço), forma de pagamento, restauranteId, endereço, observações
- Após sucesso: limpa carrinho + redireciona `/loja/pedidos`

### `LojaPedidos.jsx`
- Lista todos os pedidos do usuário logado
- API: `pedidosApi.meusPedidos()` → GET `/api/pedidos`
- Suporta estruturas: `data[]`, `data.pedidos[]`, `data.data[]`
- Preços convertidos de centavos para R$
- Link para detalhe: `/loja/pedidos/:id`
- RocketLoader enquanto carrega

### `LojaPedidoDetalhe.jsx`
- Detalhe completo de um pedido específico
- **Timeline de status** (5 etapas): Aguardando → Confirmado → Em Preparo → Em Entrega → Entregue
- **CardEntregador**: quando status = `EM_ENTREGA`, busca info do entregador (atualiza a cada 30s)
- **AvaliacaoPedido**: quando status = `ENTREGUE`, exibe formulário de 1-5 estrelas + comentário
- Botão cancelar: disponível apenas quando status = `AGUARDANDO_CONFIRMACAO`
- APIs: `pedidosApi.buscarPorId()`, `entregadoresApi.statusEntrega()`, `pedidosApi.avaliar()`
- RocketLoader enquanto carrega

### `LojaPerfil.jsx`
- Perfil do usuário cliente
- Campos: nome, email, telefone (editáveis)
- Botão "Salvar" → `usuariosApi.atualizarPerfil()` → PUT `/api/usuarios/me`
- Botão "Sair" (cinza) → limpa sessão e redireciona para `/login`

---

## CartContext (`context/CartContext.jsx`)

Estado global do carrinho, disponível em todas as telas de loja.

```js
const { items, total, addItem, removeItem, clearCart } = useCart();

// addItem({ id, nome, preco, categoria })
// removeItem(id)
// clearCart()
// total: number (soma de preco * quantidade)
```

---

## Fluxo de Compra

```
/loja                     → escolhe restaurante
/loja/restaurante/:id     → vê categorias do menu
/loja/categoria/:id       → adiciona itens ao carrinho
/loja/carrinho            → revisa pedido + escolhe pagamento + confirma
/loja/pedidos             → acompanha status do pedido
/loja/pedidos/:id         → detalhe com timeline em tempo real
```

---

## PreviewGate (`pages/preview/`)

A rota `/loja` e todas as sub-rotas estão dentro do `PreviewGate`, que exige uma senha de preview antes de liberar acesso.

- Senha configurada em `VITE_PREVIEW_PASSWORD`
- Senha verificada é salva em `localStorage['preview_access']`
- `PreviewUnlock.jsx` → tela para digitar a senha → redireciona para `/loja` se correta

---

## Componentes de Layout (`components/loja/`)

| Componente | Descrição |
|------------|-----------|
| `LojaHeader` | Header verde com logo PedeFácil, botão de endereço, badge carrinho, sino de notificações |
| `LojaBottomNav` | Barra inferior: 🏠 Início, 📋 Pedidos, 🛒 Carrinho, 👤 Perfil |
| `NotificacoesPanel` | Painel lateral deslizante com notificações de pedidos e cupons |
