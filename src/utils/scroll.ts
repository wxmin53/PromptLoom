export function scrollToRef(ref: React.RefObject<HTMLElement | null>, hasScrolled: React.MutableRefObject<boolean>): void {
  if (hasScrolled.current) return
  hasScrolled.current = true
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 50)
}

export function scrollToRefAlways(ref: React.RefObject<HTMLElement | null>): void {
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 50)
}
