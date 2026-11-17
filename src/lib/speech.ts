export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakPt(text: string): boolean {
  if (!canSpeak()) return false
  const synth = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'pt-PT'
  utterance.rate = 0.92
  const voices = synth.getVoices()
  const voice =
    voices.find((item) => item.lang.toLowerCase() === 'pt-pt') ??
    voices.find((item) => item.lang.toLowerCase().startsWith('pt'))
  if (voice) utterance.voice = voice
  synth.cancel()
  synth.speak(utterance)
  return true
}

export function stopSpeech(): void {
  if (!canSpeak()) return
  window.speechSynthesis.cancel()
}
