import imgCarrossel from '@assets/images/imagemCarrossel.png';
import fotoCapa from '@assets/images/fotoCapa.png';

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
    descricao:
      'Pão a sua escolha, blend da casa 180g, cheddar cremoso e cebola',
  },
  {
    slug: 'tradicionais',
    titulo: 'Tradicionais',
    destaque: 'Nelore Cheddar',
    descricao:
      'Pão a sua escolha, blend da casa 180g, cheddar cremoso e cebola',
  },
  {
    slug: 'batatas',
    titulo: 'Batatas',
    destaque: 'Nelore Cheddar',
    descricao:
      'Pão a sua escolha, blend da casa 180g, cheddar cremoso e cebola',
  },
  {
    slug: 'petiscos',
    titulo: 'Petiscos',
    destaque: 'Nelore Cheddar',
    descricao:
      'Pão a sua escolha, blend da casa 180g, cheddar cremoso e cebola',
  },
];

const precosBase = [32.9, 36.5, 28.0, 41.0];

function itemsForSlug(slug, label) {
  return [1, 2, 3, 4].map((n, i) => ({
    id: `${slug}-${n}`,
    nome: `${label} ${n}`,
    preco: precosBase[i % precosBase.length],
    imagem: imgCarrossel,
    categoria: slug,
  }));
}

export const PRODUTOS_POR_CATEGORIA = {
  artesanais: itemsForSlug('artesanais', 'Burger artesanal'),
  tradicionais: itemsForSlug('tradicionais', 'Burger tradicional'),
  batatas: itemsForSlug('batatas', 'Batata especial'),
  petiscos: itemsForSlug('petiscos', 'Petisco'),
};

export function getCategoria(slug) {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function getProdutos(slug) {
  return PRODUTOS_POR_CATEGORIA[slug] || [];
}
