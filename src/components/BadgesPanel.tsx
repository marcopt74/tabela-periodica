import { useState } from 'react'
import type { Element } from '../data/types.ts'
import { badgesFor } from '../lib/badges.ts'
import type { SaveData } from '../lib/progress.ts'

type Props = {
  save: SaveData
  elements: readonly Element[]
  onReset: () => void
}

export function BadgesPanel({ save, elements, onReset }: Props) {
  const badges = badgesFor(save, elements)
  const earned = badges.filter((badge) => badge.earned).length
  const [confirm, setConfirm] = useState(false)

  return (
    <section className="badges-view" aria-labelledby="titulo-medalhas">
      <h2 id="titulo-medalhas">Medalhas</h2>
      <p className="lede">As medalhas ficam guardadas neste aparelho, mesmo se fechares o separador.</p>
      <div className="stats">
        <p>
          <strong>{save.discovered.length}</strong>
          <span>descobertos</span>
        </p>
        <p>
          <strong>{save.bestScore}</strong>
          <span>melhor pontuação</span>
        </p>
        <p>
          <strong>{save.bestStreak}</strong>
          <span>melhor sequência</span>
        </p>
        <p>
          <strong>{earned}</strong>
          <span>medalhas</span>
        </p>
      </div>
      <ul className="badge-grid">
        {badges.map((badge) => (
          <li key={badge.id} className={badge.earned ? 'badge' : 'badge is-locked'}>
            <h3>{badge.title}</h3>
            <p>{badge.detail}</p>
            <span>{badge.earned ? 'Conquistada' : 'Por conquistar'}</span>
          </li>
        ))}
      </ul>
      {confirm ? (
        <div className="confirm" role="region" aria-labelledby="titulo-apagar">
          <h3 id="titulo-apagar">Apagar o progresso?</h3>
          <p>Tens a certeza? As descobertas e as medalhas deste aparelho desaparecem.</p>
          <div className="dialog-actions">
            <button type="button" className="danger" onClick={onReset}>
              Apagar
            </button>
            <button type="button" className="ghost" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="ghost" onClick={() => setConfirm(true)}>
          Apagar o meu progresso
        </button>
      )}
    </section>
  )
}
