import type { CSSProperties } from 'react'
import type { Element } from '../data/types.ts'
import { neutronPhrase } from '../lib/format.ts'
import { usePrefersReducedMotion } from '../lib/motion.ts'

const MAX_DOTS = 8

function shellSize(index: number, total: number): number {
  if (total === 1) return 62
  const start = 38
  const end = 88
  return start + ((index + 1) / total) * (end - start)
}

export function BohrAtom({ element }: { element: Element }) {
  const reduce = usePrefersReducedMotion()
  const protonText = element.z === 1 ? '1 protão' : `${element.z} protões`
  const neutronHint = neutronPhrase(element)

  return (
    <figure className="atom-wrap" aria-label={`Modelo do átomo de ${element.name}: ${protonText} e ${neutronHint}.`}>
      <div className="atom-stage" aria-hidden="true">
        <div className="nucleus">
          <span>{element.symbol}</span>
        </div>
        {element.shells.map((count, index) => {
          const dots = Math.min(count, MAX_DOTS)
          const style = {
            '--size': `${shellSize(index, element.shells.length)}%`,
            '--dur': `${6 + index * 3.4}s`,
          } as CSSProperties
          return (
            <div
              key={index}
              className={reduce ? 'orbit' : `orbit spinning${index % 2 === 1 ? ' reverse' : ''}`}
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
      <figcaption className="shell-list">
        <span>
          {protonText} · {neutronHint}
        </span>
        {element.shells.map((count, index) => (
          <span key={index}>
            {index + 1}.ª camada · {count} {count === 1 ? 'eletrão' : 'eletrões'}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
