/**
 * The Sesame isotipo: the only brand mark an app shows, never the wordmark.
 *
 * `SesameMark` draws it at `size` px square. `SesameLogo` is the same mark,
 * kept under its old name and `height` prop for the pages that already call it
 * (login, employee picker). The brand colour is fixed: don't recolour it with
 * `currentColor`.
 */

const BRAND_BLUE = '#415BFF'

/** The isotipo. Square; `size` is the edge in px. */
export function SesameMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34.036 34.036"
      fill="none"
      className={className}
      role="img"
      aria-label="Sesame"
    >
      <path
        d="M17.043,34.036a2.449,2.449,0,0,1-.637-.084l-8.6-2.305a6.673,6.673,0,0,1-4.705-4.705l-2.872-10.719a6.671,6.671,0,0,1,1.722-6.427l7.848-7.848a6.673,6.673,0,0,1,6.427-1.722l10.72,2.872a6.675,6.675,0,0,1,4.705,4.705l2.3,8.6a2.453,2.453,0,1,1-4.74,1.27l-2.305-8.6a1.754,1.754,0,0,0-1.236-1.236l-10.719-2.872a1.752,1.752,0,0,0-1.687.452l-7.848,7.848a1.752,1.752,0,0,0-.452,1.688l2.874,10.719a1.752,1.752,0,0,0,1.236,1.235l8.6,2.305a2.454,2.454,0,0,1-.635,4.824Z"
        fill={BRAND_BLUE}
      />
      <path
        d="M23.215,33.515a2.454,2.454,0,0,1-1.735-4.188l7.847-7.847a2.454,2.454,0,0,1,3.47,3.47l-7.847,7.847A2.445,2.445,0,0,1,23.215,33.515Z"
        fill={BRAND_BLUE}
      />
    </svg>
  )
}

/** The same isotipo, sized by `height` (it is square). */
export function SesameLogo({ height = 28, className }: { height?: number; className?: string }) {
  return <SesameMark size={height} className={className} />
}
