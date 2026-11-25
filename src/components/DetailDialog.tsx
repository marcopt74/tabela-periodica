import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { getElement } from '../data/elements.ts'
import { CATEGORY_MAP } from '../data/categories.ts'
import type { CategoryId, Element } from '../data/types.ts'
import { blockLabel, formatMass, formatTemp, groupLabel, yearLabel } from '../lib/format.ts'
import { roomStateLong, roomStateShort } from '../lib/matter.ts'
import { speakPt, stopSpeech } from '../lib/speech.ts'
import { BohrAtom } from './BohrAtom.tsx'
import {
  IconChevron,
  IconClose,
  IconCompass,
  IconLightbulb,
  IconSparkles,
  IconSpeaker,
  IconThermometer,
} from './Icons.tsx'

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
  const bodyRef = useRef<HTMLDivElement>(null)
  const [speechError, setSpeechError] = useState<{ z: number; text: string } | null>(null)
  const speechNote = speechError?.z === element.z ? speechError.text : null
  const category = CATEGORY_MAP[element.category]
  const prevEl = element.z > 1 ? getElement(element.z - 1) : null
  const nextEl = element.z < 118 ? getElement(element.z + 1) : null
  const movedRef = useRef<'prev' | 'next' | null>(null)

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      stopSpeech()
      previous?.focus()
    }
  }, [])

  useEffect(() => {
    stopSpeech()
    bodyRef.current?.scrollTo({ top: 0 })
    const root = ref.current
    if (!root) return
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
        const activeTarget = event.target as HTMLElement
        if (activeTarget.tagName === 'INPUT' || activeTarget.tagName === 'SELECT') return
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
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose, onNavigate, element.z, prevEl, nextEl])

  function hear() {
    const ok = speakPt(element.name)
    setSpeechError(
      ok
        ? null
        : {
            z: element.z,
            text: 'Este navegador não consegue falar. Pede a alguém para ler o nome em voz alta.',
          },
    )
  }

  function step(target: Element | null, direction: 'prev' | 'next') {
    if (!target || !onNavigate) return
    movedRef.current = direction
    onNavigate(target.z)
  }

  const hasTemps = element.meltC != null || element.boilC != null

  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
        style={{ '--swatch': category.color } as CSSProperties}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-grab" aria-hidden="true" />
        <header className="drawer-header">
          <div className="drawer-header-meta">
            <span className="eyebrow">
              <i className="eyebrow-dot" aria-hidden="true" />
              {category.label}
            </span>
            {isNew ? (
              <span className="ribbon">
                <IconSparkles size={13} />
                Nova descoberta
              </span>
            ) : null}
          </div>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Fechar a ficha">
            <IconClose size={19} />
          </button>
        </header>

        <div className="drawer-body" ref={bodyRef}>
          <div className="drawer-hero">
            <div className="specimen-tile" aria-hidden="true">
              <span className="specimen-z">{element.z}</span>
              <span className="specimen-sym">{element.symbol}</span>
            </div>
            <div className="drawer-identity">
              <h2 id={titleId} lang="pt-PT">
                {element.name}
              </h2>
              <p className="drawer-subtitle">
                {groupLabel(element)} · Período {element.period} · {blockLabel(element)}
              </p>
            </div>
            <button type="button" className="speak-btn" onClick={hear} aria-label={`Ouvir o nome ${element.name}`}>
              <IconSpeaker size={17} />
              <span>Ouvir</span>
            </button>
          </div>
          {speechNote ? <p className="speech-note">{speechNote}</p> : null}

          <section className="drawer-section drawer-atom-section" aria-label="Modelo atómico">
            <BohrAtom element={element} />
          </section>

          <section className="drawer-section" aria-label="Propriedades principais">
            <dl className="prop-grid">
              <div>
                <dt>Massa atómica</dt>
                <dd>
                  {formatMass(element)} u
                  {element.massIsotope ? <small>Isótopo mais estável</small> : null}
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
                <dt>Camadas</dt>
                <dd>{element.shells.join(' · ')}</dd>
              </div>
            </dl>
          </section>

          <section className="drawer-section drawer-thermal" aria-label="Comportamento térmico">
            <div className="thermal-head">
              <IconThermometer size={16} />
              <p>{roomStateLong(element)}</p>
            </div>
            {hasTemps ? (
              <div className="thermal-points">
                {element.sublimes ? (
                  <span className="thermal-chip">
                    <small>Sublimação{element.tempsEstimated ? ' (prevista)' : ''}</small>
                    <strong>{formatTemp(element.boilC ?? element.meltC ?? 0)}</strong>
                  </span>
                ) : (
                  <>
                    {element.meltC != null ? (
                      <span className="thermal-chip">
                        <small>Fusão{element.tempsEstimated ? ' (prevista)' : ''}</small>
                        <strong>{formatTemp(element.meltC)}</strong>
                      </span>
                    ) : null}
                    {element.boilC != null ? (
                      <span className="thermal-chip">
                        <small>Ebulição{element.tempsEstimated ? ' (prevista)' : ''}</small>
                        <strong>{formatTemp(element.boilC)}</strong>
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </section>

          <section className="drawer-section drawer-stories" aria-label="Curiosidades e aplicações">
            <article className="story-block story-fact">
              <h3>
                <IconLightbulb size={15} />
                Sabias que…
              </h3>
              <p>{element.fact}</p>
            </article>
            <article className="story-block story-uses">
              <h3>
                <IconCompass size={15} />
                Onde o encontras
              </h3>
              <p>{element.uses}</p>
            </article>
          </section>
        </div>

        <footer className="drawer-footer">
          {onNavigate ? (
            <div className="step-group">
              <button
                type="button"
                className="step"
                disabled={!prevEl}
                aria-label={prevEl ? `Elemento anterior: ${prevEl.name}` : 'Sem elemento anterior'}
                onClick={() => step(prevEl, 'prev')}
              >
                <IconChevron direction="prev" size={14} />
                {prevEl ? (
                  <>
                    <strong>{prevEl.symbol}</strong>
                    <span className="step-name">{prevEl.name}</span>
                  </>
                ) : (
                  <span>Início</span>
                )}
              </button>
              <button
                type="button"
                className="step"
                disabled={!nextEl}
                aria-label={nextEl ? `Elemento seguinte: ${nextEl.name}` : 'Sem elemento seguinte'}
                onClick={() => step(nextEl, 'next')}
              >
                {nextEl ? (
                  <>
                    <span className="step-name">{nextEl.name}</span>
                    <strong>{nextEl.symbol}</strong>
                  </>
                ) : (
                  <span>Fim</span>
                )}
                <IconChevron direction="next" size={14} />
              </button>
            </div>
          ) : null}
          <span className="spacer" />
          {onShowFamily ? (
            <button type="button" className="btn ghost tiny" onClick={() => onShowFamily(element.category)}>
              Ver família
            </button>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
