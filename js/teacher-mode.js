/**
 * Teacher mode for session pages: shows one exercise at a time in a
 * large, distraction-free layout with floating Prev / Up / Next buttons.
 *
 * - The Play button ([data-teach-start]) opens the first exercise.
 * - The current exercise is kept in the URL (#play-3), so reloading, sharing
 *   the link and the browser's Back button all behave as expected.
 * - Up (or Escape) returns to the overview, scrolled to the current exercise.
 * - Arrow keys / Page Up / Page Down move between exercises.
 * - While teaching, the screen is kept awake where the browser supports it.
 */
(() => {
  const startBtn = document.querySelector('[data-teach-start]')
  const bar = document.querySelector('.teach-bar')
  const controls = document.querySelector('.teach-controls')
  const poses = [...document.querySelectorAll('details.pose-item')]
  if (!startBtn || !bar || !controls || poses.length === 0) return

  const [prevBtn, upBtn, nextBtn] = ['prev', 'up', 'next'].map(k => controls.querySelector(`[data-teach="${k}"]`))
  const sectionEl = bar.querySelector('.teach-section')
  const posEl = bar.querySelector('.teach-pos')

  // The section heading (if any) that each exercise belongs to
  const sections = poses.map(p => {
    let el = p.previousElementSibling
    while (el && !el.classList.contains('pose-section')) el = el.previousElementSibling
    return el ? el.textContent.trim() : ''
  })

  let current = -1        // index of the exercise shown, -1 when not teaching
  let wasOpen = false     // whether the current <details> was open before we opened it
  let pushedEntry = false // whether we added the history entry that Up should go back past
  let wakeLock = null

  const indexFromHash = () => {
    const m = location.hash.match(/^#play-(\d+)$/)
    return m ? Math.min(Math.max(Number(m[1]), 1), poses.length) - 1 : -1
  }

  const setHash = (i, push = false) => {
    const url = i < 0 ? location.pathname + location.search : `#play-${i + 1}`
    history[push ? 'pushState' : 'replaceState'](null, '', url)
  }

  async function keepAwake() {
    try { wakeLock = await navigator.wakeLock?.request('screen') } catch { wakeLock = null }
  }
  function allowSleep() {
    wakeLock?.release().catch(() => {})
    wakeLock = null
  }

  function show(i) {
    if (i === current) return
    if (current >= 0) {
      poses[current].open = wasOpen
      poses[current].classList.remove('teach-current')
    }
    current = i
    const pose = poses[i]
    wasOpen = pose.open
    pose.open = true
    pose.classList.add('teach-current')

    const duration = pose.querySelector('.duration-cell')?.textContent.trim()
    sectionEl.textContent = sections[i]
    posEl.textContent = `${i + 1} / ${poses.length}${duration ? ` · ${duration}` : ''}`
    prevBtn.disabled = i === 0
    nextBtn.disabled = i === poses.length - 1
    window.scrollTo(0, 0)
  }

  function enter(i) {
    document.body.classList.add('teaching')
    bar.hidden = false
    controls.hidden = false
    show(i)
    keepAwake()
  }

  function exit() {
    if (current < 0) return
    const pose = poses[current]
    pose.classList.remove('teach-current') // leave it open in the overview
    current = -1
    document.body.classList.remove('teaching')
    bar.hidden = true
    controls.hidden = true
    allowSleep()
    requestAnimationFrame(() => pose.scrollIntoView({ block: 'start' }))
  }

  function sync() {
    const i = indexFromHash()
    if (i < 0) exit()
    else if (current < 0) enter(i)
    else show(i)
  }

  const go = step => {
    const i = current + step
    if (current < 0 || i < 0 || i >= poses.length) return
    setHash(i)
    sync()
  }

  const up = () => {
    if (current < 0) return
    if (pushedEntry) {
      pushedEntry = false
      history.back() // triggers popstate → sync → exit
    } else {
      setHash(-1)
      sync()
    }
  }

  startBtn.addEventListener('click', () => {
    pushedEntry = true
    setHash(0, true)
    sync()
  })
  prevBtn.addEventListener('click', () => go(-1))
  nextBtn.addEventListener('click', () => go(1))
  upBtn.addEventListener('click', up)

  addEventListener('popstate', () => { pushedEntry = false; sync() })
  addEventListener('hashchange', sync)

  addEventListener('keydown', e => {
    if (current < 0 || e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { go(1); e.preventDefault() }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { go(-1); e.preventDefault() }
    else if (e.key === 'Escape') { up(); e.preventDefault() }
  })

  // Browsers drop the wake lock when the tab is hidden; take it again on return
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && current >= 0) keepAwake()
  })

  sync() // support opening a #play-N link directly
})()
