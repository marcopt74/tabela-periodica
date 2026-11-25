import { useState, type CSSProperties } from 'react'
import { CATEGORY_MAP, CATEGORY_ORDER } from '../data/categories.ts'
import type { CategoryId, Element } from '../data/types.ts'
import { badgesFor, type Badge } from '../lib/badges.ts'
import type { SaveData } from '../lib/progress.ts'
import { IconArrow, IconBolt, IconCheck, IconGrid, IconMedal, IconStar } from './Icons.tsx'

type Props = {
  save: SaveData
  elements: readonly Element[]
  onReset: () => void
  onSelectFamily?: (category: CategoryId) => void
}

type BadgeFilter = 'all' | 'earned' | 'locked'

function Glyph({ badge }: { badge: Badge }) {
  switch (badge.glyph) {
    case 'flag':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 21V4M6 5h11l-2.5 4L17 13H6" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'half':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.1" />
          <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
        </svg>
      )
    case 'grid':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          {[4, 9.7, 15.4].flatMap((x) => [4, 9.7, 15.4].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="4.6" height="4.6" rx="1.2" />))}
        </svg>
      )
    case 'bolt':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M13 3L6 13.5h5L10 21l8-11h-5.2z" fill="currentColor" />
        </svg>
      )
    case 'star':
      return <IconStar filled size={22} />
    case 'family':
      return <span className="family-dot" style={{ background: badge.family ? CATEGORY_MAP[badge.family].color : undefined }} />
    default:
      return <span className="medal-num">{badge.glyph === 'ten' ? '10' : '500'}</span>
  }
}

export function BadgesPanel({ save, elements, onReset, onSelectFamily }: Props) {
  const badges = badgesFor(save, elements)
  const earnedCount = badges.filter((badge) => badge.earned).length
  const lockedCount = badges.length - earnedCount
  const [filter, setFilter] = useState<BadgeFilter>('all')
  const [confirm, setConfirm] = useState(false)
  const seen = new Set(save.discovered)
  const totalPct = Math.round((save.discovered.length / elements.length) * 100)

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'earned') return badge.earned
    if (filter === 'locked') return !badge.earned
    return true
  })

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
            Medalhas e progresso
          </h2>
          <p className="lede">Tudo fica guardado neste aparelho, mesmo se fechares o separador.</p>
        </div>
      </div>

      <div className="metric-strip" role="region" aria-label="Resumo do progresso">
        <div className="metric-cell">
          <span className="metric-label">
            <IconGrid size={14} />
            Descobertos
          </span>
          <strong>
            {save.discovered.length}
            <small>/118</small>
          </strong>
          <span className="metric-sub">{totalPct}% do atlas</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">
            <IconMedal size={14} />
            Medalhas
          </span>
          <strong>
            {earnedCount}
            <small>/{badges.length}</small>
          </strong>
          <span className="metric-sub">{lockedCount} por conquistar</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">
            <IconStar filled size={14} />
            Melhor pontuação
          </span>
          <strong>{save.bestScore}</strong>
          <span className="metric-sub">{save.rounds === 1 ? '1 ronda jogada' : `${save.rounds} rondas jogadas`}</span>
        </div>
        <div className="metric-cell">
          <span className="metric-label">
            <IconBolt size={14} />
            Melhor sequência
          </span>
          <strong>{save.bestStreak}</strong>
          <span className="metric-sub">
            {save.perfectRounds > 0
              ? save.perfectRounds === 1
                ? '1 ronda perfeita'
                : `${save.perfectRounds} rondas perfeitas`
              : 'respostas seguidas'}
          </span>
        </div>
      </div>

      <div className="family-progress-card">
        <div className="family-progress-head">
          <div>
            <h3>Progresso por família</h3>
            <p>Toca numa família para a veres destacada na tabela.</p>
          </div>
          <span className="pill">
            <b>{totalPct}%</b> completo
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
                <IconArrow size={13} />
              </div>
              <span className="family-row-bar" aria-hidden="true">
                <i style={{ width: `${pct}%` }} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="badges-header-row">
        <h3 className="sub-heading">Coleção de medalhas</h3>
        <div className="seg-filter" role="group" aria-label="Filtrar medalhas">
          <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Todas ({badges.length})
          </button>
          <button type="button" aria-pressed={filter === 'earned'} onClick={() => setFilter('earned')}>
            Conquistadas ({earnedCount})
          </button>
          <button type="button" aria-pressed={filter === 'locked'} onClick={() => setFilter('locked')}>
            Por conquistar ({lockedCount})
          </button>
        </div>
      </div>

      {filteredBadges.length === 0 ? (
        <div className="empty-banner">
          <p>
            {filter === 'earned'
              ? 'Ainda não conquistaste nenhuma medalha. Abre fichas na tabela ou joga um desafio para começar!'
              : 'Já conquistaste todas as medalhas disponíveis. Parabéns!'}
          </p>
          <button type="button" className="btn ghost tiny" onClick={() => setFilter('all')}>
            Ver todas
          </button>
        </div>
      ) : (
        <ul className="badge-grid">
          {filteredBadges.map((badge) => {
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
                <div className="badge-content">
                  <h3>{badge.title}</h3>
                  <p>{badge.detail}</p>
                  <div className="badge-foot">
                    <p className="state">
                      {badge.earned ? (
                        <>
                          <IconCheck size={13} />
                          Conquistada
                        </>
                      ) : (
                        `${Math.min(badge.value, badge.goal)} de ${badge.goal}`
                      )}
                    </p>
                    {badge.earned ? null : (
                      <span className="bar" role="img" aria-label={`${Math.round(percent)}% do caminho`}>
                        <i style={{ width: `${percent}%` } as CSSProperties} />
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="danger-zone">
        {confirm ? (
          <div className="confirm" role="region" aria-labelledby="titulo-apagar">
            <h3 id="titulo-apagar">Apagar o progresso?</h3>
            <p>Tens a certeza? As descobertas e as medalhas deste aparelho desaparecem.</p>
            <div className="actions">
              <button
                type="button"
                className="btn danger small"
                onClick={() => {
                  onReset()
                  setConfirm(false)
                }}
              >
                Apagar tudo
              </button>
              <button type="button" className="btn ghost small" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn ghost tiny" onClick={() => setConfirm(true)}>
            Apagar o meu progresso
          </button>
        )}
      </div>
    </section>
  )
}
