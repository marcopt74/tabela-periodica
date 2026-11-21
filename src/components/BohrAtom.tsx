import { useState, type CSSProperties } from 'react'
import type { Element } from '../data/types.ts'
import { neutronPhrase } from '../lib/format.ts'
import { usePrefersReducedMotion } from '../lib/motion.ts'
import { IconPause, IconPlay } from './Icons.tsx'

const MAX_DOTS = 8

function shellSize(index: number, total: number): number {
  if (total === 1) return 62
  const start = 36
  const end = 88
  return start + ((index + 1) / total) * (end - start)
}

export function BohrAtom({ element }: { element: Element }) {
  const reduce = usePrefersReducedMotion()
  const [paused, setPaused] = useState(false)
  const spinning = !reduce && !paused
  const protonText = element.z === 1 ? '1 protão' : `${element.z} protões`
  const neutronHint = neutronPhrase(element)
  const lastIndex = element.shells.length - 1

  return (
    <figure className="atom-wrap" aria-label={`Modelo do átomo de ${element.name}: ${protonText} e ${neutronHint}.`}>
      <div className="atom-stage-shell">
        <div className="atom-stage" aria-hidden="true">
          <div className="nucleus">
            <span>{element.symbol}</span>
          </div>
          {element.shells.map((count, index) => {
            const dots = Math.min(count, MAX_DOTS)
            const isOuter = index === lastIndex
            const style = {
              '--size': `${shellSize(index, element.shells.length)}%`,
              '--dur': `${6 + index * 3.4}s`,
            } as CSSProperties
            return (
              <div
                key={index}
                className={[
                  'orbit',
                  spinning ? 'spinning' : '',
                  index % 2 === 1 ? 'reverse' : '',
                  isOuter ? 'is-outer' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={style}
              >
                {Array.from({ length: dots }, (_, dot) => (
                  <span
                    key={dot}
                    className="arm"
                    style={{ '--angle': `${(dot / dots) * 360}deg` } as CSSProperties}
                  >
                    <span className="electron" />
                  </span>
                ))}
              </div>
            )
          })}
        </div>
        {!reduce ? (
          <button
            type="button"
            className="atom-toggle"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <IconPlay /> : <IconPause />}
            <span>{paused ? 'Rodar órbitas' : 'Pausar'}</span>
          </button>
        ) : null}
      </div>
      <figcaption className="shell-list">
        <span className="shell-nucleus">
          {protonText} · {neutronHint}
        </span>
        {element.shells.map((count, index) => (
          <span key={index} className={index === lastIndex ? 'is-outer' : undefined}>
            {index + 1}.ª camada · {count} {count === 1 ? 'eletrão' : 'eletrões'}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
