import type { CategoryId, Element } from '../data/types.ts'
import type { SaveData } from './progress.ts'

export type Badge = {
  id: string
  title: string
  detail: string
  earned: boolean
}

function allOf(elements: readonly Element[], have: ReadonlySet<number>, category: CategoryId): boolean {
  const group = elements.filter((element) => element.category === category)
  return group.length > 0 && group.every((element) => have.has(element.z))
}

export function badgesFor(save: SaveData, elements: readonly Element[]): Badge[] {
  const have = new Set(save.discovered)
  const count = have.size
  return [
    { id: 'primeiro', title: 'Primeiro passo', detail: 'Abre a ficha de um elemento.', earned: count >= 1 },
    { id: 'dez', title: 'Dez descobertas', detail: 'Descobre 10 elementos.', earned: count >= 10 },
    { id: 'metade', title: 'Meia tabela', detail: 'Descobre 59 elementos.', earned: count >= 59 },
    { id: 'completa', title: 'Tabela completa', detail: 'Descobre os 118 elementos.', earned: count >= 118 },
    {
      id: 'alcalinos',
      title: 'Família alcalina',
      detail: 'Descobre todos os metais alcalinos.',
      earned: allOf(elements, have, 'alkali'),
    },
    {
      id: 'nobres',
      title: 'Gases nobres',
      detail: 'Descobre todos os gases nobres.',
      earned: allOf(elements, have, 'noble'),
    },
    {
      id: 'halogeneos',
      title: 'Halogéneos',
      detail: 'Descobre todos os halogéneos.',
      earned: allOf(elements, have, 'halogen'),
    },
    {
      id: 'sequencia',
      title: 'Sequência de 5',
      detail: 'Acerta 5 respostas de seguida num desafio.',
      earned: save.bestStreak >= 5,
    },
    {
      id: 'perfeito',
      title: 'Desafio perfeito',
      detail: 'Acerta uma ronda inteira.',
      earned: save.perfectRounds >= 1,
    },
    {
      id: 'pontos',
      title: '500 pontos',
      detail: 'Chega aos 500 pontos numa ronda.',
      earned: save.bestScore >= 500,
    },
  ]
}
