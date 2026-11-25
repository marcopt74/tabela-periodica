import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CATEGORY_MAP } from '../data/categories.ts'
import type { Element, QuizMode } from '../data/types.ts'
import {
  ROUND_SIZE,
  createQuestion,
  mulberry32,
  questionPrompt,
  scoreCorrect,
  starsFor,
  starsLabel,
  type Question,
  type RoundResult,
} from '../lib/quiz.ts'
import { IconArrow, IconBolt, IconCheck, IconChevron, IconClose, IconLightbulb, IconStar } from './Icons.tsx'
import { PeriodicTable, type TileLook } from './PeriodicTable.tsx'

type Phase = 'pick' | 'play' | 'results'

type StepRecord = {
  element: Element
  right: boolean
}

const MODES: { id: QuizMode; title: string; text: string; tag: string; swatch: string }[] = [
  {
    id: 'symbol',
    title: 'Do nome ao símbolo',
    text: 'Mostramos o nome. Tu escolhes o símbolo certo entre quatro opções.',
    tag: '4 opções',
    swatch: CATEGORY_MAP.nonmetal.color,
  },
  {
    id: 'name',
    title: 'Do símbolo ao nome',
    text: 'Mostramos o símbolo químico. Tu descobres a que elemento pertence.',
    tag: '4 opções',
    swatch: CATEGORY_MAP.transition.color,
  },
  {
    id: 'find',
    title: 'Caça ao elemento',
    text: 'O nome aparece. Tu encontras o lugar exato do elemento na tabela.',
    tag: 'Tabela inteira',
    swatch: CATEGORY_MAP.alkaline.color,
  },
]

type Props = {
  elements: readonly Element[]
  bestScore?: number
  bestStreak?: number
  onFinish: (result: RoundResult) => void
  onDiscover: (z: number) => void
  onOpen: (z: number) => void
}

