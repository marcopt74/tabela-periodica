import { useState, type CSSProperties } from 'react'
import { CATEGORY_MAP } from '../data/categories.ts'
import type { Element } from '../data/types.ts'
import { badgesFor, type Badge } from '../lib/badges.ts'
import type { SaveData } from '../lib/progress.ts'
import { IconStar } from './Icons.tsx'

type Props = {
  save: SaveData
  elements: readonly Element[]
  onReset: () => void
}

function Glyph({ badge }: { badge: Badge }) {
  switch (badge.glyph) {
    case 'flag':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 21V4M6 5h11l-2.5 4L17 13H6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'half':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      )
    case 'grid':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          {[4, 9.7, 15.4].flatMap((x) => [4, 9.7, 15.4].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="4.6" height="4.6" rx="1.2" />))}
        </svg>
      )
    case 'bolt':
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 3L6 13.5h5L10 21l8-11h-5.2z" fill="currentColor" />
        </svg>
      )
    case 'star':
      return <IconStar filled size={28} />
    case 'family':
      return <span className="family-dot" style={{ background: badge.family ? CATEGORY_MAP[badge.family].color : undefined }} />
    default:
      return <span className="medal-num">{badge.glyph === 'ten' ? '10' : '500'}</span>
  }
}

export function BadgesPanel({ save, elements, onReset }: Props) {
  const badges = badgesFor(save, elements)
  const earned = badges.filter((badge) => badge.earned).length
  const [confirm, setConfirm] = useState(false)
  const stats = [
    { value: save.discovered.length, label: 'descobertos' },
    { value: save.bestScore, label: 'melhor pontuação' },
    { value: save.bestStreak, label: 'melhor sequência' },
    { value: earned, label: 'medalhas' },
  ]

  return (
    <section className="badges-view" aria-labelledby="titulo-medalhas">
      <p className="kicker">As tuas conquistas</p>
      <h2 id="titulo-medalhas" className="page-title">
        Medalhas
      </h2>
      <p className="lede">As medalhas ficam guardadas neste aparelho, mesmo se fechares o separador.</p>
      <div className="stats">
        {stats.map((stat) => (
          <p key={stat.label} className="stat">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </p>
        ))}
      </div>
      <ul className="badge-grid">
        {badges.map((badge) => {
          const percent = Math.min(100, (badge.value / badge.goal) * 100)
          return (
            <li key={badge.id} className={badge.earned ? 'badge' : 'badge is-locked'}>
              <div className="medal" aria-hidden="true">
                <Glyph badge={badge} />
              </div>
              <h3>{badge.title}</h3>
              <p>{badge.detail}</p>
              <div>
                <p className="state">
                  {badge.earned ? 'Conquistada' : `Por conquistar · ${Math.min(badge.value, badge.goal)} de ${badge.goal}`}
                </p>
                {badge.earned ? null : (
                  <span className="bar" role="img" aria-label={`${Math.round(percent)}% do caminho`}>
                    <i style={{ width: `${percent}%` } as CSSProperties} />
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {confirm ? (
        <div className="confirm" role="region" aria-labelledby="titulo-apagar">
          <h3 id="titulo-apagar">Apagar o progresso?</h3>
          <p>Tens a certeza? As descobertas e as medalhas deste aparelho desaparecem.</p>
          <div className="actions">
            <button type="button" className="btn danger" onClick={onReset}>
              Apagar
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn ghost" onClick={() => setConfirm(true)}>
          Apagar o meu progresso
        </button>
      )}
    </section>
  )
}
