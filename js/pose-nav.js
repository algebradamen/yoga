/**
 * "Next" button inside each expanded exercise on a session page: closes the
 * current exercise, opens the next one (if it isn't already open) and
 * scrolls to it.
 */
(() => {
  const poses = [...document.querySelectorAll('details.pose-item')]

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-next-pose]')
    if (!btn) return
    const current = btn.closest('details.pose-item')
    const next = poses[poses.indexOf(current) + 1]
    if (!next) return

    current.open = false
    next.open = true
    // Wait for the layout to settle after collapsing, then bring the next exercise into view
    requestAnimationFrame(() => {
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches
      next.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
      next.querySelector('summary')?.focus({ preventScroll: true })
    })
  })
})()
