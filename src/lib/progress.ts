export type SaveData = {
  discovered: number[]
  bestScore: number
  bestStreak: number
  rounds: number
  perfectRounds: number
}

export const SAVE_KEY = 'elementar-v1'

export function emptySave(): SaveData {
  return { discovered: [], bestScore: 0, bestStreak: 0, rounds: 0, perfectRounds: 0 }
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function sanitizeSave(value: unknown): SaveData {
  if (!value || typeof value !== 'object') return emptySave()
  const raw = value as Partial<SaveData>
  const discovered = Array.isArray(raw.discovered)
    ? [...new Set(raw.discovered.filter((item) => Number.isInteger(item) && item >= 1 && item <= 118))]
    : []
  return {
    discovered,
    bestScore: asNumber(raw.bestScore),
    bestStreak: asNumber(raw.bestStreak),
    rounds: asNumber(raw.rounds),
    perfectRounds: asNumber(raw.perfectRounds),
  }
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

function browserStore(): Store | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

export function loadSave(storage: Store | null = browserStore()): SaveData {
  if (!storage) return emptySave()
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return emptySave()
    return sanitizeSave(JSON.parse(raw))
  } catch {
    return emptySave()
  }
}

export function writeSave(data: SaveData, storage: Store | null = browserStore()): void {
  if (!storage) return
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    /* O modo privado do navegador pode recusar a escrita. O progresso fica só nesta visita. */
  }
}
