<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const props = withDefaults(defineProps<{ full?: boolean }>(), { full: false })

interface BurstParticle {
  id: number; size: number; color: string; tx: number; ty: number
  dur: number; delay: number; glow: number
}
interface FlyingDot {
  id: number; color: string; fx: number; fy: number; dur: number; delay: number
}
interface EnergyRing {
  id: number; color: string; dur: number; delay: number
}
interface WarpLine {
  id: number; h: number; x: number; color: string; dur: number; delay: number
}
interface NebulaWave {
  id: number; color: string; dur: number; delay: number
}
interface DistortionRing {
  id: number; size: number; delay: number
}
interface BgStar {
  id: number; left: string; top: string; size: number; opacity: number
}
interface StarTrail {
  id: number; w: number; startY: number; endY: number; angle: number
  color: string; dur: number
}

const pColors = [
  'rgba(147,197,253,1)', 'rgba(99,179,237,1)',
  'rgba(118,228,247,1)', 'rgba(183,148,244,1)', 'rgba(246,135,179,1)'
]
const ringColors = [
  'rgba(147,197,253,0.6)', 'rgba(59,130,246,0.5)',
  'rgba(118,228,247,0.5)', 'rgba(183,148,244,0.4)'
]
const trailColors = [
  'rgba(147,197,253,0.8)', 'rgba(99,179,237,0.7)',
  'rgba(118,228,247,0.7)', 'rgba(183,148,244,0.6)'
]
const warpColors = [
  'rgba(147,197,253,0.4)', 'rgba(99,179,237,0.35)', 'rgba(118,228,247,0.4)'
]
const waveColors = [
  'rgba(99,102,241,0.25)', 'rgba(139,92,246,0.22)',
  'rgba(59,130,246,0.2)', 'rgba(118,228,247,0.18)'
]
const dotColors = [
  'rgba(147,197,253,1)', 'rgba(99,179,237,1)',
  'rgba(118,228,247,1)', 'rgba(183,148,244,1)'
]

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

const burstParticles = ref<BurstParticle[]>([])
const flyingDots = ref<FlyingDot[]>([])
const energyRings = ref<EnergyRing[]>([])
const warpLines = ref<WarpLine[]>([])
const nebulaWaves = ref<NebulaWave[]>([])
const distortionRings = ref<DistortionRing[]>([])
const bgStars = ref<BgStar[]>([])
const starTrails = ref<StarTrail[]>([])

let trailTimer: ReturnType<typeof setInterval> | null = null
let trailId = 0

onMounted(() => {
  // Background stars — always rendered
  for (let i = 0; i < 150; i++) {
    bgStars.value.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      opacity: 0.2 + Math.random() * 0.4
    })
  }

  if (!props.full) return

  // ── Everything below: full cosmic burst mode only ──

  for (let i = 0; i < 8; i++) {
    energyRings.value.push({
      id: i, color: ringColors[i % ringColors.length],
      dur: 4 + i * 0.3, delay: i * 0.5
    })
  }

  for (let i = 0; i < 200; i++) {
    const angle = (Math.PI * 2 * i) / 200
    const dist = 600 + Math.random() * 400
    const size = 2 + Math.random() * 3
    burstParticles.value.push({
      id: i, size, color: pick(pColors),
      tx: Math.cos(angle) * dist, ty: Math.sin(angle) * dist,
      dur: 2.5 + Math.random() * 2, delay: Math.random() * 3,
      glow: size * 2
    })
  }

  for (let i = 0; i < 30; i++) {
    warpLines.value.push({
      id: i, h: 100 + Math.random() * 150,
      x: Math.random() * window.innerWidth,
      color: pick(warpColors),
      dur: 1 + Math.random() * 1.5, delay: Math.random() * 3
    })
  }

  for (let i = 0; i < 6; i++) {
    nebulaWaves.value.push({
      id: i, color: waveColors[i % waveColors.length],
      dur: 5 + i * 0.5, delay: i * 0.8
    })
  }

  for (let i = 0; i < 150; i++) {
    const angle = (Math.PI * 2 * i) / 150
    const dist = 500 + Math.random() * 500
    flyingDots.value.push({
      id: i, color: pick(dotColors),
      fx: Math.cos(angle) * dist, fy: Math.sin(angle) * dist,
      dur: 3 + Math.random() * 2, delay: Math.random() * 4
    })
  }

  for (let i = 0; i < 5; i++) {
    distortionRings.value.push({
      id: i, size: 200 + i * 100, delay: i * 0.6
    })
  }

  const pool: StarTrail[] = []
  for (let i = 0; i < 20; i++) {
    pool.push(makeTrail(i))
  }
  starTrails.value = pool

  trailTimer = setInterval(() => {
    const idx = trailId++ % 20
    starTrails.value[idx] = makeTrail(idx)
  }, 200)
})

