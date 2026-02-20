<template>
  <canvas ref="cvs" class="bh-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  phase: number        // 1-4
  mode: 'seal' | 'open'
  centerEl?: HTMLElement | null
}>()

const cvs = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let raf = 0
let W = 0, H = 0
let cx = 0, cy = 0
let particles: Particle[] = []
let fireworks: Particle[] = []
let capsule = { x: 0, y: 0, r: 28, alpha: 0, scale: 1, rotation: 0 }
let flashAlpha = 0
let crackAlpha = 0
let shockwaveR = 0, shockwaveAlpha = 0
let lastTime = 0
let phaseStartTime = 0

const COLORS = [
  [99, 179, 237],   // blue
  [147, 130, 220],  // purple
  [104, 211, 145],  // green
  [251, 191, 36],   // gold
  [129, 230, 217],  // cyan
  [236, 72, 153],   // pink
]

interface Particle {
  x: number; y: number
  angle: number; radius: number
  speed: number; angularSpeed: number
  size: number; alpha: number
  color: number[]
  life: number; maxLife: number
  vx: number; vy: number
  gravity: number
  trail: boolean
}

function createParticle(inward: boolean): Particle {
  const angle = Math.random() * Math.PI * 2
  const dist = inward
    ? 300 + Math.random() * 400
    : 5 + Math.random() * 20
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
    angle,
    radius: dist,
    speed: 0.3 + Math.random() * 0.6,
    angularSpeed: 0.02 + Math.random() * 0.03,
    size: 1 + Math.random() * 2.5,
    alpha: 0.3 + Math.random() * 0.7,
    color,
    life: 0,
    maxLife: 3000 + Math.random() * 4000,
    vx: 0, vy: 0,
    gravity: 0,
    trail: Math.random() > 0.6,
  }
}

function createFireworkParticle(ox: number, oy: number): Particle {
  const angle = Math.random() * Math.PI * 2
  const speed = 2 + Math.random() * 8
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  return {
    x: ox, y: oy,
    angle: 0, radius: 0,
    speed: 0, angularSpeed: 0,
    size: 1.5 + Math.random() * 3,
    alpha: 1,
    color,
    life: 0,
    maxLife: 1200 + Math.random() * 1500,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    gravity: 0.04 + Math.random() * 0.02,
    trail: true,
  }
}

function initParticles(count: number, inward: boolean) {
  particles = []
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(inward))
  }
}

function syncCenter() {
  if (props.centerEl) {
    const rect = props.centerEl.getBoundingClientRect()
    cx = rect.left + rect.width / 2
    cy = rect.top + rect.height / 2
  } else {
    cx = W / 2
    cy = H / 2 - 80
  }
}

function resize() {
  if (!cvs.value) return
  const dpr = window.devicePixelRatio || 1
  W = window.innerWidth
  H = window.innerHeight
  cvs.value.width = W * dpr
  cvs.value.height = H * dpr
  cvs.value.style.width = W + 'px'
  cvs.value.style.height = H + 'px'
  ctx = cvs.value.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  syncCenter()
}

function startPhase(phase: number) {
  phaseStartTime = performance.now()
  const m = props.mode

  if (m === 'seal') {
    if (phase === 1) {
      initParticles(250, true)
      capsule = { x: cx, y: -60, r: 28, alpha: 0, scale: 1, rotation: 0 }
      flashAlpha = 0
      shockwaveR = 0; shockwaveAlpha = 0
    } else if (phase === 2) {
      capsule.alpha = 1
    } else if (phase === 3) {
      flashAlpha = 1
      shockwaveR = 0; shockwaveAlpha = 1
    }
  } else {
    if (phase === 1) {
      particles = []
      crackAlpha = 0
      capsule = { x: cx, y: cy, r: 5, alpha: 0, scale: 0.2, rotation: 0 }
      flashAlpha = 0
      fireworks = []
    } else if (phase === 2) {
      initParticles(250, false)
      crackAlpha = 1
    } else if (phase === 3) {
      capsule.alpha = 1
    } else if (phase === 4) {
      for (let i = 0; i < 150; i++) {
        fireworks.push(createFireworkParticle(capsule.x, capsule.y))
      }
      capsule.alpha = 0
      flashAlpha = 0.8
    }
  }
}

