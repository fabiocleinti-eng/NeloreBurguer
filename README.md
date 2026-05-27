# 🚀 PedeFácil — Frontend

Plataforma de delivery multi-restaurante. App web mobile-first em React 19 + Vite + Tailwind CSS 4.

> **Repositório:** será renomeado de `NeloreBurguer` → `PedeFacil` em breve.
> **Contribuidor:** fabioclein.ti@gmail.com

---

## 🏗️ Arquitetura Geral

```
Frontend (React 19 + Vite 6 + Tailwind 4)
    ↓  HTTP / Axios  (timeout 8s | base: VITE_GATEWAY_URL || localhost:3080)
Gateway API (porta 3080)
    ├── ms-usuarios      → /api/usuarios/*
    ├── ms-restaurantes  → /api/restaurantes/*
    ├── ms-cardapio      → /api/categorias/*  /api/itens/*
    ├── ms-pedidos       → /api/pedidos/*
    └── ms-entregadores  → /api/entregadores/*
```

---

## 📁 Estrutura de Pastas

```
src/
├── App.jsx                         # Roteamento + guards de auth
├── main.jsx                        # Entry point
├── assets/images/                  # Imagens estáticas
│   ├── fotoCapa.png                # Logo Nelore Burger
│   ├── fotoCards.png               # Imagem padrão cards de categoria
│   ├── imagemCarrossel.png         # Imagem padrão itens do cardápio
│   ├── batataNB.png                # ⚠️ NÃO EXISTE — recorte esquerdo foto NB (batatas)
│   └── hamburguerNB.png            # ⚠️ NÃO EXISTE — recorte direito foto NB (burger)
├── components/                     # → ver src/components/README.md
├── context/CartContext.jsx         # Estado global do carrinho
├── data/mockCardapio.js            # Mock data offline → ver src/data/README.md
├── pages/
│   ├── login.jsx                   # Login unificado cliente + restaurante
│   ├── Cadastro.jsx
│   ├── EsqueciSenha.jsx / RedefinirSenha.jsx
│   ├── NotFound.jsx                # 404 com foguete explodindo
│   ├── loja/                       # Área cliente (tema verde) → ver pages/loja/README.md
│   └── restaurante/                # Área restaurante (tema azul) → ver pages/restaurante/README.md
├── services/api.js                 # Camada HTTP → ver src/services/README.md
└── utils/
    ├── notificacoes.js
    └── previewAccess.js
```

---

## 🎨 Paleta de Cores

| Área         | Cor Principal | Secundária    | Uso                        |
|--------------|---------------|---------------|----------------------------|
| Cliente      | `#3CB371`     | `#2D7A4F`     | Botões, gradientes         |
| Restaurante  | `#00C4B4`     | `#1A2B4A`     | Destaques, bordas          |
| Fundo cliente| `#F0F7F1`     | `white`       | Cards, conteúdo            |
| Fundo rest.  | `#0F1E34`     | `#1A2B4A`     | Background geral           |

---

## ⚙️ Variáveis de Ambiente

```env
# .env.local
VITE_GATEWAY_URL=http://localhost:3080   # URL do Gateway
VITE_DEV_BYPASS=true                     # Bypass de auth (modo dev)
VITE_PREVIEW_PASSWORD=sua-senha          # Senha de preview
```

> ⚠️ `VITE_DEV_BYPASS=true` só desativa redirect em 401/403.
> Chamadas POST/PUT **ainda falham** sem o backend rodando.
> Problema conhecido — ver seção de Bugs Conhecidos.

---

## 🔐 Autenticação

- JWT salvo em `sessionStorage['nelore_jwt']`
- ID do restaurante salvo em `sessionStorage['nelore_restaurante_id']`
- Injetado automaticamente via interceptor Axios
- Expiração verificada pelo campo `exp` do payload JWT
- Modo dev: token fake gerado pelo botão "⚠️ Modo dev" na tela de login do restaurante

---

## 🛣️ Todas as Rotas

| Rota                         | Componente               | Auth? |
|------------------------------|--------------------------|-------|
| `/` ou `/login`              | LoginPage (toggle)       | ❌    |
| `/cadastro`                  | Cadastro                 | ❌    |
| `/esqueci-senha`             | EsqueciSenha             | ❌    |
| `/redefinir-senha`           | RedefinirSenha           | ❌    |
| `/restaurante/login`         | RestauranteLogin         | ❌    |
| `/restaurante/cadastro`      | RestauranteCadastro      | ❌    |
| `/restaurante/dashboard`     | RestauranteDashboard     | ✅    |
| `/restaurante/perfil`        | RestaurantePerfil        | ✅    |
| `/restaurante/cardapio`      | RestauranteCardapio      | ✅    |
| `/restaurante/entregadores`  | RestauranteEntregadores  | ✅    |
| `/loja`                      | LojaHome (PreviewGate)   | ✅    |
| `/loja/restaurante/:id`      | LojaRestaurante          | ✅    |
| `/loja/categoria/:id`        | LojaCategoria            | ✅    |
| `/loja/carrinho`             | LojaCarrinho             | ✅    |
| `/loja/pedidos`              | LojaPedidos              | ✅    |
| `/loja/pedidos/:id`          | LojaPedidoDetalhe        | ✅    |
| `/loja/perfil`               | LojaPerfil               | ✅    |
| `*`                          | NotFound (404)           | ❌    |

---

## 🚀 Como Rodar

```bash
npm install
npm run dev          # Com backend rodando
# ou
VITE_DEV_BYPASS=true npm run dev   # Sem backend (dados mock apenas para leitura)
```

---

## 🐛 Bugs Conhecidos (aguardando correção)

1. **POST de categorias/itens falha sem backend** — sem mock para escrita em DEV_BYPASS
2. **`restaurantesApi.atualizar` não existe** em api.js — botão "Salvar Perfil" não persiste
3. **`cardapioApi.atualizarItemImagem` não existe** em api.js — upload de fotos não funciona
4. **`criarCategoria` não envia `restauranteId`** no body — backend deve inferir do JWT
5. **Imagens `batataNB.png` e `hamburguerNB.png` não existem** — usando fallback `imagemCarrossel.png`

---

## 📌 Pendências Futuras

- [ ] Renomear repositório para `PedeFacil`
- [ ] Mock local para POST em DEV_BYPASS (localStorage)
- [ ] Reserva de mesa para restaurantes com área física
- [ ] Tela de Pedidos no painel do restaurante
- [ ] Backend: campo RESTAURANTE role + CNPJ no ms-usuarios
