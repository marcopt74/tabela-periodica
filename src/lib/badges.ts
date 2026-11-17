import type { CategoryId, Element } from '../data/types.ts'
import type { SaveData } from './progress.ts'

export type BadgeGlyph = 'flag' | 'ten' | 'half' | 'grid' | 'family' | 'bolt' | 'star' | 'points'

export type Badge = {
  id: string
  title: string
  detail: string
  earned: boolean
  /** Progresso actual e meta, para a barra de cada medalha. */
  value: number
  goal: number
  glyph: BadgeGlyph
  /** Cor da família, nas medalhas de famílias. */
  family?: CategoryId
}

function familyProgress(elements: readonly Element[], have: ReadonlySet<number>, category: CategoryId) {
  const group = elements.filter((element) => element.category === category)
  return { value: group.filter((element) => have.has(element.z)).length, goal: group.length }
}

function badge(
  base: Omit<Badge, 'earned' | 'value' | 'goal'>,
  value: number,
  goal: number,
): Badge {
  return { ...base, value, goal, earned: goal > 0 && value >= goal }
}

export function badgesFor(save: SaveData, elements: readonly Element[]): Badge[] {
  const have = new Set(save.discovered)
  const count = have.size
  const alkali = familyProgress(elements, have, 'alkali')
  const noble = familyProgress(elements, have, 'noble')
  const halogen = familyProgress(elements, have, 'halogen')
  return [
    badge({ id: 'primeiro', title: 'Primeiro passo', detail: 'Abre a ficha de um elemento.', glyph: 'flag' }, count, 1),
    badge({ id: 'dez', title: 'Dez descobertas', detail: 'Descobre 10 elementos.', glyph: 'ten' }, count, 10),
    badge({ id: 'metade', title: 'Meia tabela', detail: 'Descobre 59 elementos.', glyph: 'half' }, count, 59),
    badge({ id: 'completa', title: 'Tabela completa', detail: 'Descobre os 118 elementos.', glyph: 'grid' }, count, 118),
    badge(
      { id: 'alcalinos', title: 'Família alcalina', detail: 'Descobre todos os metais alcalinos.', glyph: 'family', family: 'alkali' },
      alkali.value,
      alkali.goal,
    ),
    badge(
      { id: 'nobres', title: 'Gases nobres', detail: 'Descobre todos os gases nobres.', glyph: 'family', family: 'noble' },
      noble.value,
      noble.goal,
    ),
    badge(
      { id: 'halogeneos', title: 'Halogéneos', detail: 'Descobre todos os halogéneos.', glyph: 'family', family: 'halogen' },
      halogen.value,
      halogen.goal,
    ),
    badge(
      { id: 'sequencia', title: 'Sequência de 5', detail: 'Acerta 5 respostas de seguida num desafio.', glyph: 'bolt' },
      save.bestStreak,
      5,
    ),
    badge({ id: 'perfeito', title: 'Desafio perfeito', detail: 'Acerta uma ronda inteira.', glyph: 'star' }, save.perfectRounds, 1),
    badge({ id: 'pontos', title: '500 pontos', detail: 'Chega aos 500 pontos numa ronda.', glyph: 'points' }, save.bestScore, 500),
  ]
}
