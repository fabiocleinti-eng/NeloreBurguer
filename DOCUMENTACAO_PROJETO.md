# Nelore Burguer — Documentação Completa do Projeto Integrador

> Plataforma de delivery com arquitetura de microsserviços, desenvolvida como Projeto Integrador do curso de Análise e Desenvolvimento de Sistemas — SENAC RJ.

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura de Microsserviços](#2-arquitetura-de-microsserviços)
3. [Fluxo de Comunicação](#3-fluxo-de-comunicação)
4. [Tecnologias Utilizadas](#4-tecnologias-utilizadas)
5. [Banco de Dados](#5-banco-de-dados)
6. [Autenticação e Autorização (JWT)](#6-autenticação-e-autorização-jwt)
7. [API Gateway](#7-api-gateway)
8. [MS-USUÁRIOS (porta 3002)](#8-ms-usuários-porta-3002)
9. [MS-RESTAURANTES (porta 3001)](#9-ms-restaurantes-porta-3001)
10. [MS-PEDIDOS (porta 3003)](#10-ms-pedidos-porta-3003)
11. [MS-ENTREGADORES (porta 3004)](#11-ms-entregadores-porta-3004)
12. [Frontend — NeloreBurguer (porta 5173)](#12-frontend--neloreburguer-porta-5173)
13. [Rotas e Controle de Acesso](#13-rotas-e-controle-de-acesso)
14. [Como Rodar o Projeto](#14-como-rodar-o-projeto)
15. [Perguntas Frequentes para Apresentação](#15-perguntas-frequentes-para-apresentação)

---

## 1. Visão Geral

O **Nelore Burguer** é uma aplicação web de delivery de hambúrgueres que permite:

- **Clientes** se cadastrarem, visualizarem o cardápio, realizarem pedidos e acompanharem entregas.
- **Restaurantes** gerenciarem seu cardápio, pedidos recebidos, entregadores e financeiro.
- **Entregadores** serem cadastrados e associados a pedidos.

A aplicação é dividida em **6 componentes independentes** que se comunicam via rede:

| Componente | Responsabilidade | Porta |
|---|---|---|
| **Frontend (React)** | Interface do usuário | 5173 |
| **API Gateway** | Roteador central e segurança | 3080 |
| **MS-USUÁRIOS** | Cadastro e autenticação de clientes | 3002 |
| **MS-RESTAURANTES** | Restaurantes e cardápio | 3001 |
| **MS-PEDIDOS** | Pedidos e avaliações | 3003 |
| **MS-ENTREGADORES** | Cadastro e status de entregadores | 3004 |

---

## 2. Arquitetura de Microsserviços

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVEGADOR DO USUÁRIO                     │
│                    http://localhost:5173                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP (Axios)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                               │
│                    http://localhost:3080                        │
│  - Valida token JWT                                             │
│  - Roteia para o microsserviço correto                         │
│  - Aplica CORS, Rate Limit e Helmet (segurança)                │
└──────┬─────────────┬─────────────┬──────────────┬──────────────┘
       │             │             │              │
       ▼             ▼             ▼              ▼
  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐
  │MS-USUÁ- │  │MS-RESTA- │  │MS-PEDI- │  │MS-ENTREGA-   │
  │RIOS     │  │URANTES   │  │DOS      │  │DORES         │
  │:3002    │  │:3001     │  │:3003    │  │:3004         │
  └────┬────┘  └────┬─────┘  └────┬────┘  └──────┬───────┘
       │            │             │               │
       ▼            ▼             ▼               ▼
  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐
  │DB users │  │DB restau-│  │DB pedi- │  │DB entrega-   │
  │(MySQL)  │  │rantes    │  │dos      │  │dores         │
  └─────────┘  └──────────┘  └─────────┘  └──────────────┘
```

### Por que Microsserviços?

- **Independência:** Cada serviço pode ser desenvolvido e implantado separadamente.
- **Escalabilidade:** Se o módulo de pedidos receber muita carga, só ele é escalado.
- **Divisão de responsabilidades:** Cada equipe cuida do seu serviço.
- **Banco de dados isolado:** Cada serviço tem sua própria base de dados, evitando dependências.

---

## 3. Fluxo de Comunicação

### Exemplo: Cliente fazendo login

```
1. Usuário digita email e senha na tela de login (React)
2. Frontend envia: POST http://localhost:3080/api/usuarios/login
3. Gateway recebe e verifica: é rota pública (não precisa de token)
4. Gateway repassa para: POST http://localhost:3002/login
5. MS-USUÁRIOS consulta o banco MySQL, verifica senha (bcrypt)
6. MS-USUÁRIOS gera e retorna um token JWT
7. Gateway retorna o token JWT para o frontend
8. Frontend salva o token no sessionStorage
9. Todas as próximas requisições incluem o token no cabeçalho:
   Authorization: Bearer <token>
```

### Exemplo: Cliente fazendo um pedido

```
1. Frontend envia: POST http://localhost:3080/api/pedidos
   (com token JWT no cabeçalho e itens do carrinho no corpo)
2. Gateway valida o token JWT (se inválido: 401 Unauthorized)
3. Gateway repassa para: POST http://localhost:3003/api/pedidos
4. MS-PEDIDOS salva o pedido no banco de dados
5. Retorna o pedido criado com status AGUARDANDO_CONFIRMACAO
```

---

## 4. Tecnologias Utilizadas

### Backend (todos os microsserviços)

| Tecnologia | Para que serve |
|---|---|
| **Node.js** | Ambiente de execução JavaScript no servidor |
| **TypeScript** | JavaScript com tipagem estática (detecta erros antes de rodar) |
| **Fastify** | Framework HTTP — mais rápido que Express, validação nativa |
| **Prisma ORM** | Conexão com banco de dados, evita SQL manual |
| **Zod** | Validação de dados de entrada (schemas) |
| **bcrypt** | Criptografar senhas antes de salvar no banco |
| **@fastify/jwt** | Gerar e validar tokens JWT |
| **tsx watch** | Reinicia automaticamente ao salvar o arquivo (desenvolvimento) |

### Frontend

| Tecnologia | Para que serve |
|---|---|
| **React 19** | Biblioteca para construir interfaces de usuário |
| **Vite** | Empacotador/servidor de desenvolvimento ultra-rápido |
| **React Router v6** | Navegação entre páginas sem recarregar |
| **Axios** | Cliente HTTP para chamadas à API |
| **Tailwind CSS** | Estilização por classes utilitárias |
| **Context API** | Gerenciamento de estado global (carrinho de compras) |

### Gateway

| Tecnologia | Para que serve |
|---|---|
| **@fastify/http-proxy** | Redireciona requisições para o microsserviço correto |
| **@fastify/cors** | Controle de quais origens podem acessar a API |
| **@fastify/helmet** | Adiciona cabeçalhos de segurança HTTP |
| **@fastify/rate-limit** | Limita número de requisições (anti-spam, anti-ataque) |
| **jsonwebtoken** | Validação do token JWT no gateway |

### Banco de Dados

| Tecnologia | Para que serve |
|---|---|
| **MySQL** | Banco de dados relacional hospedado no servidor SENAC |
| **Prisma Migrate** | Cria e versiona as tabelas automaticamente |

---

## 5. Banco de Dados

Cada microsserviço possui seu **próprio banco de dados** no servidor MySQL do SENAC:

```
Host: edumysql.acesso.rj.senac.br:3306
```

| Microsserviço | Banco de dados |
|---|---|
| MS-USUÁRIOS | `20261_prjint5_matheuslopes` |
| MS-RESTAURANTES | `20261_prjint5_joaofreitas` |
| MS-PEDIDOS | `20261_prjint5_fabiosilva` |
| MS-ENTREGADORES | `20261_prjint5_barbaraferreira` |
| Gateway (auditoria) | `20261_prjint5_fabioclein` |

### Tabelas — MS-USUÁRIOS

```
Usuario
├── id            (identificador único — BigInt)
├── nome          (nome completo)
├── cpf           (único no sistema)
├── email         (único no sistema)
├── telefone      (opcional)
├── senha         (hash bcrypt — nunca em texto puro)
├── ativo         (true/false — soft delete)
├── role          (USER ou ADMIN)
└── dataCriacao

Endereco
├── id
├── usuarioId     (chave estrangeira → Usuario)
├── rua, número, bairro, cidade, cep, complemento

TokenRecuperacao   (para "Esqueci minha senha")
├── id
├── usuarioId     (chave estrangeira → Usuario)
├── token         (único)
├── dataExpiracao
└── utilizado     (true/false)
```

### Tabelas — MS-RESTAURANTES

```
Restaurante
├── id            (UUID — identificador universal)
├── nome, cnpj, email, senha
├── status        (ABERTO / FECHADO / INATIVO)
├── tipo          (tipo de culinária)
├── imagem        (foto em base64)
├── capa          (imagem de capa em base64)
├── endereço completo (logradouro, número, bairro, cidade, cep)
└── criado_em

categorias_cardapio
├── id
├── restaurante_id (chave estrangeira → Restaurante)
└── titulo

itens_cardapio
├── id
├── categoria_id   (chave estrangeira → categorias_cardapio)
├── nome, descricao
├── preco_centavos (preço em centavos, ex: R$ 25,90 = 2590)
├── disponivel     (true/false)
└── imagem         (base64)
```

### Tabelas — MS-PEDIDOS

```
Pedido
├── id              (UUID)
├── clienteId       (ID do usuário do MS-USUÁRIOS)
├── restauranteId   (ID do restaurante do MS-RESTAURANTES)
├── entregadorId    (opcional — ID do entregador)
├── status          (AGUARDANDO_CONFIRMACAO → CONFIRMADO → EM_PREPARO
│                    → EM_ENTREGA → ENTREGUE / CANCELADO)
├── endereço de entrega completo
├── formaPagamento  (CARTAO_CREDITO, CARTAO_DEBITO, PIX, DINHEIRO, VALE_REFEICAO)
├── subtotal        (centavos)
├── taxaEntrega     (centavos)
├── desconto        (centavos)
├── total           (centavos)
└── observacoes

ItemPedido           (itens dentro do pedido)
├── pedidoId         (FK → Pedido)
├── nomeProduto      (nome copiado no momento do pedido)
├── quantidade
├── precoUnitario    (centavos — copiado no momento do pedido)
└── subtotal

HistoricoStatus      (rastrea cada mudança de status)
├── pedidoId
├── statusAnterior / statusNovo
└── origem          (CLIENTE, RESTAURANTE, SISTEMA)

AvaliacaoPedido      (avaliação após entrega)
├── pedidoId, clienteId
├── nota            (1 a 5)
└── comentario

MensagemPedido       (chat entre restaurante e cliente)
├── pedidoId, remetenteId
├── texto
└── lida
```

### Tabelas — MS-ENTREGADORES

```
Entregador
├── id, nome, telefone, cpf, cnh
├── foto            (binário)
├── status          (DISPONIVEL / EM_ENTREGA / INATIVO)
└── veiculo_id      (FK → Veiculo)

Veiculo
├── id, tipo, placa, modelo
```

---

## 6. Autenticação e Autorização (JWT)

### O que é JWT?

**JWT (JSON Web Token)** é um token assinado digitalmente que o servidor gera após o login. O cliente o guarda e envia em todas as requisições seguintes para provar sua identidade.

Estrutura: `header.payload.signature`

O **payload** contém:
```json
{
  "id": 1,
  "email": "cliente@email.com",
  "nome": "João Silva",
  "role": "USER",
  "iat": 1749600000,
  "exp": 1749600900
}
```

### Fluxo de autenticação

```
1. Login → servidor valida email/senha
2. Servidor assina o JWT com a chave secreta (JWT_SECRET)
3. Retorna o token para o frontend
4. Frontend salva em sessionStorage["nelore_jwt"]
5. Cada requisição inclui: Authorization: Bearer <token>
6. Gateway valida a assinatura do token
7. Se inválido ou expirado → retorna 401 Unauthorized
```

### Níveis de acesso (Roles)

| Role | Quem usa | O que pode fazer |
|---|---|---|
| `USER` | Clientes cadastrados | Fazer pedidos, ver cardápio, editar perfil |
| `ADMIN` | Administradores | Listar/alterar roles de usuários |
| `RESTAURANTE` | Donos de restaurante | Gerenciar cardápio, aceitar/atualizar pedidos |

### Proteção no Frontend (React Router)

```jsx
// Rotas protegidas por tipo de usuário:
<Route element={<RequireAuth />}>         // exige token válido
  <Route element={<RequireCliente />}>    // exige role USER
    <Route path="/loja/*" ... />
  </Route>
  <Route element={<RequireRestaurante />}>// exige role RESTAURANTE
    <Route path="/restaurante/*" ... />
  </Route>
</Route>
```

---

## 7. API Gateway

O Gateway é o **ponto de entrada único** da aplicação. Nenhum microsserviço é acessado diretamente pelo frontend.

### Mapa de rotas do Gateway

| URL chamada pelo frontend | Redirecionado para |
|---|---|
| `POST /api/usuarios/login` | `http://localhost:3002/login` |
| `POST /api/usuarios/register` | `http://localhost:3002/register` |
| `GET /api/usuarios/me` | `http://localhost:3002/me` |
| `PUT /api/usuarios/me` | `http://localhost:3002/me` |
| `GET /api/restaurantes` | `http://localhost:3001/api/restaurantes` |
| `GET /api/categorias/restaurante/:id` | `http://localhost:3001/api/categorias/restaurante/:id` |
| `GET /api/itens` | `http://localhost:3001/api/itens` |
| `POST /api/pedidos` | `http://localhost:3003/api/pedidos` |
| `GET /api/entregadores` | `http://localhost:3004/api/entregadores` |

### Rotas públicas (sem token)

```
POST /api/usuarios/login
POST /api/usuarios/register
POST /api/restaurantes/login
POST /api/restaurantes/cadastro
```

### Funcionalidades de segurança

- **CORS:** Só aceita requisições de `localhost:5173`, `localhost:5174`... `localhost:5180`
- **Rate Limit:** Máximo 200 requisições por minuto por IP
- **Helmet:** Cabeçalhos HTTP de segurança (previne XSS, clickjacking, etc.)
- **JWT Validation:** Valida assinatura e expiração do token antes de repassar

---

## 8. MS-USUÁRIOS (porta 3002)

### Responsabilidade
Gerenciar o cadastro, autenticação e perfil dos clientes da plataforma.

### Endpoints

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/register` | Pública | Cadastrar novo usuário |
| `POST` | `/login` | Pública | Autenticar e retornar JWT |
| `GET` | `/me` | Autenticado | Dados do usuário logado |
| `PUT` | `/me` | Autenticado | Editar nome, telefone ou senha |
| `GET` | `/` | Admin | Listar todos os usuários |
| `PATCH` | `/:id/role` | Admin | Alterar role de um usuário |

### Validações ao cadastrar (`POST /register`)

- Nome: obrigatório
- CPF: formato válido (11 dígitos com validação de dígito verificador)
- Email: formato de e-mail válido
- Senha: mínimo 6 caracteres
- Não permite CPF ou e-mail duplicados (retorna 409 Conflict)

### Edição de perfil (`PUT /me`)

O usuário pode alterar:
- **Nome** (sem senha)
- **Telefone** (sem senha)
- **Senha** — exige confirmar a senha atual antes de alterar

Após atualizar, o servidor retorna um **novo JWT** com o nome atualizado, e o frontend o salva automaticamente.

---

## 9. MS-RESTAURANTES (porta 3001)

### Responsabilidade
Gerenciar o cadastro dos restaurantes, suas categorias de cardápio e itens do cardápio.

### Endpoints — Autenticação do Restaurante

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/restaurantes/cadastro` | Cadastrar restaurante |
| `POST` | `/api/restaurantes/login` | Login do restaurante (retorna JWT) |

### Endpoints — Restaurantes

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/restaurantes` | Listar todos os restaurantes |
| `GET` | `/api/restaurantes/:id` | Buscar restaurante por ID |
| `PUT` | `/api/restaurantes/:id` | Atualizar dados do restaurante |

### Endpoints — Cardápio

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/categorias` | Criar categoria |
| `GET` | `/api/categorias/restaurante/:id` | Categorias do restaurante |
| `PUT` | `/api/categorias/:id` | Editar categoria |
| `DELETE` | `/api/categorias/:id` | Excluir categoria |
| `POST` | `/api/itens` | Criar item do cardápio |
| `GET` | `/api/itens` | Listar itens (filtro por categoria) |
| `GET` | `/api/itens/:id` | Buscar item por ID |
| `PUT` | `/api/itens/:id` | Editar item |
| `DELETE` | `/api/itens/:id` | Excluir item |

### Observação sobre preços
Os preços são armazenados em **centavos** (inteiros) para evitar erros de ponto flutuante.
- R$ 25,90 → salvo como `2590`
- R$ 100,00 → salvo como `10000`

---

## 10. MS-PEDIDOS (porta 3003)

### Responsabilidade
Gerenciar todo o ciclo de vida de um pedido, desde a criação até a entrega e avaliação.

### Ciclo de vida do pedido

```
AGUARDANDO_CONFIRMACAO   (pedido criado pelo cliente)
        ↓
    CONFIRMADO           (restaurante aceita)
        ↓
    EM_PREPARO           (cozinha preparando)
        ↓
    EM_ENTREGA           (entregador a caminho)
        ↓
    ENTREGUE             (cliente recebeu)

    CANCELADO            (pode ser cancelado em AGUARDANDO_CONFIRMACAO)
```

### Endpoints — Cliente

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/pedidos` | Criar pedido |
| `GET` | `/api/pedidos` | Meus pedidos (paginado) |
| `GET` | `/api/pedidos/:id` | Detalhe do pedido |
| `DELETE` | `/api/pedidos/:id` | Cancelar pedido |
| `POST` | `/api/pedidos/:id/avaliacao` | Avaliar (só após ENTREGUE) |

### Endpoints — Restaurante

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/pedidos/restaurante/:id` | Pedidos do restaurante |
| `PATCH` | `/api/pedidos/:id/status` | Atualizar status do pedido |

### Endpoints — Chat

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/pedidos/:id/mensagens` | Enviar mensagem |
| `GET` | `/api/pedidos/:id/mensagens` | Ver mensagens |
| `PATCH` | `/api/pedidos/:id/mensagens/lidas` | Marcar como lidas |

---

## 11. MS-ENTREGADORES (porta 3004)

### Responsabilidade
Cadastrar e gerenciar os entregadores, seus veículos e disponibilidade.

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/entregadores` | Listar todos |
| `GET` | `/api/entregadores/disponiveis` | Listar disponíveis |
| `GET` | `/api/entregadores/:id` | Buscar por ID |
| `POST` | `/api/entregadores` | Cadastrar entregador |
| `PUT` | `/api/entregadores/:id` | Atualizar dados |
| `PATCH` | `/api/entregadores/:id/status` | Alterar status |
| `DELETE` | `/api/entregadores/:id` | Remover |

### Status dos entregadores

- `DISPONIVEL` — Pode receber pedidos
- `EM_ENTREGA` — Realizando uma entrega
- `INATIVO` — Não está trabalhando

---

## 12. Frontend — NeloreBurguer (porta 5173)

### Estrutura de páginas

```
src/pages/
├── auth/
│   ├── Login.jsx              → Página de login do cliente
│   ├── Cadastro.jsx           → Cadastro de cliente (com validação CPF)
│   ├── EsqueciSenha.jsx       → Recuperação de senha
│   └── RedefinirSenha.jsx     → Redefinição de senha com token
│
├── loja/                      → Área do cliente (protegida)
│   ├── LojaHome.jsx           → Lista de restaurantes
│   ├── LojaCardapio.jsx       → Cardápio do restaurante
│   ├── LojaCarrinho.jsx       → Carrinho de compras
│   ├── LojaPedidos.jsx        → Histórico de pedidos
│   └── LojaPerfil.jsx         → Perfil do cliente (edição)
│
├── restaurante/               → Dashboard do restaurante (protegido)
│   ├── RestauranteLogin.jsx
│   ├── RestauranteCadastro.jsx  (com validação CNPJ)
│   ├── RestauranteDashboard.jsx
│   ├── RestaurantePerfil.jsx
│   ├── RestauranteCardapio.jsx
│   ├── RestaurantePedidos.jsx
│   ├── RestauranteEntregadores.jsx
│   └── RestauranteFinanceiro.jsx
│
└── HomePlaceholder.jsx        → Página inicial (redireciona)
```

### Gerenciamento de estado

- **CartContext** — Armazena os itens do carrinho durante a sessão (Context API)
- **sessionStorage** — Guarda o token JWT (`nelore_jwt`) e o ID do restaurante logado (`nelore_restaurante_id`)
- **localStorage** — Guarda os IDs dos entregadores cadastrados por restaurante (`nelore_entregadores_<id>`)

### Como o frontend chama a API

Todas as chamadas passam pelo arquivo `src/services/api.js`:

```javascript
// Configuração base
const gatewayApi = axios.create({
  baseURL: 'http://localhost:3080',  // Gateway
  timeout: 8000
});

// O token é injetado automaticamente em cada requisição:
gatewayApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('nelore_jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Grupos de chamadas:
usuariosApi.login(email, senha)
usuariosApi.atualizarPerfil(payload)
restaurantesApi.listar()
cardapioApi.listarCategorias(restauranteId)
pedidosApi.criar(pedido)
entregadoresApi.listar()
```

---

## 13. Rotas e Controle de Acesso

### Rotas públicas (qualquer pessoa acessa)

```
/                   → Redireciona para /login
/login              → Login do cliente
/cadastro           → Cadastro de cliente
/esqueci-senha      → Recuperação de senha
/restaurante/login  → Login do restaurante
/restaurante/cadastro → Cadastro do restaurante
```

### Rotas protegidas — apenas clientes autenticados

```
/loja/              → Home com restaurantes
/loja/carrinho      → Carrinho de compras
/loja/pedidos       → Meus pedidos
/loja/perfil        → Editar perfil
/loja/restaurante/:id → Cardápio do restaurante
```

### Rotas protegidas — apenas restaurantes autenticados

```
/restaurante/dashboard      → Visão geral
/restaurante/perfil         → Editar perfil do restaurante
/restaurante/cardapio       → Gerenciar cardápio
/restaurante/pedidos        → Ver e atualizar pedidos
/restaurante/entregadores   → Gerenciar entregadores
/restaurante/financeiro     → Relatório financeiro
```

---

## 14. Como Rodar o Projeto

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Acesso à rede do SENAC (banco de dados remoto)

### Ordem de inicialização

```powershell
# 1. MS-USUÁRIOS
cd "ProjetoIntegradorMicroServi-o"
npm run dev

# 2. MS-RESTAURANTES
cd "API-restaurantes-e-cardapios"
npm run dev

# 3. MS-PEDIDOS
cd "ms-pedidos"
npm run dev

# 4. MS-ENTREGADORES
cd "delivery-entregador"
npm run dev

# 5. Gateway (iniciar por último entre os backends)
cd "Gateway-Integrador-V\gateway"
npm run dev

# 6. Frontend
cd "NeloreBurguer"
npm run dev:web
```

### Variáveis de ambiente importantes

**Gateway (`.env`):**
```
JWT_SECRET=<chave secreta compartilhada>
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,...
PORT=3080
```

**Microsserviços (`.env`):**
```
DATABASE_URL=mysql://<user>:<pass>@edumysql.acesso.rj.senac.br:3306/<banco>
JWT_SECRET=<mesma chave do gateway>
PORT=<porta do serviço>
```

---

## 15. Perguntas Frequentes para Apresentação

**P: Por que usar microsserviços em vez de um único servidor?**

R: Microsserviços permitem que cada parte do sistema seja desenvolvida, testada e implantada de forma independente. Se o serviço de pedidos tiver um problema, o cadastro de usuários continua funcionando. Também facilita a divisão de trabalho na equipe — cada integrante foi responsável por um serviço.

---

**P: Por que ter um API Gateway?**

R: O Gateway centraliza a segurança (validação de JWT), o controle de acesso (CORS) e o roteamento. Sem ele, o frontend precisaria saber o endereço de cada microsserviço individualmente, e cada um teria que implementar suas próprias regras de CORS e autenticação.

---

**P: Por que as senhas não ficam salvas em texto no banco?**

R: Porque se o banco for invadido, as senhas estariam expostas. Usamos bcrypt, que transforma a senha em um hash irreversível. Na hora do login, comparamos o hash da senha digitada com o hash salvo — se iguais, a senha está correta.

---

**P: O que é JWT e por que usar?**

R: JWT (JSON Web Token) é um padrão de autenticação stateless — o servidor não precisa guardar sessões. O token é assinado com uma chave secreta, então o servidor consegue verificar se ele é válido sem consultar banco de dados. Isso é mais escalável para microsserviços.

---

**P: Como os microsserviços se comunicam entre si?**

R: Neste projeto, os microsserviços se comunicam principalmente através do Gateway — o frontend chama o Gateway, que repassa para o serviço correto. Para casos onde um serviço precisa chamar outro diretamente (ex: MS-PEDIDOS verificando entregadores), eles usam HTTP interno pelo `localhost`.

---

**P: Por que os preços são guardados em centavos?**

R: Valores monetários em ponto flutuante (float/decimal) podem ter erros de precisão. Por exemplo: `0.1 + 0.2 = 0.30000000000000004` em JavaScript. Guardar em inteiros (centavos) evita esse problema completamente.

---

**P: Como funciona o controle de acesso por roles?**

R: Ao fazer login, o JWT retornado contém a `role` do usuário (`USER`, `ADMIN` ou `RESTAURANTE`). O frontend usa essa informação para direcionar para a área correta e bloquear rotas indevidas. O Gateway e os microsserviços também verificam a role para permitir ou negar ações específicas.

---

**P: O que acontece se o token expirar?**

R: A requisição retorna 401 Unauthorized. O frontend detecta esse erro e redireciona o usuário para a tela de login automaticamente.

---

**P: Por que usar TypeScript no backend?**

R: TypeScript adiciona tipagem estática ao JavaScript, detectando erros em tempo de desenvolvimento (antes de executar). Isso evita bugs como passar um `string` onde se espera um `number`, o que é comum em APIs.

---

**P: O que é o Prisma ORM?**

R: Prisma é uma ferramenta que permite trabalhar com banco de dados usando código TypeScript em vez de SQL bruto. Define os modelos no arquivo `schema.prisma`, e o Prisma gera as queries e mantém o banco sincronizado com o código.

---

**P: Por que o banco de dados é remoto (servidor SENAC)?**

R: Para simular um ambiente real de produção, onde o banco de dados fica em um servidor separado da aplicação. Também facilita que todos os integrantes do grupo trabalhem com os mesmos dados.

---

*Documentação gerada em junho de 2026 — Projeto Integrador V — SENAC RJ*
