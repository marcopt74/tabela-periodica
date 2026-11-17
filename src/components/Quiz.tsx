import { useMemo, useRef, useState } from 'react'
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
import { IconStar } from './Icons.tsx'
import { PeriodicTable, type TileLook } from './PeriodicTable.tsx'

type Phase = 'pick' | 'play' | 'results'

const MODES: { id: QuizMode; title: string; text: string }[] = [
  { id: 'symbol', title: 'Do nome ao símbolo', text: 'Mostramos o nome. Tu escolhes o símbolo.' },
  { id: 'name', title: 'Do símbolo ao nome', text: 'Mostramos o símbolo. Tu escolhes o nome.' },
  { id: 'find', title: 'Caça ao elemento', text: 'O nome aparece. Tu encontras o elemento na tabela.' },
]

type Props = {
  elements: readonly Element[]
  onFinish: (result: RoundResult) => void
  onDiscover: (z: number) => void
  onOpen: (z: number) => void
}

export function Quiz({ elements, onFinish, onDiscover, onOpen }: Props) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [mode, setMode] = useState<QuizMode>('symbol')
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [used, setUsed] = useState<Set<number>>(() => new Set())
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrongZ, setWrongZ] = useState<number | null>(null)
  const [live, setLive] = useState('')
  const rng = useRef(mulberry32(1))
  const finished = useRef(false)

  function start(nextMode: QuizMode) {
    rng.current = mulberry32((Date.now() ^ Math.floor(Math.random() * 100000)) >>> 0)
    const first = createQuestion(nextMode, elements, rng.current, new Set())
    setMode(nextMode)
    setIndex(0)
    setQuestion(first)
    setUsed(new Set([first.answer.z]))
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setCorrect(0)
    setPicked(null)
    setWrongZ(null)
    setLive('')
    finished.current = false
    setPhase('play')
  }

  function answerWith(chosen: Element | null, right: boolean) {
    if (!question || picked != null) return
    const gained = right ? scoreCorrect(streak) : { points: 0, streak: 0 }
    const nextScore = score + gained.points
    const nextCorrect = correct + (right ? 1 : 0)
    const nextBest = Math.max(bestStreak, gained.streak)
    setPicked(chosen?.z ?? question.answer.z)
    setWrongZ(!right && chosen ? chosen.z : null)
    setScore(nextScore)
    setStreak(gained.streak)
    setBestStreak(nextBest)
    setCorrect(nextCorrect)
    onDiscover(question.answer.z)
    const prompt = right
      ? `Certo! ${question.answer.name} é ${question.answer.symbol}.`
      : `Ainda não. ${question.answer.name} é ${question.answer.symbol}.`
    setLive(prompt)
  }

  function next() {
    if (!question) return
    if (index + 1 >= ROUND_SIZE) {
      if (finished.current) return
      finished.current = true
      const stars = starsFor(correct, ROUND_SIZE)
      onFinish({ score, bestStreak, correct, total: ROUND_SIZE, stars })
      setPhase('results')
      return
    }
    const following = createQuestion(mode, elements, rng.current, used)
    setUsed((current) => new Set(current).add(following.answer.z))
    setQuestion(following)
    setIndex((value) => value + 1)
    setPicked(null)
    setWrongZ(null)
    setLive('')
  }

  const resultStars = starsFor(correct, ROUND_SIZE)
  const look = useMemo(() => {
    return (element: Element): TileLook => ({
      swatch: CATEGORY_MAP[element.category].color,
      estimated: false,
      dim: false,
      match: picked != null && question != null && element.category === question.answer.category,
      pulse: picked != null && question != null && element.z === question.answer.z,
      shake: wrongZ === element.z,
    })
  }, [picked, question, wrongZ])

  if (phase === 'pick') {
    return (
      <section className="quiz" aria-labelledby="titulo-desafio">
        <h2 id="titulo-desafio">Desafio</h2>
        <p className="lede">Escolhe um jogo. São 8 perguntas, com pontos e uma sequência se acertares de seguida.</p>
        <div className="mode-grid">
          {MODES.map((item) => (
            <button key={item.id} type="button" className="mode-card" onClick={() => start(item.id)}>
              <span>{item.title}</span>
              <small>{item.text}</small>
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
    return (
      <section className="quiz" aria-labelledby="titulo-resultado">
        <h2 id="titulo-resultado">Resultado</h2>
        <div className="results">
          <p className="stars" aria-label={starsLabel(resultStars)}>
            {[1, 2, 3].map((star) => (
              <IconStar key={star} filled={star <= resultStars} />
            ))}
          </p>
          <p className="score-line">
            Acertaste {correct} em {ROUND_SIZE}.
          </p>
          <p>{message}</p>
          <p>
            Pontos: <strong>{score}</strong> · melhor sequência: <strong>{bestStreak}</strong>
          </p>
          <div className="dialog-actions">
            <button type="button" onClick={() => start(mode)}>
              Outra ronda
            </button>
            <button type="button" className="ghost" onClick={() => setPhase('pick')}>
              Escolher outro jogo
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!question) return null
  const answered = picked != null

  return (
    <section className="quiz" aria-labelledby="titulo-pergunta">
      <div className="quiz-banner">
        <p className="q-meta">
          <span>
            Pergunta {index + 1} de {ROUND_SIZE}
          </span>
          <span>{score} pontos</span>
          <span>{streak > 1 ? `${streak} certas de seguida` : streak === 1 ? '1 certa' : 'Sequência: 0'}</span>
        </p>
        <h2 id="titulo-pergunta">{questionPrompt(question)}</h2>
        <p className="sr-only" aria-live="polite">
          {live}
        </p>
        {answered ? (
          <div className="feedback">
            <p>{live}</p>
            <div className="dialog-actions">
              <button type="button" className="ghost" onClick={() => onOpen(question.answer.z)}>
                Ver a ficha
              </button>
              <button type="button" onClick={next}>
                {index + 1 >= ROUND_SIZE ? 'Ver resultado' : 'Seguinte'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {mode === 'find' ? (
        <PeriodicTable elements={elements} tileStyle={look} onOpen={(z) => {
          const chosen = elements.find((element) => element.z === z)
          if (!chosen) return
          answerWith(chosen, chosen.z === question.answer.z)
        }} />
      ) : (
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
                <small>{optionIndex + 1}</small>
                <span>{mode === 'symbol' ? option.symbol : option.name}</span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
