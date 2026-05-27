import React from 'react'

type IconName =
  | 'arrow' | 'arrowUp' | 'arrowLeft' | 'enter' | 'plus' | 'check' | 'spark'
  | 'camera' | 'photo' | 'pin' | 'clock' | 'eye' | 'share' | 'shareUp'
  | 'download' | 'chevron' | 'chevronDown' | 'close' | 'info' | 'search'
  | 'facebook' | 'whatsapp' | 'telegram' | 'chat' | 'paw' | 'bolt' | 'sparkle'
  | 'layers' | 'activity' | 'radio' | 'globe' | 'sliders' | 'trending' | 'users'
  | 'map'

const PATHS: Record<IconName, React.ReactNode> = {
  arrow:      <path d="M5 12h14M13 6l6 6-6 6"/>,
  arrowUp:    <path d="M5 12 12 5l7 7M12 19V5"/>,
  arrowLeft:  <path d="M19 12H5M11 6l-6 6 6 6"/>,
  enter:      <path d="M9 10v3a1 1 0 0 0 1 1h9m0 0-3-3m3 3-3 3M4 6h3"/>,
  plus:       <path d="M12 5v14M5 12h14"/>,
  check:      <polyline points="4 12.5 9 17.5 20 6.5"/>,
  spark:      <path d="M12 3 13.6 9.4 20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3z"/>,
  camera:     <g><path d="M3 8h3l2-3h8l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/></g>,
  photo:      <g><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m3 17 5-5 5 5 3-3 5 5"/></g>,
  pin:        <g><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></g>,
  clock:      <g><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></g>,
  eye:        <g><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></g>,
  share:      <g><circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m9 11 7-4M9 13l7 4"/></g>,
  shareUp:    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14"/>,
  download:   <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>,
  chevron:    <path d="m9 6 6 6-6 6"/>,
  chevronDown:<path d="m6 9 6 6 6-6"/>,
  close:      <path d="M6 6l12 12M6 18 18 6"/>,
  info:       <g><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 8v.5"/></g>,
  search:     <g><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g>,
  facebook:   <path d="M15 8h-2a1 1 0 0 0-1 1v3h3l-1 4h-2v6h-4v-6H6v-4h2V8a4 4 0 0 1 4-4h3z"/>,
  whatsapp:   <g><path d="M20.5 12a8.5 8.5 0 1 1-15.7-4.5L3.5 12.5l4.7-1.2A8.5 8.5 0 0 1 20.5 12z"/></g>,
  telegram:   <path d="m22 3-3 18-7-7-4 4v-5l11-10-13 8L2 9z"/>,
  chat:       <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>,
  paw:        <g><circle cx="6.5" cy="11" r="2"/><circle cx="17.5" cy="11" r="2"/><circle cx="9" cy="6.5" r="2"/><circle cx="15" cy="6.5" r="2"/><path d="M7 17c0-3 2-5 5-5s5 2 5 5-2 3-5 3-5 0-5-3z"/></g>,
  bolt:       <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>,
  sparkle:    <g><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/><path d="M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M5.6 18.4l4.2-4.2M14.2 9.8l4.2-4.2"/></g>,
  layers:     <g><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></g>,
  activity:   <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
  radio:      <g><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 7.8a6 6 0 0 0 0 8.4M19 5a10 10 0 0 1 0 14M5 5a10 10 0 0 0 0 14"/></g>,
  globe:      <g><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></g>,
  sliders:    <g><path d="M4 8h12M20 8h0M4 16h4M12 16h8"/><circle cx="18" cy="8" r="2"/><circle cx="10" cy="16" r="2"/></g>,
  trending:   <path d="m23 6-9.5 9.5-5-5L1 18M17 6h6v6"/>,
  users:      <g><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M22 21a6 6 0 0 0-6-6"/><circle cx="17" cy="9" r="3"/></g>,
  map:        <g><path d="m1 6 7-3 8 3 7-3v15l-7 3-8-3-7 3z"/><path d="M8 3v15M16 6v15"/></g>,
}

interface IconProps {
  name: IconName
  size?: number
  color?: string
  sw?: number
}

export function Icon({ name, size = 16, color = 'currentColor', sw = 1.5 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  )
}
