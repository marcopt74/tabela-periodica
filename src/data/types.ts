export type CategoryId =
  | 'alkali'
  | 'alkaline'
  | 'transition'
  | 'post'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble'
  | 'lanthanide'
  | 'actinide'

export type Block = 's' | 'p' | 'd' | 'f'

export type Phase = 'solid' | 'liquid' | 'gas' | 'unknown'

export type Physical = {
  z: number
  symbol: string
  mass: number
  massIsotope: boolean
  group: number | null
  period: number
  block: Block
  col: number
  row: number
  meltC: number | null
  boilC: number | null
  sublimes: boolean
  tempsEstimated: boolean
  shells: number[]
}

export type ElementCopy = {
  name: string
  year: number | null
  fact: string
  uses: string
}

export type Element = Physical &
  ElementCopy & {
    category: CategoryId
  }

export type QuizMode = 'symbol' | 'name' | 'find'
