import imgCarrossel from '@assets/images/imagemCarrossel.png';
import fotoCapa from '@assets/images/fotoCapa.png';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGENS DAS CATEGORIAS NB
// Quando adicionar os arquivos abaixo, descomente as duas linhas de import:
//
//   Arquivo 1 → src/assets/images/batataNB.png
//               (recorte ESQUERDO da imagem enviada — batatas fritas com logo NB)
//
//   Arquivo 2 → src/assets/images/hamburguerNB.png
//               (recorte DIREITO da imagem enviada — hamburguer artesanal)
//
// import batataNB     from '@assets/images/batataNB.png';
// import hamburguerNB from '@assets/images/hamburguerNB.png';
//
// Depois troque as referências abaixo de imgCarrossel para batataNB / hamburguerNB
// ─────────────────────────────────────────────────────────────────────────────
const batataNB     = imgCarrossel; // ← trocar para batataNB após adicionar o arquivo
const hamburguerNB = imgCarrossel; // ← trocar para hamburguerNB após adicionar o arquivo

/** Restaurantes de demonstração — substitui quando ms-restaurantes estiver pronto */
export const RESTAURANTES_MOCK = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nome: 'Nelore Burguer',
    tipo: 'Hambúrgueres Artesanais',
    status: 'ABERTO',
    taxaEntrega: 500,
    tempoEstimado: '30–45 min',
    avaliacao: 4.8,
    imagem: fotoCapa,
  },
];

/** Cardápio de demonstração (até o Gateway estar ligado ao GET /api/restaurantes). */
export const CATEGORIAS = [
  {
    slug: 'artesanais',
    titulo: 'Artesanais',
    destaque: 'Nelore Cheddar',
    descricao: 'Pão a sua escolha, blend da casa 180g, cheddar cremoso e cebola',
    imagem: hamburguerNB,
  },
  {
    slug: 'tradicionais',
    titulo: 'Tradicionais',
    destaque: 'Nelore Classic',
    descricao: 'Pão brioche, blend da casa 180g, queijo prato e alface',
    imagem: hamburguerNB,
  },
  {
    slug: 'batatas',
    titulo: 'Batatas',
    destaque: 'Batata NB',
    descricao: 'Batatas rústicas temperadas com ervas da casa',
    imagem: batataNB,
  },
  {
    slug: 'petiscos',
    titulo: 'Petiscos',
    destaque: 'Onion Rings',
    descricao: 'Anéis de cebola empanados com molho especial NB',
    imagem: imgCarrossel,
  },
];

const precosBase = [32.9, 36.5, 28.0, 41.0];

function itemsForSlug(slug, label, imgCategoria) {
  return [1, 2, 3, 4].map((n, i) => ({
    id: `${slug}-${n}`,
    nome: `${label} ${n}`,
    preco: precosBase[i % precosBase.length],
    imagem: imgCategoria,
    categoria: slug,
  }));
}

export const PRODUTOS_POR_CATEGORIA = {
  artesanais:  itemsForSlug('artesanais',  'Burger artesanal',    hamburguerNB),
  tradicionais: itemsForSlug('tradicionais', 'Burger tradicional', hamburguerNB),
  batatas:     itemsForSlug('batatas',     'Batata especial',     batataNB),
  petiscos:    itemsForSlug('petiscos',    'Petisco',             imgCarrossel),
};

export function getCategoria(slug) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function getProdutos(slug) {
  return PRODUTOS_POR_CATEGORIA[slug] || [];
}
