import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { getElement } from '../data/elements.ts'
import { CATEGORY_MAP } from '../data/categories.ts'
import type { CategoryId, Element } from '../data/types.ts'
import { blockLabel, formatMass, groupLabel, yearLabel } from '../lib/format.ts'
import { roomStateLong, roomStateShort } from '../lib/matter.ts'
import { speakPt, stopSpeech } from '../lib/speech.ts'
import { BohrAtom } from './BohrAtom.tsx'
import { IconChevron, IconClose, IconSpeaker } from './Icons.tsx'

type Props = {
  element: Element
  isNew: boolean
  onClose: () => void
  onShowFamily?: (category: CategoryId) => void
  /** Passa para o elemento vizinho (anterior ou seguinte). */
  onNavigate?: (z: number) => void
}

export function DetailDialog({ element, isNew, onClose, onShowFamily, onNavigate }: Props) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [speechNote, setSpeechNote] = useState<string | null>(null)
  const category = CATEGORY_MAP[element.category]
  const prevEl = element.z > 1 ? getElement(element.z - 1) : null
  const nextEl = element.z < 118 ? getElement(element.z + 1) : null
  const movedRef = useRef<'prev' | 'next' | null>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () =>
      [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (node) => !node.hasAttribute('disabled'),
      )
    const moved = movedRef.current
    movedRef.current = null
    const steps = root.querySelectorAll<HTMLElement>('.step')
    const target = moved === 'prev' ? steps[0] : moved === 'next' ? steps[1] : null
    if (target && !target.hasAttribute('disabled')) target.focus()
    else focusable()[0]?.focus()
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && onNavigate) {
        const target = event.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return
        const next = event.key === 'ArrowRight' ? nextEl : prevEl
        if (next) {
          event.preventDefault()
          movedRef.current = event.key === 'ArrowRight' ? 'next' : 'prev'
          onNavigate(next.z)
        }
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
  }, [onClose, onNavigate, element.z, prevEl, nextEl])

  function hear() {
    const ok = speakPt(element.name)
    setSpeechNote(
      ok
        ? null
        : 'Este navegador não consegue falar. Pede a alguém para ler o nome em voz alta.',
    )
  }

  function step(target: Element | null, direction: 'prev' | 'next') {
    if (!target || !onNavigate) return
    movedRef.current = direction
    onNavigate(target.z)
  }

  const facts: { label: string; value: string; note?: string }[] = [
    { label: 'Número atómico', value: String(element.z) },
    {
      label: 'Massa atómica',
      value: `${formatMass(element)} u`,
      note: element.massIsotope ? 'Massa do isótopo mais estável.' : undefined,
    },
    { label: 'Estado a 20 °C', value: roomStateShort(element) },
    { label: 'Descoberta', value: yearLabel(element) },
    { label: 'Grupo e período', value: `${groupLabel(element)} · Período ${element.period}` },
    { label: 'Bloco', value: blockLabel(element) },
  ]

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
        <div className="dlg-grid">
          <div className="dlg-side">
            <BohrAtom element={element} />
          </div>
          <div className="dlg-main">
            {isNew ? <p className="ribbon">Nova descoberta</p> : null}
            <p className="eyebrow">{category.label}</p>
            <h2 id={titleId} lang="pt-PT">
              {element.name}
            </h2>
            <div className="sym-line">
              <span className="sym-chip">{element.symbol}</span>
              <span className="n">n.º {element.z}</span>
              <button type="button" className="speak" onClick={hear}>
                <IconSpeaker />
                Ouvir o nome
              </button>
            </div>
            {speechNote ? <p className="speech-note">{speechNote}</p> : null}
            <dl className="facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>
                    {fact.value}
                    {fact.note ? <small>{fact.note}</small> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="state-note">{roomStateLong(element)}</p>
            <div className="callout">
              <h3>Sabias que…</h3>
              <p>{element.fact}</p>
            </div>
            <div className="callout">
              <h3>Onde o encontras</h3>
              <p>{element.uses}</p>
            </div>
            <div className="dlg-foot">
              {onNavigate ? (
                <>
                  <button
                    type="button"
                    className="step"
                    disabled={!prevEl}
                    aria-label={prevEl ? `Elemento anterior: ${prevEl.name}` : 'Sem elemento anterior'}
                    onClick={() => step(prevEl, 'prev')}
                  >
                    <IconChevron direction="prev" />
                    {prevEl?.symbol}
                  </button>
                  <button
                    type="button"
                    className="step"
                    disabled={!nextEl}
                    aria-label={nextEl ? `Elemento seguinte: ${nextEl.name}` : 'Sem elemento seguinte'}
                    onClick={() => step(nextEl, 'next')}
                  >
                    {nextEl?.symbol}
                    <IconChevron direction="next" />
                  </button>
                </>
              ) : null}
              <span className="spacer" />
              {onShowFamily ? (
                <button type="button" className="btn ghost small" onClick={() => onShowFamily(element.category)}>
                  Mostrar a família na tabela
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
