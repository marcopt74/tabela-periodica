import { PHASE_LABEL } from '../data/categories.ts'
import type { Element, Phase } from '../data/types.ts'

export const ROOM_C = 20

export function stateAt(element: Element, celsius: number): Phase {
  if (element.symbol === 'He') {
    if (element.boilC == null) return 'unknown'
    return celsius >= element.boilC ? 'gas' : 'liquid'
  }

  if (element.sublimes) {
    const point = element.boilC ?? element.meltC
    if (point == null) return 'unknown'
    return celsius >= point ? 'gas' : 'solid'
  }

  const { meltC, boilC } = element
  if (meltC == null && boilC == null) return 'unknown'
  if (boilC != null && celsius >= boilC) return 'gas'
  if (meltC != null && celsius < meltC) return 'solid'
  if (meltC != null && (boilC == null || celsius < boilC)) return 'liquid'
  return 'unknown'
}

export function phaseLabel(phase: Phase): string {
  return PHASE_LABEL[phase]
}

export function roomStateShort(element: Element): string {
  const phase = stateAt(element, ROOM_C)
  if (element.tempsEstimated) {
    if (phase === 'unknown') return 'Desconhecido'
    return `Previsto: ${phaseLabel(phase).toLowerCase()}`
  }
  if (phase === 'unknown') return 'Desconhecido'
  return phaseLabel(phase)
}

export function roomStateLong(element: Element): string {
  const phase = stateAt(element, ROOM_C)
  if (element.tempsEstimated) {
    if (phase === 'unknown') {
      return 'Ainda não se sabe. Estes átomos duram tão pouco que não há uma amostra para medir.'
    }
    return `Os cientistas preveem que seja ${phaseLabel(phase).toLowerCase()} a 20 °C. Ainda não há uma amostra estável para confirmar.`
  }
  if (element.sublimes && phase === 'solid') {
    return 'Sólido a 20 °C. Se aquecer muito, passa direto a gás, sem ficar líquido.'
  }
  if (phase === 'unknown') return 'Não há dados seguros sobre o estado a 20 °C.'
  return `${phaseLabel(phase)} a 20 °C.`
}

export function sliderToCelsius(value: number): number {
  const slider = Math.min(1000, Math.max(0, value))
  if (slider <= 400) return -220 + (slider / 400) * 320
  if (slider <= 700) return 100 + ((slider - 400) / 300) * 900
  return 1000 + ((slider - 700) / 300) * 5000
}

export function celsiusToSlider(celsius: number): number {
  if (celsius <= 100) return ((celsius + 220) / 320) * 400
  if (celsius <= 1000) return 400 + ((celsius - 100) / 900) * 300
  return 700 + ((Math.min(celsius, 6000) - 1000) / 5000) * 300
}

export function temperatureNickname(celsius: number): string {
  const t = Math.round(celsius)
  if (t <= -180) return 'Tão frio como o ar líquido'
  if (t <= -10) return 'Dentro do congelador'
  if (t < 15) return 'Um dia de inverno'
  if (t <= 28) return 'Temperatura da sala'
  if (t < 90) return 'Uma chávena quente'
  if (t <= 110) return 'Água a ferver'
  if (t < 400) return 'Calor de um forno'
  if (t < 900) return 'Um incêndio forte'
  if (t < 1400) return 'Lava de um vulcão'
  if (t < 2000) return 'Ferro derretido'
  if (t < 4000) return 'Mais quente que uma fornalha'
  return 'Quase a superfície do Sol'
}

export const TEMP_PRESETS = [
  { id: 'ar', label: 'Ar líquido', celsius: -196 },
  { id: 'gelo', label: 'Congelador', celsius: -18 },
  { id: 'sala', label: 'Sala', celsius: 20 },
  { id: 'ferver', label: 'A ferver', celsius: 100 },
  { id: 'forno', label: 'Forno', celsius: 220 },
  { id: 'lava', label: 'Lava', celsius: 1100 },
  { id: 'sol', label: 'Sol', celsius: 5500 },
] as const
