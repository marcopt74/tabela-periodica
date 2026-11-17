import { categoryFor } from './classify.ts'
import { CONSTANTS } from './constants.ts'
import { COPY } from './copy.ts'
import type { Element } from './types.ts'

function buildElements(): Element[] {
  const known = new Set(CONSTANTS.map((item) => item.symbol))
  for (const symbol of Object.keys(COPY)) {
    if (!known.has(symbol)) {
      throw new Error(`Texto sem elemento: ${symbol}`)
    }
  }

  return CONSTANTS.map((item) => {
    const copy = COPY[item.symbol]
    if (!copy) throw new Error(`Falta o texto de ${item.symbol}`)
    return {
      ...item,
      ...copy,
      category: categoryFor(item.z, item.symbol, item.group),
    }
  })
}

export const elements: Element[] = buildElements()

export const elementByZ = new Map(elements.map((element) => [element.z, element]))

export function getElement(z: number): Element {
  const element = elementByZ.get(z)
  if (!element) throw new Error(`Elemento ${z} não existe`)
  return element
}
