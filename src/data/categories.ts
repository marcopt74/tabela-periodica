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
    color: '#ff8b78',
  },
  {
    id: 'alkaline',
    label: 'Metais alcalino-terrosos',
    hint: 'Grupo 2. Reativos, mas mais calmos do que os alcalinos.',
    color: '#ffc442',
  },
  {
    id: 'transition',
    label: 'Metais de transição',
    hint: 'O bloco do meio: ferro, cobre, ouro e muitos outros.',
    color: '#47d4c0',
  },
  {
    id: 'post',
    label: 'Outros metais',
    hint: 'Como o alumínio, o estanho e o chumbo.',
    color: '#6eb7f7',
  },
  {
    id: 'metalloid',
    label: 'Semimetais',
    hint: 'A meio caminho entre metais e não-metais.',
    color: '#b5de60',
  },
  {
    id: 'nonmetal',
    label: 'Não-metais',
    hint: 'Inclui o hidrogénio, o carbono, o azoto e o oxigénio.',
    color: '#55d68d',
  },
  {
    id: 'halogen',
    label: 'Halogéneos',
    hint: 'Grupo 17. Com os metais, formam sais.',
    color: '#f884b4',
  },
  {
    id: 'noble',
    label: 'Gases nobres',
    hint: 'Grupo 18. Quase não reagem com ninguém.',
    color: '#a8a6fc',
  },
  {
    id: 'lanthanide',
    label: 'Lantanídeos',
    hint: 'A primeira fila de baixo. Muitos fazem ímanes fortes.',
    color: '#e39ae8',
  },
  {
    id: 'actinide',
    label: 'Actinídeos',
    hint: 'A segunda fila de baixo. São radioativos.',
    color: '#f9a85c',
  },
]

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORY_ORDER.map((category) => [category.id, category]),
) as Record<CategoryId, CategoryMeta>

export const PHASE_COLORS: Record<Phase, string> = {
  solid: '#b8cbe8',
  liquid: '#6cd3ec',
  gas: '#f7c954',
  unknown: '#dedad2',
}

export const PHASE_LABEL: Record<Phase, string> = {
  solid: 'Sólido',
  liquid: 'Líquido',
  gas: 'Gás',
  unknown: 'Desconhecido',
}
