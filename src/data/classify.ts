import type { CategoryId } from './types.ts'

const HALOGENS = new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts'])
const NOBLES = new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og'])
const NONMETALS = new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se'])
const METALLOIDS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te'])

export function categoryFor(z: number, symbol: string, group: number | null): CategoryId {
  if (z >= 57 && z <= 71) return 'lanthanide'
  if (z >= 89 && z <= 103) return 'actinide'
  if (HALOGENS.has(symbol)) return 'halogen'
  if (NOBLES.has(symbol)) return 'noble'
  if (NONMETALS.has(symbol)) return 'nonmetal'
  if (METALLOIDS.has(symbol)) return 'metalloid'
  if (group === 1) return 'alkali'
  if (group === 2) return 'alkaline'
  if (group != null && group >= 3 && group <= 12) return 'transition'
  return 'post'
}
