import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { CATEGORY_MAP } from '../data/categories.ts'
import type { CategoryId, Element } from '../data/types.ts'
import { blockLabel, formatMass, groupLabel, yearLabel } from '../lib/format.ts'
import { roomStateLong, roomStateShort } from '../lib/matter.ts'
import { speakPt, stopSpeech } from '../lib/speech.ts'
import { BohrAtom } from './BohrAtom.tsx'
import { IconClose, IconSpeaker } from './Icons.tsx'

type Props = {
  element: Element
  isNew: boolean
  onClose: () => void
  onShowFamily?: (category: CategoryId) => void
}

export function DetailDialog({ element, isNew, onClose, onShowFamily }: Props) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [speechNote, setSpeechNote] = useState<string | null>(null)
  const category = CATEGORY_MAP[element.category]

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (node) => !node.hasAttribute('disabled'),
      )
    focusable()[0]?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const nodes = focusable()
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      stopSpeech()
      previous?.focus()
    }
  }, [onClose, element.z])

  function hear() {
    const ok = speakPt(element.name)
    setSpeechNote(
      ok
        ? null
        : 'Este navegador não consegue falar. Pede a alguém para ler o nome em voz alta.',
    )
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        style={{ '--swatch': category.color } as CSSProperties}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="close" onClick={onClose} aria-label="Fechar a ficha">
          <IconClose />
        </button>
        <div className="detail-hero">
          <BohrAtom element={element} />
          <div className="intro">
            {isNew ? <p className="ribbon">Nova descoberta</p> : null}
            <p className="eyebrow">{category.label}</p>
            <h2 id={titleId} lang="pt-PT">
              {element.name}
            </h2>
            <p className="symbol-line">
              <span>{element.symbol}</span>
              <span>n.º {element.z}</span>
            </p>
            <button type="button" className="speak" onClick={hear}>
              <IconSpeaker />
              Ouvir o nome
            </button>
            {speechNote ? <p className="speech-note">{speechNote}</p> : null}
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt>Número atómico</dt>
            <dd>{element.z}</dd>
          </div>
          <div>
            <dt>Massa atómica</dt>
            <dd>
              {formatMass(element)} u
              {element.massIsotope ? <small> Massa do isótopo mais estável.</small> : null}
            </dd>
          </div>
          <div>
            <dt>Estado a 20 °C</dt>
            <dd>{roomStateShort(element)}</dd>
          </div>
          <div>
            <dt>Descoberta</dt>
            <dd>{yearLabel(element)}</dd>
          </div>
          <div>
            <dt>Grupo e período</dt>
            <dd>
              {groupLabel(element)} · Período {element.period}
            </dd>
          </div>
          <div>
            <dt>Bloco</dt>
            <dd>{blockLabel(element)}</dd>
          </div>
        </dl>
        <p className="state-note">{roomStateLong(element)}</p>
        <p className="fact">
          <strong>Sabias que…</strong> {element.fact}
        </p>
        <p className="uses">
          <strong>Onde o encontras.</strong> {element.uses}
        </p>
        {onShowFamily ? (
          <div className="dialog-actions">
            <button type="button" className="ghost" onClick={() => onShowFamily(element.category)}>
              Mostrar a família na tabela
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
