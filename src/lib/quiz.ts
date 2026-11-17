import type { Element, QuizMode } from '../data/types.ts'

export type Rng = () => number

export type Question = {
  mode: QuizMode
  answer: Element
  options: Element[]
}

export const ROUND_SIZE = 8

export type RoundResult = {
  score: number
  bestStreak: number
  correct: number
  total: number
  stars: 0 | 1 | 2 | 3
}

export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const current = copy[i]
    copy[i] = copy[j] as T
    copy[j] = current as T
  }
  return copy
}

export function createQuestion(
  mode: QuizMode,
  pool: readonly Element[],
  rng: Rng,
  avoid: ReadonlySet<number>,
): Question {
  const available = pool.filter((element) => !avoid.has(element.z))
  const source = available.length > 0 ? available : pool
  const answer = source[Math.floor(rng() * source.length)]
  if (!answer) throw new Error('Não há elementos para o desafio')
  if (mode === 'find') return { mode, answer, options: [] }

  const others = pool.filter((element) => element.z !== answer.z)
  const same = shuffle(
    others.filter((element) => element.category === answer.category),
    rng,
  )
  const rest = shuffle(
    others.filter((element) => element.category !== answer.category),
    rng,
  )
  const distractors = [...same, ...rest].slice(0, 3)
  return { mode, answer, options: shuffle([answer, ...distractors], rng) }
}

export function scoreCorrect(streakBefore: number): { points: number; streak: number } {
  return { points: 100 + streakBefore * 20, streak: streakBefore + 1 }
}

export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0 || correct <= 0) return 0
  if (correct >= Math.ceil(total * 0.875)) return 3
  if (correct >= Math.ceil(total * 0.625)) return 2
  return 1
}

export function starsLabel(stars: number): string {
  if (stars === 1) return '1 estrela'
  return `${stars} estrelas`
}

export function questionPrompt(question: Question): string {
  if (question.mode === 'symbol') return `Qual é o símbolo do ${question.answer.name.toLowerCase()}?`
  if (question.mode === 'name') return `Qual é o nome do elemento ${question.answer.symbol}?`
  return `Encontra o ${question.answer.name.toLowerCase()} na tabela.`
}
