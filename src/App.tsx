import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { BadgesPanel } from './components/BadgesPanel.tsx'
import { Confetti } from './components/Confetti.tsx'
import { DetailDialog } from './components/DetailDialog.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import {
  IconBolt,
  IconClose,
  IconGrid,
  IconMedal,
  IconMoon,
  IconSearch,
  IconSparkles,
  IconSun,
  IconThermometer,
} from './components/Icons.tsx'
import { PeriodicTable, type TileLook } from './components/PeriodicTable.tsx'
import { Quiz } from './components/Quiz.tsx'
import { CATEGORY_MAP, CATEGORY_ORDER, PHASE_COLORS } from './data/categories.ts'
import { elements, getElement } from './data/elements.ts'
import type { CategoryId, Element, Phase } from './data/types.ts'
import { formatMass, formatTemp, groupLabel, matchesQuery } from './lib/format.ts'
import {
  ROOM_C,
  TEMP_PRESETS,
  celsiusToSlider,
  phaseLabel,
  roomStateShort,
  sliderToCelsius,
  stateAt,
  temperatureNickname,
} from './lib/matter.ts'
import { emptySave, loadSave, writeSave, type SaveData } from './lib/progress.ts'
import type { RoundResult } from './lib/quiz.ts'

type View = 'table' | 'quiz' | 'badges'
type Theme = 'light' | 'dark'

const THEME_KEY = 'elementar.theme'

function loadInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {
    /* Ignora se o armazenamento estiver bloqueado. */
  }
  return 'light'
}

