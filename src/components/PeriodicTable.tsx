import { useState, type CSSProperties, type KeyboardEvent } from 'react'
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
  highlightCategory?: CategoryId | null
}

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

export function PeriodicTable({ elements, tileStyle, onOpen, onHoverCategory, highlightCategory = null }: Props) {
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
        <div className="series-label" style={{ gridColumn: '1 / 3', gridRow: 9 }} id="serie-lantanideos">
          Lantanídeos
        </div>
        <div className="series-label" style={{ gridColumn: '1 / 3', gridRow: 10 }} id="serie-actinideos">
          Actinídeos
        </div>
        <button
          type="button"
          className={highlightCategory === 'lanthanide' ? 'gap-marker is-match' : 'gap-marker'}
          style={{ gridColumn: 3, gridRow: 6 }}
          aria-label="Ir para a fila dos lantanídeos"
          onClick={() => document.getElementById('serie-lantanideos')?.scrollIntoView({ inline: 'start', block: 'nearest' })}
        >
          <span>57–71</span>
          <small>La–Lu</small>
        </button>
        <button
          type="button"
          className={highlightCategory === 'actinide' ? 'gap-marker is-match' : 'gap-marker'}
          style={{ gridColumn: 3, gridRow: 7 }}
          aria-label="Ir para a fila dos actinídeos"
          onClick={() => document.getElementById('serie-actinideos')?.scrollIntoView({ inline: 'start', block: 'nearest' })}
        >
          <span>89–103</span>
          <small>Ac–Lr</small>
        </button>
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
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ gridColumn: element.col, gridRow: element.row, '--swatch': look.swatch } as CSSProperties}
              tabIndex={element.z === activeZ ? 0 : -1}
              aria-label={`${element.name}, símbolo ${element.symbol}, número ${element.z}, ${category.label}`}
              onFocus={() => {
                setActiveZ(element.z)
                onHoverCategory?.(element.category)
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') onHoverCategory?.(element.category)
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
