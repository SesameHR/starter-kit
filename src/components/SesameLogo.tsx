/** Sesame isotipo: an open hexagonal ring in navy with one mint segment (bottom-right). */
export function SesameMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role="img"
      aria-label="Sesame"
    >
      <path d="M12 3.6 19.27 7.8 19.27 16.2" stroke="#1F2D52" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.27 16.2 12 20.4" stroke="#5EBEA3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20.4 4.73 16.2 4.73 7.8" stroke="#1F2D52" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