function Peek({ element, phase, celsius }: { element: Element | null; phase: Phase | null; celsius: number }) {
  if (!element) {
    return (
      <div className="peek empty-state" aria-live="polite">
        <div className="peek-key" aria-hidden="true">
          <div className="peek-tile peek-sample" style={{ '--swatch': CATEGORY_MAP.nonmetal.color } as CSSProperties}>
            <span className="pk-z">6</span>
            <span className="pk-sym">C</span>
            <span className="pk-name">Carbono</span>
          </div>
          <ul className="peek-anatomy">
            <li>n.º atómico</li>
            <li>símbolo</li>
            <li>nome</li>
          </ul>
        </div>
        <div className="peek-empty-copy">
          <strong>Explora os 118 elementos</strong>
          <p>Passa o rato num quadrado para pré-visualizar ou toca nele para abrir a ficha completa.</p>
        </div>
      </div>
    )
  }
  const category = CATEGORY_MAP[element.category]
  const swatch = phase ? PHASE_COLORS[phase] : category.color
  return (
    <div className="peek" aria-live="polite">
      <div className="peek-tile" aria-hidden="true" style={{ '--swatch': swatch } as CSSProperties}>
        <span className="pk-z">{element.z}</span>
        <span className="pk-sym">{element.symbol}</span>
        <span className="pk-mass">{formatMass(element)}</span>
      </div>
      <div className="peek-info">
        <div className="peek-title-row">
          <h3>{element.name}</h3>
          <span className="tag" style={{ '--swatch': swatch } as CSSProperties}>
            <i aria-hidden="true" />
            {phase ? `${phaseLabel(phase)} a ${formatTemp(celsius)}` : category.label}
          </span>
        </div>
        <p className="meta">
          {groupLabel(element)} · Período {element.period} · {roomStateShort(element)} a 20 °C
        </p>
        <p className="peek-shells">
          <span>Camadas:</span> {element.shells.join(' · ')}
        </p>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <div className="logo" aria-hidden="true">
      <i />
      <span />
      <span />
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
  const [theme, setTheme] = useState<Theme>(() => loadInitialTheme())
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<number | null>(null)
  const [period, setPeriod] = useState<number | null>(null)
  const [tempMode, setTempMode] = useState(false)
  const [slider, setSlider] = useState(() => celsiusToSlider(ROOM_C))
  const [hoverCategory, setHoverCategory] = useState<CategoryId | null>(null)
  const [peekZ, setPeekZ] = useState<number | null>(null)
  const [lockedCategory, setLockedCategory] = useState<CategoryId | null>(null)
  const [openZ, setOpenZ] = useState<number | null>(null)
  const [freshZ, setFreshZ] = useState<number | null>(null)
  const [confetti, setConfetti] = useState(0)
  const previousCount = useRef(save.discovered.length)

  useEffect(() => {
    writeSave(save)
  }, [save])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1724' : '#f3f6fa')
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* Ignora se o armazenamento estiver bloqueado. */
    }
  }, [theme])

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
  const kelvin = Math.max(0, Math.round(celsius + 273.15))
  const openElement = openZ == null ? null : getElement(openZ)
  const highlight = hoverCategory ?? lockedCategory ?? (view === 'table' ? openElement?.category ?? null : null)
  const filtering = Boolean(query.trim() || group != null || period != null || highlight)

  const counts = useMemo(() => {
    const tally = { solid: 0, liquid: 0, gas: 0, unknown: 0 }
    if (!tempMode) return tally
    for (const element of elements) tally[stateAt(element, celsius)] += 1
    return tally
  }, [tempMode, celsius])

  const seen = useMemo(() => new Set(save.discovered), [save.discovered])

  const matchedCount = useMemo(() => {
    return elements.filter(
      (element) =>
        matchesQuery(element, query) &&
        (group == null || element.group === group) &&
        (period == null || element.period === period) &&
        (lockedCategory == null || element.category === lockedCategory),
    ).length
  }, [query, group, period, lockedCategory])

  function discover(z: number) {
    setSave((prev) => (prev.discovered.includes(z) ? prev : { ...prev, discovered: [...prev.discovered, z] }))
  }

  function openCard(z: number) {
    setFreshZ(save.discovered.includes(z) ? null : z)
    setOpenZ(z)
    discover(z)
  }

  function openSurprise() {
    const undiscovered = elements.filter((el) => !seen.has(el.z))
    const pool = undiscovered.length > 0 ? undiscovered : elements
    const chosen = pool[Math.floor(Math.random() * pool.length)]
    if (chosen) {
      setPeekZ(chosen.z)
      openCard(chosen.z)
    }
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
  const discoveredPct = Math.round((save.discovered.length / 118) * 100)
  const activeCategoryMeta = !tempMode && highlight ? CATEGORY_MAP[highlight] : null

  return (
    <>
      <a className="skip" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <div className="page">
        <header className="top">
          <button type="button" className="brand" onClick={() => setView('table')}>
            <Logo />
            <div>
              <h1>Elementar</h1>
              <span className="sub">Laboratório para curiosos</span>
            </div>
          </button>
          <nav className="tabs" aria-label="Secções">
            <button type="button" aria-current={view === 'table' ? 'page' : undefined} onClick={() => setView('table')}>
              <IconGrid size={17} />
              <span>Tabela</span>
            </button>
            <button type="button" aria-current={view === 'quiz' ? 'page' : undefined} onClick={() => setView('quiz')}>
              <IconBolt size={17} />
              <span>Desafio</span>
            </button>
            <button type="button" aria-current={view === 'badges' ? 'page' : undefined} onClick={() => setView('badges')}>
              <IconMedal size={17} />
              <span>Medalhas</span>
            </button>
          </nav>
          <div className="top-actions">
            <button
              type="button"
              className="progress"
              aria-label={`O teu progresso: ${save.discovered.length} de 118 descobertos. Abrir medalhas.`}
              onClick={() => setView('badges')}
            >
              <div className="ring" aria-hidden="true" style={{ '--p': (save.discovered.length / 118) * 100 } as CSSProperties}>
                <span>{discoveredPct}%</span>
              </div>
              <div className="progress-text">
                <strong>{save.discovered.length} de 118</strong>
                <span>descobertos</span>
              </div>
            </button>
            <button
              type="button"
              className="icon-btn theme-btn"
              aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
            </button>
          </div>
        </header>
        <main id="conteudo">
          {view === 'table' ? (
            <section className="view-panel" aria-labelledby="titulo-tabela">
              <h2 id="titulo-tabela" className="sr-only">
                Tabela periódica
              </h2>
              <form className="toolbar" role="search" onSubmit={(event) => event.preventDefault()}>
                <label className="field grow">
                  <span>Procurar elemento</span>
                  <span className="search-wrap">
                    <IconSearch />
                    <input
                      type="text"
                      inputMode="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Nome, símbolo ou número (ex: ouro, Fe, 8)"
                      autoComplete="off"
                      enterKeyHint="search"
                    />
                    {query ? (
                      <button
                        type="button"
                        className="search-clear"
                        aria-label="Limpar pesquisa"
                        onClick={() => setQuery('')}
                      >
                        <IconClose size={15} />
                      </button>
                    ) : null}
                  </span>
                </label>
                <label className="field">
                  <span>Período</span>
                  <select
                    value={period ?? ''}
                    onChange={(event) => setPeriod(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                      <option key={item} value={item}>
                        Período {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Grupo</span>
                  <select
                    value={group ?? ''}
                    onChange={(event) => setGroup(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Todos</option>
                    {Array.from({ length: 18 }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item}>
                        Grupo {item}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="toolbar-extras">
                  <label className={tempMode ? 'switch is-on' : 'switch'}>
                    <input type="checkbox" checked={tempMode} onChange={(event) => setTempMode(event.target.checked)} />
                    <span className="track" aria-hidden="true" />
                    <IconThermometer size={17} />
                    <span>Temperatura</span>
                  </label>
                  <button
                    type="button"
                    className="btn accent-soft small"
                    onClick={openSurprise}
                    title="Abrir um elemento ao acaso"
                  >
                    <IconSparkles size={16} />
                    <span>Surpresa</span>
                  </button>
                  {filtersOn ? (
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => {
                        setQuery('')
                        setGroup(null)
                        setPeriod(null)
                        setLockedCategory(null)
                      }}
                    >
                      Limpar ({matchedCount})
                    </button>
                  ) : null}
                </div>
              </form>
              {tempMode ? (
                <div className="temp-panel">
                  <div className="temp-top">
                    <div className="temp-readout">
                      <strong>{formatTemp(celsius)}</strong>
                      <span className="temp-kelvin">{kelvin.toLocaleString('pt-PT')} K</span>
                      <span className="temp-nick">{temperatureNickname(celsius)}</span>
                    </div>
                    <div className="presets" role="group" aria-label="Temperaturas de exemplo">
                      {TEMP_PRESETS.map((preset) => {
                        const isNear = Math.abs(Math.round(celsius) - preset.celsius) <= 3
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            aria-pressed={isNear}
                            onClick={() => setSlider(celsiusToSlider(preset.celsius))}
                          >
                            {preset.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <label className="slider">
                    <span className="sr-only">Temperatura</span>
                    <input
                      type="range"
                      className="slider-thermal"
                      min={0}
                      max={1000}
                      step={1}
                      value={Math.round(slider)}
                      aria-valuetext={`${formatTemp(celsius)}. ${temperatureNickname(celsius)}`}
                      onChange={(event) => setSlider(Number(event.target.value))}
                    />
                  </label>
                  <div className="phase-summary">
                    <div className="phase-bar" aria-hidden="true">
                      {(['solid', 'liquid', 'gas', 'unknown'] as const).map((phase) =>
                        counts[phase] > 0 ? (
                          <span
                            key={phase}
                            style={{
                              width: `${(counts[phase] / elements.length) * 100}%`,
                              background: PHASE_COLORS[phase],
                            }}
                          />
                        ) : null,
                      )}
                    </div>
                    <p className="temp-counts" aria-live="polite">
                      {(['solid', 'liquid', 'gas', 'unknown'] as const).map((phase) => (
                        <span key={phase} className="phase-count-chip">
                          <i style={{ background: PHASE_COLORS[phase] }} aria-hidden="true" />
                          <b>{counts[phase]}</b>{' '}
                          {phase === 'solid'
                            ? 'sólidos'
                            : phase === 'liquid'
                              ? 'líquidos'
                              : phase === 'gas'
                                ? 'gases'
                                : 'sem dados'}
                        </span>
                      ))}
                    </p>
                  </div>
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
                            className={hoverCategory === category.id && lockedCategory !== category.id ? 'is-hovered' : undefined}
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
                ) : activeCategoryMeta ? (
                  <p className="hint hint-family" aria-live="polite">
                    <i style={{ background: activeCategoryMeta.color }} aria-hidden="true" />
                    <strong>{activeCategoryMeta.label}:</strong> {activeCategoryMeta.hint}
                  </p>
                ) : (
                  <p className="hint">
                    Passa o rato num elemento ou toca numa família, grupo ou período para destacar. No teclado, usa as setas e Enter.
                  </p>
                )}
                <p className="scroll-hint">Desliza para o lado para veres os 18 grupos.</p>
                <div className="table-card" id="tabela">
                  <PeriodicTable
                    elements={elements}
                    tileStyle={tileStyle}
                    onOpen={openCard}
                    onHoverCategory={setHoverCategory}
                    onPeek={(element) => setPeekZ(element.z)}
                    highlightCategory={highlight}
                    seen={seen}
                    selectedGroup={group}
                    selectedPeriod={period}
                    onSelectGroup={setGroup}
                    onSelectPeriod={setPeriod}
                    peek={
                      <Peek
                        element={peekZ == null ? null : getElement(peekZ)}
                        phase={peekZ != null && tempMode ? stateAt(getElement(peekZ), celsius) : null}
                        celsius={celsius}
                      />
                    }
                  />
                </div>
                {matchedCount === 0 ? (
                  <p className="empty" role="status">
                    Não encontrei nenhum elemento com esses filtros. Experimenta «ouro», «Fe» ou «8», ou limpa os filtros.
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
              <Quiz
                elements={elements}
                bestScore={save.bestScore}
                bestStreak={save.bestStreak}
                onFinish={finishRound}
                onDiscover={discover}
                onOpen={openCard}
              />
            </div>
          ) : null}
          {view === 'badges' ? (
            <div className="view-panel">
              <BadgesPanel
                save={save}
                elements={elements}
                onReset={() => setSave(emptySave())}
                onSelectFamily={showFamily}
              />
            </div>
          ) : null}
        </main>
        <footer className="foot">
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
          onNavigate={openCard}
          onShowFamily={view === 'table' ? showFamily : undefined}
        />
      ) : null}
      <Confetti token={confetti} />
    </>
  )
}
