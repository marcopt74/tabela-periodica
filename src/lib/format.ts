import type { Element } from '../data/types.ts'

export function formatMass(element: Element): string {
  if (element.massIsotope) return `[${element.mass}]`
  const rounded = Math.round(element.mass * 1000) / 1000
  return rounded.toLocaleString('pt-PT', { maximumFractionDigits: 3 })
}

export function formatTemp(celsius: number): string {
  const rounded = Math.round(celsius)
  const text = rounded.toLocaleString('pt-PT')
  return `${text.replace('-', '−')} °C`
}

export function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function matchesQuery(element: Pick<Element, 'name' | 'symbol' | 'z'>, query: string): boolean {
  const q = fold(query.trim())
  if (!q) return true
  if (String(element.z) === q) return true
  if (fold(element.symbol) === q) return true
  return fold(element.name).includes(q) || fold(element.symbol).includes(q)
}

export function neutronCount(element: Element): number {
  return Math.max(0, Math.round(element.mass) - element.z)
}

export function neutronPhrase(element: Element): string {
  const count = neutronCount(element)
  const word = count === 0 ? 'nenhum neutrão' : count === 1 ? '1 neutrão' : `${count} neutrões`
  const almostInteger = Math.abs(element.mass - Math.round(element.mass)) < 0.05
  if (element.massIsotope || almostInteger || count === 0) return word
  return `cerca de ${word}`
}

export function yearLabel(element: Element): string {
  return element.year == null ? 'Antiguidade' : String(element.year)
}

export function groupLabel(element: Element): string {
  if (element.group == null) {
    return element.category === 'lanthanide'
      ? 'Série dos lantanídeos'
      : 'Série dos actinídeos'
  }
  return `Grupo ${element.group}`
}

export function blockLabel(element: Element): string {
  return `Bloco ${element.block}`
}
