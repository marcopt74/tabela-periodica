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

/** Camadas pela ordem de preenchimento (Madelung): 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p. */
function aufbauShells(z: number): number[] {
  const order: Array<[number, number]> = [
    [1, 2], [2, 2], [2, 6], [3, 2], [3, 6], [4, 2], [3, 10], [4, 6], [5, 2], [4, 10], [5, 6],
    [6, 2], [4, 14], [5, 10], [6, 6], [7, 2], [5, 14], [6, 10], [7, 6],
  ]
  const shells: number[] = []
  let left = z
  for (const [n, capacity] of order) {
    if (left <= 0) break
    const put = Math.min(left, capacity)
    shells[n - 1] = (shells[n - 1] ?? 0) + put
    left -= put
  }
  return shells
}

// Elementos cuja configuração real foge à ordem de preenchimento.
const SHELL_EXCEPTIONS: Record<string, number[]> = {
  Cr: [2, 8, 13, 1],
  Cu: [2, 8, 18, 1],
  Nb: [2, 8, 18, 12, 1],
  Mo: [2, 8, 18, 13, 1],
  Ru: [2, 8, 18, 15, 1],
  Rh: [2, 8, 18, 16, 1],
  Pd: [2, 8, 18, 18],
  Ag: [2, 8, 18, 18, 1],
  La: [2, 8, 18, 18, 9, 2],
  Ce: [2, 8, 18, 19, 9, 2],
  Gd: [2, 8, 18, 25, 9, 2],
  Pt: [2, 8, 18, 32, 17, 1],
  Au: [2, 8, 18, 32, 18, 1],
  Ac: [2, 8, 18, 32, 18, 9, 2],
  Th: [2, 8, 18, 32, 18, 10, 2],
  Pa: [2, 8, 18, 32, 20, 9, 2],
  U: [2, 8, 18, 32, 21, 9, 2],
  Np: [2, 8, 18, 32, 22, 9, 2],
  Cm: [2, 8, 18, 32, 25, 9, 2],
  Lr: [2, 8, 18, 32, 32, 8, 3],
}

describe('coerência dos dados físicos', () => {
  it('distribui os eletrões pelas camadas como na realidade', () => {
    for (const element of elements) {
      const expected = SHELL_EXCEPTIONS[element.symbol] ?? aufbauShells(element.z)
      expect(element.shells, element.symbol).toEqual(expected)
    }
  })

  it('põe cada elemento na coluna e na linha do seu grupo e período', () => {
    for (const element of elements) {
      if (element.row === 9 || element.row === 10) {
        expect(element.group, element.symbol).toBeNull()
        expect(element.row, element.symbol).toBe(element.period + 3)
        continue
      }
      expect(element.row, element.symbol).toBe(element.period)
      expect(element.col, element.symbol).toBe(element.group)
    }
    expect(bySymbol('Lu')).toMatchObject({ row: 9, period: 6 })
    expect(bySymbol('Lr')).toMatchObject({ row: 10, period: 7 })
  })

  it('tem o período igual ao número de camadas, exceto o paládio', () => {
    for (const element of elements) {
      // O paládio é o único com a camada de valência vazia: 4 camadas, no período 5.
      const expected = element.symbol === 'Pd' ? 4 : element.period
      expect(element.shells.length, element.symbol).toBe(expected)
    }
  })

  it('tem fusão abaixo da ebulição quando as duas existem', () => {
    for (const element of elements) {
      if (element.meltC != null && element.boilC != null) {
        expect(element.meltC, element.symbol).toBeLessThan(element.boilC)
      }
    }
  })

  it('marca como isótopo exatamente os elementos sem massa padrão', () => {
    const withStandardWeight = new Set([
      ...elements.filter((element) => element.z <= 82 && !['Tc', 'Pm'].includes(element.symbol)).map((e) => e.symbol),
      'Bi', 'Th', 'Pa', 'U',
    ])
    for (const element of elements) {
      expect(element.massIsotope, element.symbol).toBe(!withStandardWeight.has(element.symbol))
    }
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
