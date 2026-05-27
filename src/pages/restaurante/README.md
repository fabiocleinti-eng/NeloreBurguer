# 🏪 Área do Restaurante — pages/restaurante/

Painel de gerenciamento para o dono do restaurante. Tema visual: **azul escuro (#0F1E34) + ciano (#00C4B4)**.

---

## Arquivos e Responsabilidades

### `RestauranteLogin.jsx`
- Tela de login com branding PedeFácil 🚀
- Campos: email + senha
- Após login bem-sucedido:
  - Salva JWT em `sessionStorage['nelore_jwt']`
  - Extrai `restauranteId` do JWT e salva em `sessionStorage['nelore_restaurante_id']`
- **Modo dev:** botão "⚠️ Modo dev — entrar sem backend" gera JWT fake com `restauranteId: 'dev-restaurante-001'` e `nome: 'Nelore Burger'`
- API: `restauranteApi.login()` → POST `/api/usuarios/login`

### `RestauranteCadastro.jsx`
- Cadastro de novo restaurante na plataforma
- Campos: CNPJ, razão social, nome fantasia, email, senha, telefone, endereço completo
- API: `restauranteApi.cadastro()` → POST `/api/usuarios/register/restaurante`

### `RestauranteDashboard.jsx`
- Painel principal após login
- Header: PedeFácil 🚀 + link "Sair"
- Card do restaurante: avatar (iniciais ou logo) + nome + tipo
  - Nome carregado **imediatamente do JWT** (campo `nome`)
  - Dados completos buscados da API em background
- Cards de navegação: **Perfil**, Cardápio, Entregadores, Pedidos (em breve)
- Função `resolverRestauranteId()`: lê sessionStorage → fallback JWT payload
- API: `restaurantesApi.buscarPorId(restauranteId)`

### `RestaurantePerfil.jsx`
- 3 seções:
  1. **Identidade Visual** — upload de logo (circular) + capa/banner
  2. **Informações** — nome, tipo, descrição (500 chars), telefone, endereço
  3. **Fotos de Mercadorias** — grid 2 colunas com todos os itens do cardápio; permite adicionar/trocar foto de cada produto com preview local antes de confirmar
- Upload usa `FileReader` → preview local imediato sem precisar do backend
- ⚠️ Botão "Salvar Perfil" chama `restaurantesApi.atualizar?.()` — **método não existe em api.js ainda**
- ⚠️ Upload de foto de item chama `cardapioApi.atualizarItemImagem?.()` — **método não existe em api.js ainda**

### `RestauranteCardapio.jsx`
- Tabs: **Categorias** | **Itens**

**Tab Categorias:**
- Lista categorias do restaurante via `cardapioApi.categoriasPorRestaurante(restauranteId)`
- Formulário inline para criar nova categoria (título*, destaque, descrição)
- ⚠️ `criarCategoria()` não envia `restauranteId` no body — backend deve inferir do JWT
- ⚠️ **Sem mock para criação** → falha completamente sem backend

**Tab Itens:**
- Carrega categorias para preencher o select
- Carrega itens de todas as categorias em paralelo
- Formulário para criar item: nome*, descrição, preço (R$), categoria*, disponível
- Preço enviado em centavos: `Math.round(preço * 100)`
- ⚠️ Se nenhuma categoria existir (backend offline), select fica vazio → não consegue criar item

### `RestauranteEntregadores.jsx`
- Lista entregadores do restaurante
- Formulário para cadastrar: nome, email, telefone, veículo, placa
- Toggle ativo/inativo por entregador
- API: `entregadoresApi.listar()`, `entregadoresApi.cadastrar()`, `entregadoresApi.atualizarStatus()`
- RocketLoader enquanto carrega

---

## SessionStorage Usado

| Chave                      | Valor                | Quem grava             | Quem lê                    |
|----------------------------|----------------------|------------------------|----------------------------|
| `nelore_jwt`               | Token JWT            | RestauranteLogin       | api.js (interceptor)       |
| `nelore_restaurante_id`    | UUID do restaurante  | RestauranteLogin, Dashboard | RestauranteCardapio, RestaurantePerfil, RestauranteEntregadores |

---

## Fluxo de Acesso

```
/restaurante/login
    → salva JWT + restauranteId
    → redireciona para /restaurante/dashboard

/restaurante/dashboard
    → lê nome do JWT (imediato)
    → busca dados completos da API (background)
    → cards: Perfil / Cardápio / Entregadores / Pedidos

Cada subpágina:
    → lê restauranteId do sessionStorage
    → faz chamadas específicas da API
```

---

## ⚠️ Problemas Conhecidos

| Problema | Causa | Status |
|----------|-------|--------|
| Criação de categoria falha sem backend | Sem mock para POST em DEV_BYPASS | Pendente |
| Dropdown de categorias vazio em dev | API offline + sem mock | Pendente |
| Salvar perfil não funciona | `restaurantesApi.atualizar` não implementado | Pendente |
| Upload de foto de produto não funciona | `cardapioApi.atualizarItemImagem` não implementado | Pendente |
