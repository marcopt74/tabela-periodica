import { describe, expect, it } from 'vitest'
import { elements } from '../data/elements.ts'
import { badgesFor } from './badges.ts'
import { emptySave, sanitizeSave } from './progress.ts'
import { createQuestion, mulberry32, scoreCorrect, starsFor } from './quiz.ts'

describe('lógica do desafio', () => {
  it('mete a resposta certa entre quatro opções únicas', () => {
    const rng = mulberry32(7)
    const used = new Set<number>()
    for (let index = 0; index < 8; index += 1) {
      const question = createQuestion(index % 2 === 0 ? 'symbol' : 'name', elements, rng, used)
      used.add(question.answer.z)
      expect(question.options).toHaveLength(4)
      expect(new Set(question.options.map((element) => element.z)).size).toBe(4)
      expect(question.options.some((element) => element.z === question.answer.z)).toBe(true)
      expect(question.options.filter((element) => element.category === question.answer.category).length).toBeGreaterThanOrEqual(3)
    }
    expect(used.size).toBe(8)
  })

  it('na caça ao elemento não mostra opções e não repete o que já saiu', () => {
    const rng = mulberry32(3)
    const first = createQuestion('find', elements, rng, new Set())
    const second = createQuestion('find', elements, rng, new Set([first.answer.z]))
    expect(first.options).toEqual([])
    expect(second.answer.z).not.toBe(first.answer.z)
  })

  it('é estável com a mesma semente', () => {
    const left = createQuestion('symbol', elements, mulberry32(42), new Set())
    const right = createQuestion('symbol', elements, mulberry32(42), new Set())
    expect(left.answer.symbol).toBe(right.answer.symbol)
    expect(left.options.map((element) => element.symbol)).toEqual(right.options.map((element) => element.symbol))
  })

  it('soma pontos, sequência e estrelas', () => {
    expect(scoreCorrect(0)).toEqual({ points: 100, streak: 1 })
    expect(scoreCorrect(3)).toEqual({ points: 160, streak: 4 })
    expect(starsFor(0, 8)).toBe(0)
    expect(starsFor(4, 8)).toBe(1)
    expect(starsFor(5, 8)).toBe(2)
    expect(starsFor(6, 8)).toBe(2)
    expect(starsFor(7, 8)).toBe(3)
    expect(starsFor(8, 8)).toBe(3)
  })
})

describe('progresso e medalhas', () => {
  it('ignora gravações estragadas e números fora da tabela', () => {
    expect(sanitizeSave(null)).toEqual(emptySave())
    expect(sanitizeSave({ discovered: [1, 1, 0, 119, 8, 'Fe'], bestScore: 80, rounds: 2 })).toEqual({
      discovered: [1, 8],
      bestScore: 80,
      bestStreak: 0,
      rounds: 2,
      perfectRounds: 0,
    })
  })

  it('dá a medalha da família só quando ela está completa', () => {
    const alkali = elements.filter((element) => element.category === 'alkali').map((element) => element.z)
    const almost = badgesFor({ ...emptySave(), discovered: alkali.slice(1) }, elements)
    const full = badgesFor({ ...emptySave(), discovered: alkali, bestStreak: 5, bestScore: 500, perfectRounds: 1 }, elements)
    expect(almost.find((badge) => badge.id === 'alcalinos')?.earned).toBe(false)
    expect(full.find((badge) => badge.id === 'alcalinos')?.earned).toBe(true)
    expect(full.find((badge) => badge.id === 'sequencia')?.earned).toBe(true)
    expect(full.find((badge) => badge.id === 'perfeito')?.earned).toBe(true)
    expect(full.find((badge) => badge.id === 'pontos')?.earned).toBe(true)
    expect(full.find((badge) => badge.id === 'completa')?.earned).toBe(false)
  })
})