export function Quiz({ elements, bestScore = 0, bestStreak = 0, onFinish, onDiscover, onOpen }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [mode, setMode] = useState<QuizMode>('symbol')
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [used, setUsed] = useState<Set<number>>(() => new Set())
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestRoundStreak, setBestRoundStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongZ, setWrongZ] = useState<number | null>(null)
  const [history, setHistory] = useState<StepRecord[]>([])
  const [showHint, setShowHint] = useState(false)
  const [live, setLive] = useState('')
  const rng = useRef(mulberry32(1))
  const finished = useRef(false)
  const nextButton = useRef<HTMLButtonElement>(null)
  const answerRef = useRef<(chosen: Element | null, right: boolean) => void>(() => {})
  const resultsTitle = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (picked != null) nextButton.current?.focus()
  }, [picked])
  useEffect(() => {
    if (phase === 'results') resultsTitle.current?.focus()
  }, [phase])

  function start(nextMode: QuizMode) {
    rng.current = mulberry32((Date.now() ^ Math.floor(Math.random() * 100000)) >>> 0)
    const first = createQuestion(nextMode, elements, rng.current, new Set())
    setMode(nextMode)
    setIndex(0)
    setQuestion(first)
    setUsed(new Set([first.answer.z]))
    setScore(0)
    setStreak(0)
    setBestRoundStreak(0)
    setCorrect(0)
    setPicked(null)
    setWrongZ(null)
    setHistory([])
    setShowHint(false)
    setLive('')
    finished.current = false
    setPhase('play')
  }

  useEffect(() => {
    if (phase !== 'play' || mode === 'find' || picked != null || !question) return
    function onKey(event: KeyboardEvent) {
      if (document.querySelector('.drawer-backdrop')) return
      const option = question?.options[Number(event.key) - 1]
      if (option && question) answerRef.current(option, option.z === question.answer.z)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [phase, mode, picked, question])

  function answerWith(chosen: Element | null, right: boolean) {
    if (!question || picked != null) return
    const gained = right ? scoreCorrect(streak) : { points: 0, streak: 0 }
    const nextScore = score + gained.points
    const nextCorrect = correct + (right ? 1 : 0)
    const nextBest = Math.max(bestRoundStreak, gained.streak)
    setPicked(chosen?.z ?? question.answer.z)
    setWrongZ(!right && chosen ? chosen.z : null)
    setScore(nextScore)
    setStreak(gained.streak)
    setBestRoundStreak(nextBest)
    setCorrect(nextCorrect)
    setHistory((prev) => [...prev, { element: question.answer, right }])
    onDiscover(question.answer.z)
    const prompt = right
      ? `Certo! ${question.answer.name} é ${question.answer.symbol}.`
      : `Ainda não. ${question.answer.name} é ${question.answer.symbol}.`
    setLive(prompt)
  }

  useEffect(() => {
    answerRef.current = answerWith
  })

  function next() {
    if (!question) return
    if (index + 1 >= ROUND_SIZE) {
      if (finished.current) return
      finished.current = true
      const stars = starsFor(correct, ROUND_SIZE)
      onFinish({ score, bestStreak: bestRoundStreak, correct, total: ROUND_SIZE, stars })
      setPhase('results')
      return
    }
    const following = createQuestion(mode, elements, rng.current, used)
    setUsed((current) => new Set(current).add(following.answer.z))
    setQuestion(following)
    setIndex((value) => value + 1)
    setPicked(null)
    setWrongZ(null)
    setShowHint(false)
    setLive('')
  }

  const resultStars = starsFor(correct, ROUND_SIZE)
  const look = useMemo(() => {
    return (element: Element): TileLook => ({
      swatch: CATEGORY_MAP[element.category].color,
      estimated: false,
      dim:
        showHint &&
        picked == null &&
        question != null &&
        element.category !== question.answer.category,
      match: picked != null && question != null && element.category === question.answer.category,
      pulse: picked != null && question != null && element.z === question.answer.z,
      shake: wrongZ === element.z,
    })
  }, [picked, question, wrongZ, showHint])

  if (phase === 'pick') {
    return (
      <section className="quiz" aria-labelledby="titulo-desafio">
        <div className="section-head">
          <div>
            <p className="kicker">Põe-te à prova</p>
            <h2 id="titulo-desafio" className="page-title">
              Desafio
            </h2>
            <p className="lede">
              Escolhe um modo de jogo. São 8 perguntas, com pontos extra quando acertas várias de seguida.
            </p>
          </div>
          {bestScore > 0 || bestStreak > 0 ? (
            <div className="record-strip" aria-label="Os teus recordes">
              <span className="pill">
                Recorde <b>{bestScore}</b> pts
              </span>
              <span className="pill hot">
                <IconBolt size={14} />
                Sequência <b>{bestStreak}</b>
              </span>
            </div>
          ) : null}
        </div>
        <div className="mode-grid">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mode-card"
              style={{ '--swatch': item.swatch } as CSSProperties}
              onClick={() => start(item.id)}
            >
              <div className="mode-card-top">
                <span className="mode-tag">{item.tag}</span>
                <ModeDemo mode={item.id} />
              </div>
              <div className="mode-card-copy">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <span className="mode-cta">
                Começar ronda
                <IconArrow size={15} />
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (phase === 'results') {
    const message =
      resultStars === 3
        ? 'Incrível! Sabes mesmo desta tabela.'
        : resultStars === 2
          ? 'Muito bem! Já conheces uma boa parte.'
          : resultStars === 1
            ? 'Boa tentativa. Abre mais fichas e volta a jogar.'
            : 'Desta vez não saiu nenhum acerto. Explora a tabela e tenta outra vez.'
    const accuracy = Math.round((correct / ROUND_SIZE) * 100)
    return (
      <section className="quiz quiz-results-wrap" aria-labelledby="titulo-resultado">
        <div className="results">
          <div className="results-top">
            <div>
              <p className="kicker">Fim da ronda</p>
              <h2 id="titulo-resultado" className="page-title" tabIndex={-1} ref={resultsTitle}>
                Acertaste {correct} em {ROUND_SIZE}{' '}
                <span className="score-pct">({accuracy}%)</span>
              </h2>
            </div>
            <p className="stars" role="img" aria-label={starsLabel(resultStars)}>
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={star <= resultStars ? 'star-on' : 'off'}
                  style={{ '--star-i': star } as CSSProperties}
                >
                  <IconStar filled={star <= resultStars} size={34} />
                </span>
              ))}
            </p>
          </div>
          <p className="lede">{message}</p>
          <div className="result-stats">
            <span className="pill">
              <b>{score}</b> pontos
            </span>
            <span className={bestRoundStreak >= 3 ? 'pill hot' : 'pill'}>
              <IconBolt size={14} />
              Melhor sequência <b>{bestRoundStreak}</b>
            </span>
          </div>
          {history.length > 0 ? (
            <div className="review-block">
              <p className="review-title">Elementos desta ronda — toca num para abrir a ficha</p>
              <div className="review-grid">
                {history.map((item) => (
                  <button
                    key={item.element.z}
                    type="button"
                    className={item.right ? 'review-chip is-right' : 'review-chip is-wrong'}
                    style={{ '--swatch': CATEGORY_MAP[item.element.category].color } as CSSProperties}
                    onClick={() => onOpen(item.element.z)}
                  >
                    <span className="review-sym">{item.element.symbol}</span>
                    <span className="review-name">{item.element.name}</span>
                    <span className="review-mark" aria-label={item.right ? 'Certo' : 'Por rever'}>
                      {item.right ? <IconCheck size={12} /> : <IconClose size={12} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => start(mode)}>
              Outra ronda
            </button>
            <button type="button" className="btn ghost" onClick={() => setPhase('pick')}>
              Escolher outro jogo
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!question) return null
  const answered = picked != null
  const streakText = streak > 1 ? `${streak} seguidas` : streak === 1 ? '1 certa' : 'Sequência 0'
  const answerCategory = CATEGORY_MAP[question.answer.category]

  const progressBar = (
    <div className="steps" aria-hidden="true">
      {Array.from({ length: ROUND_SIZE }, (_, step) => {
        const record = history[step]
        const cls = record
          ? record.right
            ? 'done is-right'
            : 'done is-wrong'
          : step === index
            ? 'now'
            : undefined
        return <i key={step} className={cls} />
      })}
    </div>
  )

  const statsBar = (
    <div className="quiz-stats">
      <button type="button" className="btn ghost tiny" onClick={() => setPhase('pick')}>
        <IconChevron direction="prev" size={14} />
        <span>Modos</span>
      </button>
      <span className="count">
        Pergunta <strong>{index + 1}</strong> de {ROUND_SIZE}
      </span>
      <span className="pill">
        <b>{score}</b> pts
      </span>
      <span className={streak > 1 ? 'pill hot' : 'pill'}>
        {streak > 1 ? <IconBolt size={13} /> : null}
        {streakText}
      </span>
    </div>
  )

  if (mode === 'find') {
    const findPromptContent = (
      <div className="find-prompt-inner">
        <div className="find-prompt-text">
          <span className="kicker">Caça ao elemento</span>
          <h3>{questionPrompt(question)}</h3>
        </div>
        {answered ? (
          <div className={wrongZ == null ? 'find-feedback right' : 'find-feedback wrong'}>
            <span>{live}</span>
            <div className="find-feedback-actions">
              <button type="button" className="btn ghost tiny" onClick={() => onOpen(question.answer.z)}>
                Ver ficha
              </button>
              <button type="button" className="btn primary tiny" ref={nextButton} onClick={next}>
                {index + 1 >= ROUND_SIZE ? 'Resultado' : 'Seguinte'}
              </button>
            </div>
          </div>
        ) : showHint ? (
          <p className="quiz-hint-pill">
            <IconLightbulb size={14} />
            <span>
              <strong>{answerCategory.label}</strong> · Período {question.answer.period}
            </span>
          </p>
        ) : (
          <button type="button" className="btn ghost tiny" onClick={() => setShowHint(true)}>
            <IconLightbulb size={14} />
            <span>Pista</span>
          </button>
        )}
      </div>
    )

    return (
      <section className="quiz quiz-find" aria-labelledby="titulo-pergunta">
        <h2 id="titulo-pergunta" className="sr-only">
          {questionPrompt(question)}
        </h2>
        <div className="quiz-find-bar">
          {statsBar}
          {progressBar}
        </div>
        <div className="find-mobile-prompt">{findPromptContent}</div>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        <div className="table-card quiz-table">
          <PeriodicTable
            elements={elements}
            tileStyle={look}
            animate={false}
            peek={<div className="peek peek-quiz">{findPromptContent}</div>}
            onOpen={(z) => {
              const chosen = elements.find((element) => element.z === z)
              if (!chosen) return
              answerWith(chosen, chosen.z === question.answer.z)
            }}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="quiz quiz-studio" aria-labelledby="titulo-pergunta">
      <div className="quiz-card">
        <div className="quiz-top">
          {statsBar}
          {progressBar}
        </div>

        <div className="quiz-prompt-stage">
          {mode === 'name' ? (
            <span
              className="quiz-hero-tile"
              aria-hidden="true"
              style={{ '--swatch': answerCategory.color } as CSSProperties}
            >
              {question.answer.symbol}
            </span>
          ) : null}
          <div className="quiz-prompt-copy">
            <h2 id="titulo-pergunta">{questionPrompt(question)}</h2>
            <p className="quiz-kbd-tip">Podes usar as teclas 1 a 4 no teclado.</p>
          </div>
        </div>

        <div className="choices" role="group" aria-label="Respostas">
          {question.options.map((option, optionIndex) => {
            const state =
              !answered ? '' : option.z === question.answer.z ? 'is-right' : option.z === picked ? 'is-wrong' : ''
            return (
              <button
                key={option.z}
                type="button"
                className={`choice ${state}`.trim()}
                disabled={answered}
                onClick={() => answerWith(option, option.z === question.answer.z)}
              >
                <kbd>{optionIndex + 1}</kbd>
                <span>{mode === 'symbol' ? option.symbol : option.name}</span>
              </button>
            )
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {live}
        </p>

        <div className="quiz-feedback-slot">
          {answered ? (
            <div className={wrongZ == null ? 'feedback right' : 'feedback wrong'}>
              <p>{live}</p>
              <div className="feedback-actions">
                <button type="button" className="btn ghost small" onClick={() => onOpen(question.answer.z)}>
                  Ver a ficha
                </button>
                <button type="button" className="btn primary small" ref={nextButton} onClick={next}>
                  {index + 1 >= ROUND_SIZE ? 'Ver resultado' : 'Seguinte'}
                </button>
              </div>
            </div>
          ) : (
            <p className="feedback-placeholder">Escolhe uma das quatro opções para avançar.</p>
          )}
        </div>
      </div>
    </section>
  )
}

/** Pequeno exemplo visual de cada jogo, para o cartão de escolha. */
function ModeDemo({ mode }: { mode: QuizMode }) {
  const chip = (text: string, color?: string, ask = false) => (
    <span className={ask ? 'demo-chip is-ask' : 'demo-chip'} style={color ? ({ '--swatch': color } as CSSProperties) : undefined}>
      {text}
    </span>
  )
  return (
    <div className="mode-demo" aria-hidden="true">
      {mode === 'symbol' ? (
        <>
          {chip('Oxigénio', CATEGORY_MAP.nonmetal.color)}
          <IconArrow size={15} />
          {chip('?', undefined, true)}
        </>
      ) : mode === 'name' ? (
        <>
          {chip('Fe', CATEGORY_MAP.transition.color)}
          <IconArrow size={15} />
          {chip('?', undefined, true)}
        </>
      ) : (
        <>
          {chip('Ouro', CATEGORY_MAP.alkaline.color)}
          <IconArrow size={15} />
          <span className="mini-grid">
            {Array.from({ length: 18 }, (_, cell) => (
              <i
                key={cell}
                className={cell === 11 ? 'hit' : undefined}
                style={cell === 11 ? ({ '--swatch': CATEGORY_MAP.alkaline.color } as CSSProperties) : undefined}
              />
            ))}
          </span>
        </>
      )}
    </div>
  )
}
