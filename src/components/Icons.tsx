type IconProps = { size?: number }

export function IconClose({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function IconSpeaker({ size = 20 }: IconProps) {
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

export function IconSearch({ size = 19 }: IconProps) {
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

export function IconArrow({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconGrid({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="4" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="3" y="10.2" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="9.75" y="10.2" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="10.2" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="3" y="16.4" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="9.75" y="16.4" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="16.4" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
    </svg>
  )
}

export function IconBolt({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2.8L5.5 13.4h5.3L9.8 21.2l8.7-11.2h-5.4z" fill="currentColor" />
    </svg>
  )
}

export function IconMedal({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 3h9l-2 6h-5l-2-6z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="14.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="14.5" r="2" fill="currentColor" />
    </svg>
  )
}

export function IconSparkles({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"
        fill="currentColor"
      />
    </svg>
  )
}

export function IconSun({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.1" />
      <path
        d="M12 2.8v2.2M12 19v2.2M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.8 12H5M19 12h2.2M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconMoon({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.2 14.8A8.3 8.3 0 0 1 9.2 3.8a8.5 8.5 0 1 0 11 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconThermometer({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 13.7V5.5a2 2 0 1 0-4 0v8.2a3.8 3.8 0 1 0 4 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1.7" fill="currentColor" />
      <path d="M12 15.5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconLightbulb({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 18h6M10 21h4M12 3a6.5 6.5 0 0 0-3.8 11.8c.6.5 1.1 1.2 1.2 2h5.2c.1-.8.6-1.5 1.2-2A6.5 6.5 0 0 0 12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconCompass({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15.4 8.6l-2.1 5.3-5.3 2.1 2.1-5.3 5.3-2.1z" fill="currentColor" />
    </svg>
  )
}

export function IconPause({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1.4" fill="currentColor" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1.4" fill="currentColor" />
    </svg>
  )
}

export function IconPlay({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.8l12.5 7.2L7 19.2V4.8z" fill="currentColor" />
    </svg>
  )
}

export function IconCheck({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