onUnmounted(() => {
  if (trailTimer) clearInterval(trailTimer)
})

function makeTrail(id: number): StarTrail {
  const h = typeof window !== 'undefined' ? window.innerHeight : 900
  const startY = Math.random() * h
  const endY = Math.random() * h
  const angle = Math.atan2(endY - startY, 2000) * (180 / Math.PI)
  return {
    id, w: 60 + Math.random() * 100, startY, endY, angle,
    color: pick(trailColors), dur: 1.5 + Math.random() * 1.5
  }
}
</script>

<template>
  <div class="cosmos" aria-hidden="true">
    <template v-if="full">
      <div class="energy-core"></div>

      <div class="energy-ring"
        v-for="r in energyRings" :key="'r'+r.id"
        :style="{
          width: '100px', height: '100px',
          '--ring-color': r.color,
          '--dur': r.dur + 's',
          animationDelay: r.delay + 's'
        }"
      ></div>

      <div class="burst-particle"
        v-for="p in burstParticles" :key="'bp'+p.id"
        :style="{
          '--size': p.size + 'px',
          '--color': p.color,
          '--tx': p.tx + 'px', '--ty': p.ty + 'px',
          '--dur': p.dur + 's', '--glow': p.glow + 'px',
          animationDelay: p.delay + 's'
        }"
      ></div>

      <div class="star-trail"
        v-for="t in starTrails" :key="'st'+t.id + '-' + t.startY"
        :style="{
          '--w': t.w + 'px',
          '--start-x': '-200px', '--start-y': t.startY + 'px',
          '--end-x': '110vw', '--end-y': t.endY + 'px',
          '--angle': t.angle + 'deg',
          '--trail-color': t.color,
          '--zoom-dur': t.dur + 's'
        }"
      ></div>

      <div class="warp-line"
        v-for="w in warpLines" :key="'wl'+w.id"
        :style="{
          '--h': w.h + 'px', '--warp-x': w.x + 'px',
          '--warp-color': w.color, '--warp-dur': w.dur + 's',
          animationDelay: w.delay + 's'
        }"
      ></div>

      <div class="nebula-wave"
        v-for="n in nebulaWaves" :key="'nw'+n.id"
        :style="{
          width: '300px', height: '300px',
          '--wave-color': n.color, '--wave-dur': n.dur + 's',
          animationDelay: n.delay + 's'
        }"
      ></div>

      <div class="flying-dot"
        v-for="d in flyingDots" :key="'fd'+d.id"
        :style="{
          '--dot-color': d.color,
          '--fx': d.fx + 'px', '--fy': d.fy + 'px',
          '--fly-dur': d.dur + 's',
          animationDelay: d.delay + 's'
        }"
      ></div>

      <div class="distortion-ring"
        v-for="dr in distortionRings" :key="'dr'+dr.id"
        :style="{
          width: dr.size + 'px', height: dr.size + 'px',
          animationDelay: dr.delay + 's'
        }"
      ></div>
    </template>

    <!-- Background stars — always visible -->
    <div class="bg-star"
      v-for="s in bgStars" :key="'bs'+s.id"
      :style="{
        left: s.left, top: s.top,
        width: s.size + 'px', height: s.size + 'px',
        opacity: s.opacity
      }"
    ></div>
  </div>

  <!-- Grain overlay -->
  <svg class="grain" aria-hidden="true">
    <filter id="grain-filter">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain-filter)" opacity="0.015" />
  </svg>
</template>

<style scoped>
.cosmos {
  position: fixed; inset: 0; z-index: 0;
  background: radial-gradient(ellipse at center, #0a1628 0%, var(--bg-void, #040810) 100%);
  overflow: hidden; pointer-events: none;
}

/* ── Energy Core ── */
.energy-core {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 200px; height: 200px;
  background: radial-gradient(circle,
    rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.4) 30%, transparent 70%);
  filter: blur(20px);
  animation: coreBurst 2s ease-in-out infinite;
}
@keyframes coreBurst {
  0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%,-50%) scale(1.3); opacity: 1; }
}

