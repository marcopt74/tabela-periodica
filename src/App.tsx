import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { BadgesPanel } from './components/BadgesPanel.tsx'
import { Confetti } from './components/Confetti.tsx'
import { DetailDialog } from './components/DetailDialog.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { PeriodicTable, type TileLook } from './components/PeriodicTable.tsx'
import { Quiz } from './components/Quiz.tsx'
import { CATEGORY_MAP, CATEGORY_ORDER, PHASE_COLORS } from './data/categories.ts'
import { elements, getElement } from './data/elements.ts'
import type { CategoryId } from './data/types.ts'
import { matchesQuery } from './lib/format.ts'
import {
  ROOM_C,
  TEMP_PRESETS,
  celsiusToSlider,
  phaseLabel,
  sliderToCelsius,
  stateAt,
  temperatureNickname,
} from './lib/matter.ts'
import { formatTemp } from './lib/format.ts'
import { emptySave, loadSave, writeSave, type SaveData } from './lib/progress.ts'
import type { RoundResult } from './lib/quiz.ts'

type View = 'table' | 'quiz' | 'badges'

function Logo() {
  return (
    <div className="logo" aria-hidden="true">
      <span className="logo-nucleus" />
      <span className="logo-orbit" />
      <span className="logo-orbit logo-orbit-b" />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Explorer />
    </ErrorBoundary>
  )
}

