import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import type { CategoryId, Element } from '../data/types.ts'
import { CATEGORY_MAP } from '../data/categories.ts'

export type TileLook = {
  swatch: string
  estimated: boolean
  dim: boolean
  match: boolean
  pulse: boolean
  shake: boolean
}

type Props = {
  elements: readonly Element[]
  tileStyle: (element: Element) => TileLook
  onOpen: (z: number) => void
  onHoverCategory?: (category: CategoryId | null) => void
  /** Chamado quando um elemento recebe o rato ou o foco; alimenta o painel de pré-visualização. */
  onPeek?: (element: Element) => void
  highlightCategory?: CategoryId | null
  /** Painel colocado no espaço vazio por cima dos metais de transição. */
  peek?: ReactNode
  /** Elementos já descobertos: ganham um marcador discreto no canto. */
  seen?: ReadonlySet<number>
  /** Desliga a entrada animada (usado quando a tabela se volta a desenhar a meio de um jogo). */
  animate?: boolean
  /** Grupo e período activos, para destacar e permitir filtrar clicando nos cabeçalhos. */
  selectedGroup?: number | null
  selectedPeriod?: number | null
  onSelectGroup?: (group: number | null) => void
  onSelectPeriod?: (period: number | null) => void
}

const GROUPS = Array.from({ length: 18 }, (_, index) => index + 1)
const PERIODS = [1, 2, 3, 4, 5, 6, 7] as const

function neighbor(from: Element, stepCol: number, stepRow: number, list: readonly Element[]): Element | null {
  const lookup = new Map(list.map((element) => [`${element.col},${element.row}`, element]))
  let col = from.col + stepCol
  let row = from.row + stepRow
  while (col >= 1 && col <= 18 && row >= 1 && row <= 10) {
    const found = lookup.get(`${col},${row}`)
    if (found) return found
    col += stepCol
    row += stepRow
  }
  return null
}

export function PeriodicTable({
  elements,
  tileStyle,
  onOpen,
  onHoverCategory,
  onPeek,
  highlightCategory = null,
  peek,
  seen,
  animate = true,
  selectedGroup = null,
  selectedPeriod = null,
  onSelectGroup,
  onSelectPeriod,
}: Props) {
  const [activeZ, setActiveZ] = useState(1)
  const ordered = elements.slice().sort((a, b) => a.row - b.row || a.col - b.col)

  function focusElement(element: Element) {
    setActiveZ(element.z)
    document.getElementById(`el-${element.z}`)?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = elements.find((element) => element.z === activeZ) ?? ordered[0]
    if (!current) return
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }
    if (event.key === 'Home') {
      event.preventDefault()
      const first = ordered[0]
      if (first) focusElement(first)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      const last = ordered[ordered.length - 1]
      if (last) focusElement(last)
      return
    }
    const step = steps[event.key]
    if (!step) return
    const next = neighbor(current, step[0], step[1], elements)
    if (!next) return
    event.preventDefault()
    focusElement(next)
  }

  return (
    <div className="table-scroll">
      <div className="ptable" role="group" aria-label="Tabela periódica dos 118 elementos" onKeyDown={onKeyDown}>
        <div className="axis-corner" aria-hidden="true" style={{ gridColumn: 1, gridRow: 1 }} />
        {GROUPS.map((g) =>
          onSelectGroup ? (
            <button
              key={`g-${g}`}
              type="button"
              className={selectedGroup === g ? 'axis-label is-active' : 'axis-label'}
              style={{ gridColumn: g + 1, gridRow: 1 }}
              aria-label={`Filtrar pelo grupo ${g}`}
              aria-pressed={selectedGroup === g}
              title={`Grupo ${g}`}
              onClick={() => onSelectGroup(selectedGroup === g ? null : g)}
            >
              {g}
            </button>
          ) : (
            <div key={`g-${g}`} className="axis-label is-static" style={{ gridColumn: g + 1, gridRow: 1 }} aria-hidden="true">
              {g}
            </div>
          ),
        )}
        {PERIODS.map((p) =>
          onSelectPeriod ? (
            <button
              key={`p-${p}`}
              type="button"
              className={selectedPeriod === p ? 'axis-label is-active' : 'axis-label'}
              style={{ gridColumn: 1, gridRow: p + 1 }}
              aria-label={`Filtrar pelo período ${p}`}
              aria-pressed={selectedPeriod === p}
              title={`Período ${p}`}
              onClick={() => onSelectPeriod(selectedPeriod === p ? null : p)}
            >
              {p}
            </button>
          ) : (
            <div key={`p-${p}`} className="axis-label is-static" style={{ gridColumn: 1, gridRow: p + 1 }} aria-hidden="true">
              {p}
            </div>
          ),
        )}
        <div className="series-label" style={{ gridColumn: '1 / 4', gridRow: 10 }} id="serie-lantanideos">
          <span>Lantanídeos</span>
        </div>
        <div className="series-label" style={{ gridColumn: '1 / 4', gridRow: 11 }} id="serie-actinideos">
          <span>Actinídeos</span>
        </div>
        <button
          type="button"
          className={highlightCategory === 'lanthanide' ? 'gap-marker is-match' : 'gap-marker'}
          style={{ gridColumn: 4, gridRow: 7 }}
          aria-label="Ir para a fila dos lantanídeos"
          onClick={() => document.getElementById('el-57')?.focus()}
        >
          <span>57–71</span>
          <small>La–Lu</small>
        </button>
        <button
          type="button"
          className={highlightCategory === 'actinide' ? 'gap-marker is-match' : 'gap-marker'}
          style={{ gridColumn: 4, gridRow: 8 }}
          aria-label="Ir para a fila dos actinídeos"
          onClick={() => document.getElementById('el-89')?.focus()}
        >
          <span>89–103</span>
          <small>Ac–Lr</small>
        </button>
        {peek}
        {elements.map((element) => {
          const look = tileStyle(element)
          const category = CATEGORY_MAP[element.category]
          return (
            <button
              key={element.z}
              id={`el-${element.z}`}
              type="button"
              className={[
                'tile',
                look.dim ? 'is-dim' : '',
                look.match ? 'is-match' : '',
                look.estimated ? 'is-estimated' : '',
                look.pulse ? 'is-pulse' : '',
                look.shake ? 'is-shake' : '',
                seen?.has(element.z) ? 'is-seen' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                {
                  gridColumn: element.col + 1,
                  gridRow: element.row + 1,
                  '--swatch': look.swatch,
                  '--c': element.col,
                  '--r': element.row,
                  ...(animate ? {} : { animation: 'none' }),
                } as CSSProperties
              }
              tabIndex={element.z === activeZ ? 0 : -1}
              aria-label={`${element.name}, símbolo ${element.symbol}, número ${element.z}, ${category.label}`}
              onFocus={() => {
                setActiveZ(element.z)
                onHoverCategory?.(element.category)
                onPeek?.(element)
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') {
                  onHoverCategory?.(element.category)
                  onPeek?.(element)
                }
              }}
              onClick={() => {
                setActiveZ(element.z)
                onOpen(element.z)
              }}
            >
              <span className="z">{element.z}</span>
              <span className="sym">{element.symbol}</span>
              <span className="ename">{element.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
