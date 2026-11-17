import { describe, expect, it } from 'vitest'
import { CATEGORY_MAP, INK, PHASE_COLORS } from './categories.ts'
import { elements } from './elements.ts'
import { formatMass, matchesQuery } from '../lib/format.ts'
import { stateAt } from '../lib/matter.ts'

function contrast(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const channels = hex
      .slice(1)
      .match(/../g)!
      .map((part) => {
        const value = parseInt(part, 16) / 255
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
      })
    return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  }
  const lighter = Math.max(lum(hexA), lum(hexB))
  const darker = Math.min(lum(hexA), lum(hexB))
  return (lighter + 0.05) / (darker + 0.05)
}

const bySymbol = (symbol: string) => {
  const element = elements.find((item) => item.symbol === symbol)
  if (!element) throw new Error(symbol)
  return element
}

describe('integridade dos 118 elementos', () => {
  it('tem os números de 1 a 118, sem repetições', () => {
    expect(elements).toHaveLength(118)
    expect(new Set(elements.map((element) => element.z)).size).toBe(118)
    expect(elements.map((element) => element.z).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 118 }, (_, index) => index + 1),
    )
  })

  it('tem símbolos únicos e as posições da tabela não se sobrepõem', () => {
    expect(new Set(elements.map((element) => element.symbol)).size).toBe(118)
    const cells = elements.map((element) => `${element.col},${element.row}`)
    expect(new Set(cells).size).toBe(118)
    for (const element of elements) {
      expect(element.col).toBeGreaterThanOrEqual(1)
      expect(element.col).toBeLessThanOrEqual(18)
      expect([1, 2, 3, 4, 5, 6, 7, 9, 10]).toContain(element.row)
    }
  })

  it('segue a disposição clássica, com lantanídeos e actinídeos por baixo', () => {
    expect(bySymbol('H')).toMatchObject({ col: 1, row: 1, period: 1, group: 1 })
    expect(bySymbol('He')).toMatchObject({ col: 18, row: 1, group: 18 })
    expect(bySymbol('B')).toMatchObject({ col: 13, row: 2 })
    expect(bySymbol('Fe')).toMatchObject({ col: 8, row: 4, group: 8 })
    expect(bySymbol('Ba')).toMatchObject({ col: 2, row: 6 })
    expect(bySymbol('Hf')).toMatchObject({ col: 4, row: 6 })
    expect(bySymbol('La')).toMatchObject({ col: 3, row: 9, period: 6, group: null })
    expect(bySymbol('Lu')).toMatchObject({ col: 17, row: 9 })
    expect(bySymbol('Ac')).toMatchObject({ col: 3, row: 10, period: 7, group: null })
    expect(bySymbol('Lr')).toMatchObject({ col: 17, row: 10 })
    expect(elements.filter((element) => element.period === 6)).toHaveLength(32)
    expect(elements.filter((element) => element.period === 7)).toHaveLength(32)
    expect(elements.filter((element) => element.row === 9).map((element) => element.col)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 3),
    )
  })

  it('soma os eletrões de cada camada ao número atómico', () => {
    for (const element of elements) {
      expect(element.shells.reduce((sum, count) => sum + count, 0)).toBe(element.z)
      expect(element.shells.every((count) => count > 0)).toBe(true)
    }
    expect(bySymbol('Cr').shells).toEqual([2, 8, 13, 1])
    expect(bySymbol('Cu').shells).toEqual([2, 8, 18, 1])
    expect(bySymbol('Pd').shells).toEqual([2, 8, 18, 18])
  })

  it('usa massas positivas e marca o isótopo quando não há massa padrão', () => {
    for (const element of elements) {
      expect(element.mass).toBeGreaterThan(0)
    }
    expect(bySymbol('H').mass).toBeCloseTo(1.008, 3)
    expect(bySymbol('C').mass).toBeCloseTo(12.011, 3)
    expect(bySymbol('Na').mass).toBeCloseTo(22.99, 2)
    expect(bySymbol('Fe').mass).toBeCloseTo(55.845, 3)
    expect(bySymbol('Cl').mass).toBeCloseTo(35.45, 2)
    expect(bySymbol('Tc').massIsotope).toBe(true)
    expect(bySymbol('Pm').massIsotope).toBe(true)
    expect(bySymbol('U').massIsotope).toBe(false)
    expect(formatMass(bySymbol('H'))).toBe('1,008')
    expect(formatMass(bySymbol('Tc'))).toBe('[98]')
  })

  it('acerta o estado à temperatura da sala e ao longo do termómetro', () => {
    expect(stateAt(bySymbol('Hg'), 20)).toBe('liquid')
    expect(stateAt(bySymbol('Br'), 20)).toBe('liquid')
    expect(stateAt(bySymbol('Fe'), 20)).toBe('solid')
    expect(stateAt(bySymbol('Fe'), 1600)).toBe('liquid')
    expect(stateAt(bySymbol('Fe'), 3000)).toBe('gas')
    expect(stateAt(bySymbol('N'), 20)).toBe('gas')
    expect(stateAt(bySymbol('N'), -200)).toBe('liquid')
    expect(stateAt(bySymbol('Ga'), 20)).toBe('solid')
    expect(stateAt(bySymbol('Ga'), 35)).toBe('liquid')
    expect(stateAt(bySymbol('He'), 20)).toBe('gas')
    expect(stateAt(bySymbol('He'), -270)).toBe('liquid')
    expect(stateAt(bySymbol('C'), 20)).toBe('solid')
    expect(stateAt(bySymbol('C'), 4000)).toBe('gas')
    expect(stateAt(bySymbol('Db'), 20)).toBe('unknown')
    expect(stateAt(bySymbol('P'), 20)).toBe('solid')
    expect(stateAt(bySymbol('P'), 50)).toBe('liquid')
  })
})