function Explorer() {
  const [view, setView] = useState<View>('table')
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<number | null>(null)
  const [period, setPeriod] = useState<number | null>(null)
  const [tempMode, setTempMode] = useState(false)
  const [slider, setSlider] = useState(() => celsiusToSlider(ROOM_C))
  const [hoverCategory, setHoverCategory] = useState<CategoryId | null>(null)
  const [lockedCategory, setLockedCategory] = useState<CategoryId | null>(null)
  const [openZ, setOpenZ] = useState<number | null>(null)
  const [freshZ, setFreshZ] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(0)
  const previousCount = useRef(save.discovered.length)

  useEffect(() => {
    writeSave(save)
  }, [save])

  useEffect(() => {
    if (previousCount.current < 118 && save.discovered.length === 118) setConfetti((value) => value + 1)
    previousCount.current = save.discovered.length
  }, [save.discovered.length])

  useEffect(() => {
    const titles: Record<View, string> = {
      table: 'Elementar — tabela periódica',
      quiz: 'Desafio — Elementar',
      badges: 'Medalhas — Elementar',
    }
    document.title = titles[view]
  }, [view])

  const celsius = sliderToCelsius(slider)
  const openElement = openZ == null ? null : getElement(openZ)
  const highlight = hoverCategory ?? lockedCategory ?? (view === 'table' ? openElement?.category ?? null : null)
  const filtering = Boolean(query.trim() || group != null || period != null || highlight)

  const counts = useMemo(() => {
    const tally = { solid: 0, liquid: 0, gas: 0, unknown: 0 }
    if (!tempMode) return tally
    for (const element of elements) tally[stateAt(element, celsius)] += 1
    return tally
  }, [tempMode, celsius])

  const visible = elements.filter((element) => matchesQuery(element, query)).length

  function discover(z: number) {
    setSave((prev) => (prev.discovered.includes(z) ? prev : { ...prev, discovered: [...prev.discovered, z] }))
  }

  function openCard(z: number) {
    setFreshZ(save.discovered.includes(z) ? null : z)
    setOpenZ(z)
    discover(z)
  }

  const closeCard = useCallback(() => setOpenZ(null), [])

  const showFamily = useCallback((category: CategoryId) => {
    setLockedCategory(category)
    setHoverCategory(null)
    setView('table')
    setOpenZ(null)
  }, [])

  const finishRound = useCallback((result: RoundResult) => {
    setSave((prev) => ({
      ...prev,
      bestScore: Math.max(prev.bestScore, result.score),
      bestStreak: Math.max(prev.bestStreak, result.bestStreak),
      rounds: prev.rounds + 1,
      perfectRounds: prev.perfectRounds + (result.correct === result.total ? 1 : 0),
    }))
    if (result.stars >= 2) setConfetti((value) => value + 1)
  }, [])

  function tileStyle(element: (typeof elements)[number]): TileLook {
    const matches =
      matchesQuery(element, query) &&
      (group == null || element.group === group) &&
      (period == null || element.period === period) &&
      (highlight == null || element.category === highlight)
    return {
      swatch: tempMode ? PHASE_COLORS[stateAt(element, celsius)] : CATEGORY_MAP[element.category].color,
      estimated: tempMode && element.tempsEstimated,
      dim: filtering && !matches,
      match: highlight != null && element.category === highlight && matches,
      pulse: false,
      shake: false,
    }
  }

  const filtersOn = Boolean(query.trim() || group != null || period != null || lockedCategory)

  return (
    <>
      <a className="skip" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <div className="blobs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="page">
        <header className="top">
          <div className="brand">
            <Logo />
            <div>
              <p className="kicker">Laboratório para curiosos</p>
              <h1>Elementar</h1>
            </div>
          </div>
          <p className="lede">Toca num quadradinho. Há 118 elementos à tua espera.</p>
          <div className="top-actions">
            <p className="progress-pill">
              <span>
                {save.discovered.length} de 118 descobertos
              </span>
              <span className="progress-track" aria-hidden="true">
                <span style={{ width: `${(save.discovered.length / 118) * 100}%` }} />
              </span>
            </p>
            <nav aria-label="Secções">
              <button type="button" aria-current={view === 'table' ? 'page' : undefined} onClick={() => setView('table')}>
                Tabela
              </button>
              <button type="button" aria-current={view === 'quiz' ? 'page' : undefined} onClick={() => setView('quiz')}>
                Desafio
              </button>
              <button type="button" aria-current={view === 'badges' ? 'page' : undefined} onClick={() => setView('badges')}>
                Medalhas
              </button>
            </nav>
          </div>
        </header>
        <main id="conteudo">
          {view === 'table' ? (
            <section className="view-panel" aria-labelledby="titulo-tabela">
              <h2 id="titulo-tabela" className="sr-only">
                Tabela periódica
              </h2>
              <div className="toolbar">
                <label className="search">
                  <span>Procurar elemento</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nome, símbolo ou número"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </label>
                <label>
                  <span>Período</span>
                  <select
                    value={period ?? ''}
                    onChange={(event) => setPeriod(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Todos os períodos</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                      <option key={item} value={item}>
                        Período {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Grupo</span>
                  <select
                    value={group ?? ''}
                    onChange={(event) => setGroup(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Todos os grupos</option>
                    {Array.from({ length: 18 }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item}>
                        Grupo {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="switch">
                  <input type="checkbox" checked={tempMode} onChange={(event) => setTempMode(event.target.checked)} />
                  <span>Ver o estado da matéria</span>
                </label>
                {filtersOn ? (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setQuery('')
                      setGroup(null)
                      setPeriod(null)
                      setLockedCategory(null)
                    }}
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
              {tempMode ? (
                <div className="temp-panel">
                  <div className="temp-readout">
                    <strong>{formatTemp(celsius)}</strong>
                    <span>{temperatureNickname(celsius)}</span>
                  </div>
                  <label className="slider">
                    <span className="sr-only">Temperatura</span>
                    <input
                      type="range"
                      min={0}
                      max={1000}
                      step={1}
                      value={Math.round(slider)}
                      aria-valuetext={`${formatTemp(celsius)}. ${temperatureNickname(celsius)}`}
                      onChange={(event) => setSlider(Number(event.target.value))}
                    />
                  </label>
                  <div className="presets" role="group" aria-label="Temperaturas de exemplo">
                    {TEMP_PRESETS.map((preset) => (
                      <button key={preset.id} type="button" onClick={() => setSlider(celsiusToSlider(preset.celsius))}>
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="temp-counts">
                    {counts.solid} sólidos · {counts.liquid} líquidos · {counts.gas} gases · {counts.unknown} sem dados
                  </p>
                </div>
              ) : null}
              <div
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setHoverCategory(null)
                }}
              >
                <ul className="legend">
                  {(tempMode
                    ? (['solid', 'liquid', 'gas', 'unknown'] as const).map((phase) => (
                        <li key={phase}>
                          <span className="legend-note">
                            <i style={{ background: PHASE_COLORS[phase] }} />
                            {phaseLabel(phase)}
                          </span>
                        </li>
                      ))
                    : CATEGORY_ORDER.map((category) => (
                        <li key={category.id}>
                          <button
                            type="button"
                            aria-pressed={lockedCategory === category.id}
                            style={{ '--swatch': category.color } as CSSProperties}
                            onClick={() =>
                              setLockedCategory((current) => (current === category.id ? null : category.id))
                            }
                            onPointerEnter={(event) => {
                              if (event.pointerType === 'mouse') setHoverCategory(category.id)
                            }}
                          >
                            <i />
                            {category.label}
                          </button>
                        </li>
                      )))}
                </ul>
                {tempMode ? (
                  <p className="hint">As riscas marcam temperaturas previstas: ainda não há uma amostra para medir.</p>
                ) : (
                  <p className="hint">Passa o rato num elemento ou toca numa família para a acenderes. No teclado, usa as setas e Enter.</p>
                )}
                <p className="scroll-hint">Desliza para o lado para veres os 18 grupos.</p>
                <div className="table-card" id="tabela">
                  <PeriodicTable
                    elements={elements}
                    tileStyle={tileStyle}
                    onOpen={openCard}
                    onHoverCategory={setHoverCategory}
                    highlightCategory={highlight}
                  />
                </div>
                {visible === 0 ? (
                  <p className="empty" role="status">
                    Não encontrei nenhum elemento. Experimenta «ouro», «Fe» ou «8».
                  </p>
                ) : null}
                {period != null && period >= 6 ? (
                  <p className="hint">O período {period} inclui a fila de baixo: os {period === 6 ? 'lantanídeos' : 'actinídeos'}.</p>
                ) : null}
              </div>
            </section>
          ) : null}
          {view === 'quiz' ? (
            <div className="view-panel">
              <Quiz elements={elements} onFinish={finishRound} onDiscover={discover} onOpen={openCard} />
            </div>
          ) : null}
          {view === 'badges' ? (
            <div className="view-panel">
              <BadgesPanel save={save} elements={elements} onReset={() => setSave(emptySave())} />
            </div>
          ) : null}
        </main>
        <footer>
          <p>
            Massas arredondadas a 3 casas. Temperaturas aproximadas, à pressão normal. O estado «da sala» usa 20 °C.
            Alguns elementos são tóxicos ou radioativos: isto é para aprender, não para experiências sem um adulto.
          </p>
        </footer>
      </div>
      {openElement ? (
        <DetailDialog
          element={openElement}
          isNew={freshZ === openElement.z}
          onClose={closeCard}
          onShowFamily={view === 'table' ? showFamily : undefined}
        />
      ) : null}
      <Confetti token={confetti} />
    </>
  )
}
