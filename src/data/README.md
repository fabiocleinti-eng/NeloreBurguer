# 📦 src/data/mockCardapio.js — Dados Mock

Dados de demonstração usados como fallback quando o backend não está disponível.
Importado automaticamente pelas páginas que têm timeout de segurança.

---

## Exports Disponíveis

### `RESTAURANTES_MOCK`
Array com 1 restaurante de demonstração (Nelore Burger).

```js
[{
  id: '00000000-0000-0000-0000-000000000001',
  nome: 'Nelore Burguer',
  tipo: 'Hambúrgueres Artesanais',
  status: 'ABERTO',
  taxaEntrega: 500,        // centavos = R$ 5,00
  tempoEstimado: '30–45 min',
  avaliacao: 4.8,
  imagem: fotoCapa,        // src/assets/images/fotoCapa.png
}]
```

**Usado em:** `LojaHome.jsx` (estado inicial), `LojaRestaurante.jsx` (fallback)

---

### `CATEGORIAS`
Array com 4 categorias de demonstração.

```js
[
  { slug: 'artesanais',   titulo: 'Artesanais',   imagem: hamburguerNB, ... },
  { slug: 'tradicionais', titulo: 'Tradicionais', imagem: hamburguerNB, ... },
  { slug: 'batatas',      titulo: 'Batatas',      imagem: batataNB,     ... },
  { slug: 'petiscos',     titulo: 'Petiscos',     imagem: imgCarrossel, ... },
]
```

> ⚠️ `batataNB` e `hamburguerNB` usam `imgCarrossel` como fallback enquanto os arquivos
> `src/assets/images/batataNB.png` e `src/assets/images/hamburguerNB.png` não existirem.
>
> **Para ativar as imagens reais:**
> 1. Adicione os arquivos de imagem (recortes da foto NB enviada)
> 2. Descomente as linhas de import em `mockCardapio.js`
> 3. Remova as duas linhas `const batataNB = imgCarrossel` logo abaixo dos imports

**Usado em:** `LojaRestaurante.jsx` (fallback de categorias)

---

### `PRODUTOS_POR_CATEGORIA`
Objeto com 4 arrays de produtos (1 por categoria), com 4 itens cada.

```js
{
  artesanais:  [{ id, nome, preco, imagem: hamburguerNB, categoria }],
  tradicionais:[{ id, nome, preco, imagem: hamburguerNB, categoria }],
  batatas:     [{ id, nome, preco, imagem: batataNB,     categoria }],
  petiscos:    [{ id, nome, preco, imagem: imgCarrossel, categoria }],
}
```

Preços dos mocks: R$ 32,90 | R$ 36,50 | R$ 28,00 | R$ 41,00 (em reais, não centavos)

**Usado em:** `LojaCategoria.jsx` (fallback de itens)

---

### `getCategoria(slug)` e `getProdutos(slug)`
Helpers para buscar categoria ou produtos pelo slug.

---

## Como o Fallback Funciona nas Páginas

| Página | Estratégia |
|--------|-----------|
| `LojaHome` | Inicializa com `RESTAURANTES_MOCK`, timeout 2s, atualiza se API responder |
| `LojaRestaurante` | Inicializa com `CATEGORIAS` + restaurante do mock, timeout 2s |
| `LojaCategoria` | Inicializa com array vazio, fallback para `MOCK_ITENS` no catch |
| `RestauranteCardapio` | Sem fallback → lista vazia se API offline |

---

## ⚠️ Limitação Importante

O mock só cobre operações de **leitura (GET)**.
**Operações de escrita (POST/PUT)** como criar categoria ou item **não têm mock**.
Quando o backend não está rodando e `DEV_BYPASS=true`, essas operações falham com erro.

**Solução futura:** implementar `localStorage` como "banco de dados local" para operações
de escrita em modo dev, interceptando chamadas quando `VITE_DEV_BYPASS=true`.
