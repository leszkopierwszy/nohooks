<template>
  <canvas
    ref="canvasEl"
    class="landing-dot-field pointer-events-none absolute inset-0 h-full w-full"
    aria-hidden="true"
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasEl = ref(null)

let raf = 0
let ctx = null
let width = 0
let height = 0
let dpr = 1
let reducedMotion = false
let dots = []
let t0 = 0

const GAP = 14
const BASE_R = 1.05

function rebuild() {
  const canvas = canvasEl.value
  if (!canvas || !ctx) return

  const parent = canvas.parentElement
  if (!parent) return

  const rect = parent.getBoundingClientRect()
  width = Math.max(1, Math.floor(rect.width))
  height = Math.max(1, Math.floor(rect.height))
  dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  dots = []
  const cols = Math.ceil(width / GAP) + 2
  const rows = Math.ceil(height / GAP) + 2
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * GAP - GAP
      const y = row * GAP - GAP
      // Soft right-side density bias (more “life” behind brand space)
      const nx = x / width
      const ny = y / height
      const density =
        0.35 +
        0.55 * Math.pow(nx, 1.15) +
        0.2 * Math.sin(nx * 4.2 + ny * 2.1) * Math.sin(ny * 5.5)
      if (Math.random() > Math.min(0.95, Math.max(0.08, density))) continue
      dots.push({
        x,
        y,
        phase: Math.random() * Math.PI * 2,
        amp: 4 + Math.random() * 10,
        speed: 0.35 + Math.random() * 0.55,
      })
    }
  }
}

function field(x, y, t) {
  // Layered sines ≈ organic wave / particle cloud motion
  const a =
    Math.sin(x * 0.012 + t * 0.55) * Math.cos(y * 0.01 - t * 0.4)
  const b = Math.sin((x + y) * 0.008 + t * 0.7)
  const c = Math.cos(x * 0.006 - y * 0.014 + t * 0.35)
  return {
    dx: a * 18 + b * 10,
    dy: b * 14 + c * 12,
    glow: 0.35 + 0.65 * (0.5 + 0.5 * a),
  }
}

function draw(now) {
  if (!ctx) return
  const t = (now - t0) * 0.001

  ctx.clearRect(0, 0, width, height)

  for (const d of dots) {
    const f = field(d.x, d.y, t * d.speed + d.phase * 0.15)
    const x = d.x + f.dx + Math.sin(t * d.speed + d.phase) * d.amp * 0.35
    const y = d.y + f.dy + Math.cos(t * d.speed * 0.85 + d.phase) * d.amp * 0.3
    const alpha = 0.05 + f.glow * 0.16
    const r = BASE_R + f.glow * 0.85

    ctx.beginPath()
    ctx.fillStyle = `rgba(107, 114, 128, ${alpha})`
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  if (!reducedMotion) {
    raf = requestAnimationFrame(draw)
  }
}

function drawStatic() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)
  for (const d of dots) {
    const f = field(d.x, d.y, 0.8)
    const alpha = 0.04 + f.glow * 0.12
    ctx.beginPath()
    ctx.fillStyle = `rgba(107, 114, 128, ${alpha})`
    ctx.arc(d.x + f.dx * 0.4, d.y + f.dy * 0.4, BASE_R + f.glow * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

let resizeObs = null

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  t0 = performance.now()
  rebuild()

  if (reducedMotion) {
    drawStatic()
  } else {
    raf = requestAnimationFrame(draw)
  }

  resizeObs = new ResizeObserver(() => {
    rebuild()
    if (reducedMotion) drawStatic()
  })
  if (canvas.parentElement) resizeObs.observe(canvas.parentElement)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  resizeObs?.disconnect()
  ctx = null
  dots = []
})
</script>