describe('nomes em português europeu', () => {
  it('usa os nomes da escola em Portugal', () => {
    expect(bySymbol('H').name).toBe('Hidrogénio')
    expect(bySymbol('N').name).toBe('Azoto')
    expect(bySymbol('O').name).toBe('Oxigénio')
    expect(bySymbol('Na').name).toBe('Sódio')
    expect(bySymbol('K').name).toBe('Potássio')
    expect(bySymbol('Cr').name).toBe('Crómio')
    expect(bySymbol('Ar').name).toBe('Árgon')
    expect(bySymbol('W').name).toBe('Tungsténio')
    expect(bySymbol('Rn').name).toBe('Radão')
    expect(bySymbol('Se').name).toBe('Selénio')
    expect(bySymbol('Sb').name).toBe('Antimónio')
    expect(bySymbol('Xe').name).toBe('Xénon')
    expect(bySymbol('Pu').name).toBe('Plutónio')
    expect(bySymbol('Og').name).toBe('Oganésson')
    expect(bySymbol('Ts').name).toBe('Tenesso')
    expect(bySymbol('Nh').name).toBe('Nihónio')
    expect(bySymbol('Mo').name).toBe('Molibdénio')
    expect(bySymbol('F').category).toBe('halogen')
    expect(bySymbol('Al').category).toBe('post')
    expect(bySymbol('Og').category).toBe('noble')
    expect(bySymbol('U').category).toBe('actinide')
    expect(bySymbol('La').category).toBe('lanthanide')
  })

  it('não usa grafias do português do Brasil nem trata o leitor por você', () => {
    for (const element of elements) {
      expect(element.name).not.toMatch(/gênio|ônio/)
      expect(element.name).not.toMatch(/Nitrogénio|Nitrogênio|Hidrogênio|Oxigênio/)
      const text = `${element.fact} ${element.uses}`
      expect(text.length).toBeGreaterThan(40)
      expect(text).not.toMatch(/você|ônibus|celular|geladeira|nitrogênio|hidrogênio|oxigênio|tela\b/)
      expect(element.year === null || (element.year >= 1250 && element.year <= 2016)).toBe(true)
    }
    expect(new Set(elements.map((element) => element.name)).size).toBe(118)
  })

  it('encontra elementos mesmo sem acentos', () => {
    expect(matchesQuery(bySymbol('O'), 'oxigenio')).toBe(true)
    expect(matchesQuery(bySymbol('Na'), 'sodio')).toBe(true)
    expect(matchesQuery(bySymbol('Fe'), 'fe')).toBe(true)
    expect(matchesQuery(bySymbol('O'), '8')).toBe(true)
    expect(matchesQuery(bySymbol('H'), '18')).toBe(false)
  })
})

describe('contraste das cores', () => {
  it('mantém o texto escuro legível em cada categoria e em cada estado', () => {
    for (const category of Object.values(CATEGORY_MAP)) {
      expect(contrast(category.color, INK)).toBeGreaterThanOrEqual(4.5)
    }
    for (const color of Object.values(PHASE_COLORS)) {
      expect(contrast(color, INK)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