function updateSeal(dt: number, elapsed: number) {
  const phase = props.phase
  const dtS = dt / 1000

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.life += dt

    if (phase >= 1 && phase <= 2) {
      const shrinkSpeed = phase === 2 ? 1.6 : 0.8
      p.radius -= p.speed * shrinkSpeed * (60 * dtS)
      p.angle += p.angularSpeed * (1 + (300 - Math.min(p.radius, 300)) / 100)
      p.x = cx + Math.cos(p.angle) * Math.max(p.radius, 0)
      p.y = cy + Math.sin(p.angle) * Math.max(p.radius, 0)

      if (p.radius <= 3) {
        particles[i] = createParticle(true)
      }
    } else if (phase === 3) {
      p.radius -= p.speed * 4 * (60 * dtS)
      p.angle += p.angularSpeed * 3
      p.x = cx + Math.cos(p.angle) * Math.max(p.radius, 0)
      p.y = cy + Math.sin(p.angle) * Math.max(p.radius, 0)
      p.alpha *= 0.97
      if (p.radius <= 0 || p.alpha < 0.01) {
        particles.splice(i, 1)
      }
    } else if (phase === 4) {
      p.alpha *= 0.96
      p.radius += 0.3
      p.angle += p.angularSpeed * 0.3
      p.x = cx + Math.cos(p.angle) * p.radius
      p.y = cy + Math.sin(p.angle) * p.radius
      if (p.alpha < 0.01) particles.splice(i, 1)
    }
  }

  if (phase === 2) {
    const t = Math.min(elapsed / 1500, 1)
    capsule.x = cx
    capsule.y = cy - 200 * (1 - t * t)
    capsule.alpha = t
    capsule.scale = Math.max(1 - t * 0.8, 0.2)
    capsule.rotation += 3 * dtS * (1 + t * 4)
  } else if (phase === 3) {
    capsule.scale *= 0.93
    capsule.alpha *= 0.92
    flashAlpha *= 0.96
    shockwaveR += 400 * dtS
    shockwaveAlpha *= 0.97
  } else if (phase === 4) {
    flashAlpha *= 0.95
    shockwaveAlpha *= 0.96
  }
}

function updateOpen(dt: number, elapsed: number) {
  const phase = props.phase
  const dtS = dt / 1000

  if (phase === 1) {
    crackAlpha = Math.min(crackAlpha + 0.8 * dtS, 1)
  }

  if (phase >= 2) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life += dt
      const expandSpeed = phase === 3 ? 1.8 : 1.0
      p.radius += p.speed * expandSpeed * (60 * dtS)
      p.angle -= p.angularSpeed * (1 + p.radius / 200)
      p.x = cx + Math.cos(p.angle) * p.radius
      p.y = cy + Math.sin(p.angle) * p.radius

      if (p.radius > Math.max(W, H) * 0.8) {
        if (phase < 4) {
          particles[i] = createParticle(false)
        } else {
          p.alpha *= 0.95
          if (p.alpha < 0.02) particles.splice(i, 1)
        }
      }
    }
  }

  if (phase === 3) {
    const t = Math.min(elapsed / 1800, 1)
    capsule.x = cx
    capsule.y = cy
    capsule.alpha = t
    capsule.scale = 0.2 + t * 0.9
    capsule.rotation -= 4 * dtS
    crackAlpha *= 0.97
  }

  if (phase === 4) {
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const p = fireworks[i]
      p.life += dt
      p.vx *= 0.985
      p.vy *= 0.985
      p.vy += p.gravity
      p.x += p.vx
      p.y += p.vy
      const lifeRatio = p.life / p.maxLife
      p.alpha = Math.max(1 - lifeRatio, 0)
      p.size *= 0.998
      if (p.life >= p.maxLife) fireworks.splice(i, 1)
    }
    flashAlpha *= 0.94
  }
}

function drawBlackhole() {
  if (!ctx) return
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80)
  grad.addColorStop(0, 'rgba(0,0,0,0.95)')
  grad.addColorStop(0.5, 'rgba(10,5,30,0.7)')
  grad.addColorStop(0.8, 'rgba(99,179,237,0.08)')
  grad.addColorStop(1, 'rgba(99,179,237,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, 80, 0, Math.PI * 2)
  ctx.fill()

  const ring = ctx.createRadialGradient(cx, cy, 55, cx, cy, 75)
  ring.addColorStop(0, 'rgba(99,179,237,0)')
  ring.addColorStop(0.5, 'rgba(147,130,220,0.12)')
  ring.addColorStop(1, 'rgba(99,179,237,0)')
  ctx.fillStyle = ring
  ctx.beginPath()
  ctx.arc(cx, cy, 75, 0, Math.PI * 2)
  ctx.fill()
}

