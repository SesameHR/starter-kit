'use client'

import { useEffect, useRef, useState } from 'react'

const BOX_CLASS =
  'box-border h-14 w-11 rounded-2xl border bg-background text-center text-xl font-semibold text-foreground outline-none transition-colors hover:border-ring/40 focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60'

/**
 * Segmented one-time-code input (3-3 groups separated by a dash).
 *
 * Auto-advances between boxes, supports pasting a full code, and auto-submits
 * the surrounding form once all digits are present. The concatenated code is
 * exposed to the form through a hidden input under `name`.
 */
export function OtpInput({
  name,
  length = 6,
  disabled = false,
  invalid = false,
  digitLabel,
}: {
  name: string
  length?: number
  disabled?: boolean
  invalid?: boolean
  /** Accessible label for each box, given its 1-based position. */
  digitLabel: (position: number) => string
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(''))
  const boxesRef = useRef<(HTMLInputElement | null)[]>([])
  const autoSubmittedRef = useRef(false)

  const code = digits.join('')

  // Auto-submit once per completed code (re-arms when the user edits again)
  useEffect(() => {
    if (code.length === length && !autoSubmittedRef.current && !disabled) {
      autoSubmittedRef.current = true
      boxesRef.current[0]?.form?.requestSubmit()
    }
    if (code.length < length) {
      autoSubmittedRef.current = false
    }
  }, [code, length, disabled])

  const setDigit = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < length - 1) {
      boxesRef.current[index + 1]?.focus()
    }
  }

  const onKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      boxesRef.current[index - 1]?.focus()
    }
  }

  const onPaste = (event: React.ClipboardEvent) => {
    event.preventDefault()

    const chars = event.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, length)
      .split('')
    if (!chars.length) return

    setDigits(Array.from({ length }, (_, i) => chars[i] ?? ''))
    boxesRef.current[Math.min(chars.length, length - 1)]?.focus()
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <input type="hidden" name={name} value={code} />
      {digits.map((digit, i) => (
        <span key={i} className="contents">
          {i === Math.ceil(length / 2) && (
            <span className="select-none px-1 text-2xl text-muted-foreground" aria-hidden>
              -
            </span>
          )}
          <input
            ref={(el) => {
              boxesRef.current[i] = el
            }}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            disabled={disabled}
            autoFocus={i === 0}
            aria-label={digitLabel(i + 1)}
            aria-invalid={invalid || undefined}
            className={`${BOX_CLASS} ${invalid ? 'border-destructive/60' : 'border-input'}`}
          />
        </span>
      ))}
    </div>
  )
}
