type IconProps = { size?: number }

export function IconClose({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function IconSpeaker({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h3.2L11 6.5v11L7.2 14H4v-4z" fill="currentColor" />
      <path d="M14.5 8.5a4.5 4.5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconStar({ filled = false, size = 28 }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3.2l2.4 5.2 5.7.7-4.2 3.9 1.1 5.6L12 15.8 7 18.6l1.1-5.6L3.9 9.1l5.7-.7L12 3.2z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconSearch({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function IconChevron({ direction, size = 16 }: IconProps & { direction: 'prev' | 'next' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconArrow({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
