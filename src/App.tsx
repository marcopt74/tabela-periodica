import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { BadgesPanel } from './components/BadgesPanel.tsx'
import { Confetti } from './components/Confetti.tsx'
import { DetailDialog } from './components/DetailDialog.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import {
  IconArrow,
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

function Peek({
  element,
  phase,
  celsius,
  seen,
  onOpen,
}: {
  element: Element | null
  phase: Phase | null
  celsius: number
  seen: ReadonlySet<number>
  onOpen: (z: number) => void
}) {
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
          <strong>Atlas dos 118 elementos</strong>
          <p>Passa o rato num quadrado para inspecionar ou toca nele para abrir a ficha completa.</p>
          <span className="peek-seen-key">
            <i aria-hidden="true" />
            Ponto no canto = já descoberto
          </span>
        </div>
      </div>
    )
  }
  const category = CATEGORY_MAP[element.category]
  const swatch = phase ? PHASE_COLORS[phase] : category.color
  const isSeen = seen.has(element.z)

  return (
    <div className="peek" aria-live="polite">
      <button
        type="button"
        className="peek-tile peek-tile-btn"
        style={{ '--swatch': swatch } as CSSProperties}
        onClick={() => onOpen(element.z)}
        aria-label={`Abrir ficha de ${element.name}`}
      >
        <span className="pk-z">{element.z}</span>
        <span className="pk-sym">{element.symbol}</span>
        <span className="pk-mass">{formatMass(element)}</span>
      </button>
      <div className="peek-info">
        <div className="peek-title-row">
          <h3>{element.name}</h3>
          <span className="tag" style={{ '--swatch': swatch } as CSSProperties}>
            <i aria-hidden="true" />
            {phase ? `${phaseLabel(phase)} a ${formatTemp(celsius)}` : category.label}
          </span>
          {isSeen ? <span className="peek-discovered">Descoberto</span> : null}
        </div>
        <p className="meta">
          {groupLabel(element)} · Período {element.period} · {roomStateShort(element)} a 20 °C
        </p>
        <div className="peek-foot-row">
          <p className="peek-shells">
            <span>Camadas:</span> {element.shells.join(' · ')}
          </p>
          <button type="button" className="peek-open-link" onClick={() => onOpen(element.z)}>
            Abrir ficha
            <IconArrow size={14} />
          </button>
        </div>
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
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    writeSave(save)
  }, [save])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d131c' : '#f7f5f0')
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

  useEffect(() => {
    if (view !== 'table') return
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const active = document.activeElement as HTMLElement | null
      if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return
      if (document.querySelector('.drawer-backdrop')) return
      event.preventDefault()
      searchInputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [view])

  const celsius = sliderToCelsius(slider)
  const kelvin = Math.max(0, Math.round(celsius + 273.15))
  const openElement = openZ == null ? null : getElement(openZ)
  const highlight = !tempMode ? (hoverCategory ?? lockedCategory) : null
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
    setPeekZ(z)
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

  const clearFilters = useCallback(() => {
    setQuery('')
    setGroup(null)
    setPeriod(null)
    setLockedCategory(null)
    setHoverCategory(null)
  }, [])

  const showFamily = useCallback((category: CategoryId) => {
    setTempMode(false)
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
              <IconGrid size={16} />
              <span>Tabela</span>
            </button>
            <button type="button" aria-current={view === 'quiz' ? 'page' : undefined} onClick={() => setView('quiz')}>
              <IconBolt size={16} />
              <span>Desafio</span>
            </button>
            <button type="button" aria-current={view === 'badges' ? 'page' : undefined} onClick={() => setView('badges')}>
              <IconMedal size={16} />
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
                <strong>
                  {save.discovered.length}
                  <span>/118</span>
                </strong>
                <small>descobertos</small>
              </div>
            </button>
            <button
              type="button"
              className="icon-btn theme-btn"
              aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? <IconSun size={19} /> : <IconMoon size={19} />}
            </button>
          </div>
        </header>
        <main id="conteudo">
          {view === 'table' ? (
            <section className="view-panel" aria-labelledby="titulo-tabela">
              <h2 id="titulo-tabela" className="sr-only">
                Tabela periódica
              </h2>
              <form className="command-bar" role="search" onSubmit={(event) => event.preventDefault()}>
                <div className="search-field">
                  <label htmlFor="element-search" className="sr-only">
                    Procurar elemento
                  </label>
                  <IconSearch size={17} />
                  <input
                    ref={searchInputRef}
                    id="element-search"
                    type="text"
                    inputMode="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        setQuery('')
                        searchInputRef.current?.blur()
                      }
                    }}
                    placeholder="Procurar nome, símbolo ou n.º (ex: ouro, Fe, 8)"
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                  {query ? (
                    <button
                      type="button"
                      className="search-clear"
                      aria-label="Limpar pesquisa"
                      onClick={() => {
                        setQuery('')
                        searchInputRef.current?.focus()
                      }}
                    >
                      <IconClose size={14} />
                    </button>
                  ) : (
                    <kbd className="search-kbd" aria-hidden="true">
                      /
                    </kbd>
                  )}
                </div>

                <div className="command-selects">
                  <select
                    aria-label="Filtrar por período"
                    className={period != null ? 'ctrl-select is-active' : 'ctrl-select'}
                    value={period ?? ''}
                    onChange={(event) => setPeriod(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Período: Todos</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                      <option key={item} value={item}>
                        Período {item}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filtrar por grupo"
                    className={group != null ? 'ctrl-select is-active' : 'ctrl-select'}
                    value={group ?? ''}
                    onChange={(event) => setGroup(event.target.value ? Number(event.target.value) : null)}
                  >
                    <option value="">Grupo: Todos</option>
                    {Array.from({ length: 18 }, (_, index) => index + 1).map((item) => (
                      <option key={item} value={item}>
                        Grupo {item}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="command-divider" aria-hidden="true" />

                <div className="command-actions">
                  <button
                    type="button"
                    className={tempMode ? 'ctrl-pill is-on' : 'ctrl-pill'}
                    aria-pressed={tempMode}
                    onClick={() => {
                      setTempMode((current) => !current)
                      setHoverCategory(null)
                    }}
                  >
                    <IconThermometer size={16} />
                    <span>Temperatura</span>
                  </button>
                  <button
                    type="button"
                    className="ctrl-pill is-accent"
                    onClick={openSurprise}
                    title="Abrir um elemento ao acaso"
                  >
                    <IconSparkles size={15} />
                    <span>Surpresa</span>
                  </button>
                  {filtersOn ? (
                    <button type="button" className="ctrl-pill is-reset" onClick={clearFilters}>
                      <IconClose size={13} />
                      <span>Limpar ({matchedCount})</span>
                    </button>
                  ) : null}
                </div>
              </form>

              {tempMode ? (
                <div className="temp-dock" role="region" aria-label="Controlo de temperatura">
                  <div className="temp-dock-top">
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
                    <div className="temp-meta-row">
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
                      <span className="temp-est-note">Riscas = temperatura prevista</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="legend-block"
                  onPointerLeave={(event) => {
                    if (event.pointerType === 'mouse') setHoverCategory(null)
                  }}
                >
                  <ul className="legend" aria-label="Filtrar por família química">
                    {CATEGORY_ORDER.map((category) => (
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
                          <i aria-hidden="true" />
                          <span>{category.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="context-line" aria-live="polite">
                    {activeCategoryMeta ? (
                      <p className="hint-family">
                        <i style={{ background: activeCategoryMeta.color }} aria-hidden="true" />
                        <strong>{activeCategoryMeta.label}:</strong> {activeCategoryMeta.hint}
                      </p>
                    ) : (
                      <p className="hint-quiet">
                        Toca numa família, num grupo ou num período para destacar. No teclado, usa as setas e Enter.
                      </p>
                    )}
                    <span className="scroll-hint">Desliza para veres os 18 grupos →</span>
                  </div>
                </div>
              )}

              <div className="table-card" id="tabela">
                <PeriodicTable
                  elements={elements}
                  tileStyle={tileStyle}
                  onOpen={openCard}
                  onPeek={(element) => setPeekZ(element.z)}
                  highlightCategory={highlight}
                  seen={seen}
                  selectedZ={openZ}
                  tempMode={tempMode}
                  selectedGroup={group}
                  selectedPeriod={period}
                  onSelectGroup={setGroup}
                  onSelectPeriod={setPeriod}
                  peek={
                    <Peek
                      element={peekZ == null ? null : getElement(peekZ)}
                      phase={peekZ != null && tempMode ? stateAt(getElement(peekZ), celsius) : null}
                      celsius={celsius}
                      seen={seen}
                      onOpen={openCard}
                    />
                  }
                />
              </div>

              {matchedCount === 0 ? (
                <div className="empty-banner" role="status">
                  <p>
                    Nenhum elemento corresponde a estes filtros. Experimenta <strong>ouro</strong>, <strong>Fe</strong> ou{' '}
                    <strong>8</strong>.
                  </p>
                  <button type="button" className="btn ghost tiny" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                </div>
              ) : null}
              {period != null && period >= 6 ? (
                <p className="period-note">
                  O período {period} inclui a fila de baixo: os {period === 6 ? 'lantanídeos' : 'actinídeos'}.
                </p>
              ) : null}
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