/* ── Energy Rings ── */
.energy-ring {
  position: absolute; top: 50%; left: 50%;
  border-radius: 50%;
  border: 2px solid var(--ring-color, rgba(147,197,253,0.6));
  animation: ringExpand var(--dur, 4s) ease-out infinite;
  opacity: 0;
}
@keyframes ringExpand {
  0% { transform: translate(-50%,-50%) scale(0); opacity: 0.8; }
  100% { transform: translate(-50%,-50%) scale(4); opacity: 0; }
}

/* ── Burst Particles ── */
.burst-particle {
  position: absolute; top: 50%; left: 50%;
  width: var(--size, 3px); height: var(--size, 3px);
  background: var(--color, white);
  border-radius: 50%;
  box-shadow: 0 0 var(--glow, 6px) var(--color, white);
  animation: particleExplode var(--dur, 3s) ease-out infinite;
  opacity: 0;
}
@keyframes particleExplode {
  0% { transform: translate(-50%,-50%) translate(0,0) scale(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-50%,-50%) translate(var(--tx,500px),var(--ty,500px)) scale(0.3); opacity: 0; }
}

/* ── Star Trails ── */
.star-trail {
  position: absolute;
  width: var(--w, 80px); height: 2px;
  background: linear-gradient(to right, transparent, var(--trail-color, rgba(147,197,253,0.8)), transparent);
  filter: blur(1px);
  animation: trailZoom var(--zoom-dur, 2s) linear infinite;
  opacity: 0;
}
@keyframes trailZoom {
  0% { transform: translate(var(--start-x,-100vw),var(--start-y,50vh)) rotate(var(--angle,0deg)) scaleX(0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(var(--end-x,100vw),var(--end-y,50vh)) rotate(var(--angle,0deg)) scaleX(1); opacity: 0; }
}

/* ── Warp Lines ── */
.warp-line {
  position: absolute;
  width: 1px; height: var(--h, 150px);
  background: linear-gradient(to bottom, transparent, var(--warp-color, rgba(147,197,253,0.4)), transparent);
  animation: warpSpeed var(--warp-dur, 1.5s) linear infinite;
  opacity: 0;
}
@keyframes warpSpeed {
  0% { transform: translate(var(--warp-x,50vw),-100vh) scaleY(0); opacity: 0; }
  50% { opacity: 0.8; transform: translate(var(--warp-x,50vw),50vh) scaleY(1); }
  100% { transform: translate(var(--warp-x,50vw),150vh) scaleY(0.5); opacity: 0; }
}

/* ── Nebula Waves ── */
.nebula-wave {
  position: absolute; top: 50%; left: 50%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--wave-color, rgba(99,102,241,0.2)), transparent 70%);
  filter: blur(30px);
  animation: waveExpand var(--wave-dur, 5s) ease-out infinite;
  opacity: 0;
}
@keyframes waveExpand {
  0% { transform: translate(-50%,-50%) scale(0); opacity: 0; }
  20% { opacity: 0.6; }
  100% { transform: translate(-50%,-50%) scale(3); opacity: 0; }
}

/* ── Flying Dots ── */
.flying-dot {
  position: absolute; top: 50%; left: 50%;
  width: 4px; height: 4px;
  background: var(--dot-color, white);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--dot-color, white);
  animation: dotFly var(--fly-dur, 4s) ease-out infinite;
  opacity: 0;
}
@keyframes dotFly {
  0% { transform: translate(-50%,-50%) translate(0,0); opacity: 0; }
  10% { opacity: 1; }
  100% { transform: translate(-50%,-50%) translate(var(--fx,800px),var(--fy,800px)); opacity: 0; }
}

/* ── Distortion Rings ── */
.distortion-ring {
  position: absolute; top: 50%; left: 50%;
  border-radius: 50%;
  border: 1px solid rgba(147,197,253,0.3);
  animation: distort 3s ease-in-out infinite;
  opacity: 0;
}
@keyframes distort {
  0%,100% { transform: translate(-50%,-50%) scale(0.8); opacity: 0; }
  50% { transform: translate(-50%,-50%) scale(2.5); opacity: 0.4; }
}

/* ── Background Stars ── */
.bg-star {
  position: absolute; border-radius: 50%; background: white;
}

/* ── Grain ── */
.grain {
  position: fixed; inset: 0;
  width: 100%; height: 100%;
  z-index: 0; pointer-events: none;
}
</style>
