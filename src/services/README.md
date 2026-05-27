# 📡 src/services/api.js — Camada HTTP

Toda comunicação com o backend passa por este arquivo. Usa Axios com instância única configurada.

---

## Configuração da Instância Axios

```js
baseURL : VITE_GATEWAY_URL || 'http://localhost:3080'
timeout : 8000ms  (8 segundos)
headers : Content-Type: application/json | Accept: application/json
```

**Request Interceptor** — adiciona automaticamente em cada request:
- `Authorization: Bearer <token>` (lido de `sessionStorage['nelore_jwt']`)
- `X-Request-Id: <uuid>` (gerado por request)

**Response Interceptor** — trata erros globalmente:
| Status | Ação |
|--------|------|
| 401/403 | Limpa sessão + redireciona `/login` *(exceto se DEV_BYPASS=true)* |
| 429 | Lança erro amigável com tempo de retry |
| 503 / timeout | "Serviço temporariamente indisponível" |
| Sem resposta | "Sem conexão com o servidor" |

---

## Endpoints por Módulo

### `usuariosApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/usuarios/login` | Login do cliente |
| POST | `/api/usuarios/register` | Cadastro do cliente |
| POST | `/api/usuarios/esqueci-senha` | Recuperação de senha |
| POST | `/api/usuarios/redefinir-senha` | Redefinição via token |
| POST | `/api/usuarios/login/google` | Login Google |
| PUT  | `/api/usuarios/me` | Atualizar perfil do cliente |

### `restaurantesApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/restaurantes` | Listar todos restaurantes |
| GET | `/api/restaurantes/:id` | Buscar restaurante por ID |
| ⚠️ **FALTA** | — | `atualizar(id, body)` — salvar perfil do restaurante |

### `cardapioApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET  | `/api/categorias/restaurante/:restauranteId` | Listar categorias |
| GET  | `/api/itens?categoria_id=:id` | Listar itens de uma categoria |
| POST | `/api/categorias` | Criar categoria *(⚠️ não envia restauranteId no body — backend infere do JWT)* |
| POST | `/api/itens` | Criar item |
| ⚠️ **FALTA** | — | `atualizarItemImagem(id, formData)` — upload de foto de item |

### `pedidosApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST   | `/api/pedidos` | Criar pedido |
| GET    | `/api/pedidos` | Listar pedidos do cliente logado |
| GET    | `/api/pedidos/:id` | Buscar pedido por ID |
| DELETE | `/api/pedidos/:id` | Cancelar pedido |
| POST   | `/api/pedidos/:id/avaliacao` | Avaliar pedido entregue |

### `entregadoresApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| GET   | `/api/entregadores/status/:pedidoId` | Status/info do entregador em rota |
| GET   | `/api/entregadores` | Listar entregadores do restaurante |
| POST  | `/api/entregadores` | Cadastrar novo entregador |
| PATCH | `/api/entregadores/:id` | Ativar/desativar entregador |

### `restauranteApi` (login/cadastro)
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/usuarios/login` | Login do restaurante *(mesmo endpoint do cliente)* |
| POST | `/api/usuarios/register/restaurante` | Cadastrar novo restaurante |

### `pagamentosApi`
| Método | Endpoint | Uso |
|--------|----------|-----|
| POST | `/api/pagamentos/processar` | Processar pagamento do pedido |

---

## Funções Utilitárias Exportadas

```js
getStoredToken()              // Lê JWT do sessionStorage
clearStoredToken()            // Remove JWT do sessionStorage
persistTokenFromResponse(data) // Extrai token da resposta e salva no sessionStorage
setAuthNavigate(fn)           // Injeta navigate() para redirect em 401
```

---

## Formato do JWT (payload esperado)

```json
{
  "sub": "uuid-do-usuario-ou-restaurante",
  "id": "uuid",
  "restauranteId": "uuid",   // presente se role = RESTAURANTE
  "nome": "Nome Exibido",
  "email": "email@...",
  "role": "CLIENTE | RESTAURANTE | ADMIN",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

## ⚠️ Limitações Modo DEV_BYPASS

`VITE_DEV_BYPASS=true` **apenas** ignora redirect em 401/403.

Operações de escrita (POST/PUT/PATCH/DELETE) **continuam tentando o backend real**.
Se o backend não estiver rodando:
- Erro imediato: `ECONNREFUSED` → "Sem conexão com o servidor"
- Timeout: após 8 segundos → "Serviço temporariamente indisponível"

**Para desenvolver sem backend**, seria necessário implementar um mock local via `localStorage`
que intercepte chamadas POST quando `DEV_BYPASS=true`. (Pendente)

---

## Como Adicionar Novos Endpoints

```js
// Em api.js, adicione ao objeto correspondente:
export const restaurantesApi = {
  // ... existentes ...
  atualizar: (id, body) => api.put(`/api/restaurantes/${encodeURIComponent(id)}`, body),
  deletar:   (id)       => api.delete(`/api/restaurantes/${encodeURIComponent(id)}`),
};
```
