import type { CategoryId, Phase } from './types.ts'

export type CategoryMeta = {
  id: CategoryId
  label: string
  hint: string
  color: string
}

export const INK = '#1c140f'

export const CATEGORY_ORDER: CategoryMeta[] = [
  {
    id: 'alkali',
    label: 'Metais alcalinos',
    hint: 'Grupo 1, sem o hidrogénio. Moles e muito reativos.',
    color: '#ff8d7a',
  },
  {
    id: 'alkaline',
    label: 'Metais alcalino-terrosos',
    hint: 'Grupo 2. Reativos, mas mais calmos do que os alcalinos.',
    color: '#ffbf3c',
  },
  {
    id: 'transition',
    label: 'Metais de transição',
    hint: 'O bloco do meio: ferro, cobre, ouro e muitos outros.',
    color: '#3ecfb8',
  },
  {
    id: 'post',
    label: 'Outros metais',
    hint: 'Como o alumínio, o estanho e o chumbo.',
    color: '#5eb0f0',
  },
  {
    id: 'metalloid',
    label: 'Semimetais',
    hint: 'A meio caminho entre metais e não-metais.',
    color: '#b09af5',
  },
  {
    id: 'nonmetal',
    label: 'Não-metais',
    hint: 'Inclui o hidrogénio, o carbono, o azoto e o oxigénio.',
    color: '#4dcc86',
  },
  {
    id: 'halogen',
    label: 'Halogéneos',
    hint: 'Grupo 17. Com os metais, formam sais.',
    color: '#f27aaa',
  },
  {
    id: 'noble',
    label: 'Gases nobres',
    hint: 'Grupo 18. Quase não reagem com ninguém.',
    color: '#a4a8f7',
  },
  {
    id: 'lanthanide',
    label: 'Lantanídeos',
    hint: 'A primeira fila de baixo. Muitos fazem ímanes fortes.',
    color: '#f28cbc',
  },
  {
    id: 'actinide',
    label: 'Actinídeos',
    hint: 'A segunda fila de baixo. São radioativos.',
    color: '#f5a35a',
  },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORY_ORDER.map((category) => [category.id, category]),
) as Record<CategoryId, CategoryMeta>

export const PHASE_COLORS: Record<Phase, string> = {
  solid: '#c5d0e4',
  liquid: '#7ed4e8',
  gas: '#f2c14e',
  unknown: '#e4e0d8',
}

export const PHASE_LABEL: Record<Phase, string> = {
  solid: 'Sólido',
  liquid: 'Líquido',
  gas: 'Gás',
  unknown: 'Desconhecido',
}