function drawParticle(p: Particle) {
  if (!ctx || p.alpha <= 0) return
  const [r, g, b] = p.color
  ctx.globalAlpha = p.alpha

  if (p.trail && p.radius > 10) {
    const tailLen = Math.min(p.size * 4, 12)
    const tx = p.x + Math.cos(p.angle + Math.PI) * tailLen
    const ty = p.y + Math.sin(p.angle + Math.PI) * tailLen
    const tGrad = ctx.createLinearGradient(p.x, p.y, tx, ty)
    tGrad.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.6})`)
    tGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.strokeStyle = tGrad
    ctx.lineWidth = p.size * 0.5
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }

  ctx.fillStyle = `rgba(${r},${g},${b},${p.alpha})`
  ctx.shadowColor = `rgba(${r},${g},${b},0.6)`
  ctx.shadowBlur = p.size * 3
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

function drawCapsule() {
  if (!ctx || capsule.alpha <= 0) return
  ctx.save()
  ctx.translate(capsule.x, capsule.y)
  ctx.rotate(capsule.rotation)
  ctx.scale(capsule.scale, capsule.scale)
  ctx.globalAlpha = capsule.alpha

  const r = capsule.r
  const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(0.3, 'rgba(147,130,220,0.7)')
  grad.addColorStop(0.7, 'rgba(99,179,237,0.5)')
  grad.addColorStop(1, 'rgba(99,179,237,0.1)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = `rgba(129,230,217,${capsule.alpha * 0.6})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, r + 4, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = `rgba(147,130,220,${capsule.alpha * 0.3})`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, r + 10, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 1
  ctx.restore()
}

function drawFlash() {
  if (!ctx || flashAlpha <= 0.01) return
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300)
  grad.addColorStop(0, `rgba(255,255,255,${flashAlpha})`)
  grad.addColorStop(0.2, `rgba(129,230,217,${flashAlpha * 0.6})`)
  grad.addColorStop(1, `rgba(99,179,237,0)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, 300, 0, Math.PI * 2)
  ctx.fill()
}

function drawShockwave() {
  if (!ctx || shockwaveAlpha <= 0.01) return
  ctx.strokeStyle = `rgba(129,230,217,${shockwaveAlpha * 0.5})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, shockwaveR, 0, Math.PI * 2)
  ctx.stroke()
}

function drawCracks() {
  if (!ctx || crackAlpha <= 0.01) return
  ctx.save()
  ctx.globalAlpha = crackAlpha
  const numCracks = 6
  for (let i = 0; i < numCracks; i++) {
    const a = (Math.PI * 2 / numCracks) * i + 0.3
    const len = 30 + Math.random() * 20
    ctx.strokeStyle = `rgba(255,255,255,${crackAlpha * 0.8})`
    ctx.shadowColor = 'rgba(129,230,217,0.8)'
    ctx.shadowBlur = 8
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
  ctx.restore()
}

function drawFireworks() {
  if (!ctx) return
  for (const p of fireworks) {
    drawParticle(p)
  }
}

function animate(time: number) {
  if (!ctx) { raf = requestAnimationFrame(animate); return }
  const dt = lastTime ? Math.min(time - lastTime, 50) : 16
  lastTime = time
  const elapsed = time - phaseStartTime

  syncCenter()
  ctx.clearRect(0, 0, W, H)

  if (props.mode === 'seal') {
    updateSeal(dt, elapsed)
  } else {
    updateOpen(dt, elapsed)
  }

  for (const p of particles) drawParticle(p)
  drawFlash()
  drawShockwave()
  if (props.mode === 'open') {
    drawFireworks()
  }

  raf = requestAnimationFrame(animate)
}

watch(() => props.phase, (val) => {
  if (val > 0) startPhase(val)
})

watch(() => props.mode, () => {
  particles = []
  fireworks = []
  flashAlpha = 0
  crackAlpha = 0
  shockwaveR = 0
  shockwaveAlpha = 0
})

onMounted(() => {
  resize()
  window.addEventListener('resize', resize)
  raf = requestAnimationFrame(animate)
  if (props.phase > 0) startPhase(props.phase)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
})
</script>

<style scoped>
.bh-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
</style>
