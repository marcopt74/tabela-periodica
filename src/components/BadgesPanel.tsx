import { useState, type CSSProperties } from 'react'
import { CATEGORY_MAP, CATEGORY_ORDER } from '../data/categories.ts'
import type { CategoryId, Element } from '../data/types.ts'
import { badgesFor, type Badge } from '../lib/badges.ts'
import type { SaveData } from '../lib/progress.ts'
import { IconBolt, IconCheck, IconGrid, IconMedal, IconStar } from './Icons.tsx'

type Props = {
  save: SaveData
  elements: readonly Element[]
  onReset: () => void
  onSelectFamily?: (category: CategoryId) => void
}

function Glyph({ badge }: { badge: Badge }) {
  switch (badge.glyph) {
    case 'flag':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 21V4M6 5h11l-2.5 4L17 13H6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'half':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      )
    case 'grid':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          {[4, 9.7, 15.4].flatMap((x) => [4, 9.7, 15.4].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="4.6" height="4.6" rx="1.2" />))}
        </svg>
      )
    case 'bolt':
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 3L6 13.5h5L10 21l8-11h-5.2z" fill="currentColor" />
        </svg>
      )
    case 'star':
      return <IconStar filled size={26} />
    case 'family':
      return <span className="family-dot" style={{ background: badge.family ? CATEGORY_MAP[badge.family].color : undefined }} />
    default:
      return <span className="medal-num">{badge.glyph === 'ten' ? '10' : '500'}</span>
  }
}

export function BadgesPanel({ save, elements, onReset, onSelectFamily }: Props) {
  const badges = badgesFor(save, elements)
  const earned = badges.filter((badge) => badge.earned).length
  const [confirm, setConfirm] = useState(false)
  const seen = new Set(save.discovered)
  const totalPct = Math.round((save.discovered.length / elements.length) * 100)

  const stats = [
    { value: `${save.discovered.length}/118`, label: 'descobertos', icon: <IconGrid size={20} />, tone: 'teal' },
    { value: String(save.bestScore), label: 'melhor pontuação', icon: <IconStar filled size={20} />, tone: 'sun' },
    { value: String(save.bestStreak), label: 'melhor sequência', icon: <IconBolt size={20} />, tone: 'amber' },
    { value: `${earned}/${badges.length}`, label: 'medalhas', icon: <IconMedal size={20} />, tone: 'violet' },
  ] as const

  const familyStats = CATEGORY_ORDER.map((category) => {
    const group = elements.filter((el) => el.category === category.id)
    const found = group.filter((el) => seen.has(el.z)).length
    return { category, found, total: group.length, pct: group.length ? (found / group.length) * 100 : 0 }
  })

  return (
    <section className="badges-view" aria-labelledby="titulo-medalhas">
      <div className="section-head">
        <div>
          <p className="kicker">As tuas conquistas</p>
          <h2 id="titulo-medalhas" className="page-title">
            Medalhas
          </h2>
          <p className="lede">As medalhas ficam guardadas neste aparelho, mesmo se fechares o separador.</p>
        </div>
      </div>

      <div className="stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat stat-${stat.tone}`}>
            <span className="stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
            <div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="family-progress-card">
        <div className="family-progress-head">
          <div>
            <h3>Progresso por família</h3>
            <p>Toca numa família para a veres destacada na tabela.</p>
          </div>
          <span className="pill">
            <b>{totalPct}%</b> da tabela
          </span>
        </div>
        <div className="family-progress-grid">
          {familyStats.map(({ category, found, total, pct }) => (
            <button
              key={category.id}
              type="button"
              className={found === total ? 'family-row is-complete' : 'family-row'}
              style={{ '--swatch': category.color } as CSSProperties}
              onClick={() => onSelectFamily?.(category.id)}
            >
              <div className="family-row-top">
                <i className="family-row-dot" aria-hidden="true" />
                <span className="family-row-name">{category.label}</span>
                <span className="family-row-count">
                  {found}/{total}
                </span>
              </div>
              <span className="family-row-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <h3 className="sub-heading">Coleção de medalhas</h3>
      <ul className="badge-grid">
        {badges.map((badge) => {
          const percent = Math.min(100, (badge.value / badge.goal) * 100)
          return (
            <li
              key={badge.id}
              className={badge.earned ? 'badge is-earned' : 'badge is-locked'}
              style={
                badge.family ? ({ '--badge-accent': CATEGORY_MAP[badge.family].color } as CSSProperties) : undefined
              }
            >
              <div className="medal" aria-hidden="true">
                <Glyph badge={badge} />
              </div>
              <h3>{badge.title}</h3>
              <p>{badge.detail}</p>
              <div className="badge-foot">
                <p className="state">
                  {badge.earned ? (
                    <>
                      <IconCheck size={14} />
                      Conquistada
                    </>
                  ) : (
                    `Por conquistar · ${Math.min(badge.value, badge.goal)} de ${badge.goal}`
                  )}
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

      <div className="danger-zone">
        {confirm ? (
          <div className="confirm" role="region" aria-labelledby="titulo-apagar">
            <h3 id="titulo-apagar">Apagar o progresso?</h3>
            <p>Tens a certeza? As descobertas e as medalhas deste aparelho desaparecem.</p>
            <div className="actions">
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  onReset()
                  setConfirm(false)
                }}
              >
                Apagar
              </button>
              <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn ghost small" onClick={() => setConfirm(true)}>
            Apagar o meu progresso
          </button>
        )}
      </div>
    </section>
  )
}
