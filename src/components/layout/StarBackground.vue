<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Star {
  id: number
  left: string
  top: string
  size: string
  duration: string
  minOpacity: number
  maxOpacity: number
  delay: string
}

const stars = ref<Star[]>([])

onMounted(() => {
  const result: Star[] = []
  for (let i = 0; i < 140; i++) {
    const size = Math.random() * 2 + 0.3
    result.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${size}px`,
      duration: `${3 + Math.random() * 7}s`,
      minOpacity: 0.04 + Math.random() * 0.08,
      maxOpacity: 0.3 + Math.random() * 0.6,
      delay: `${Math.random() * 8}s`
    })
  }
  stars.value = result
})
</script>

<template>
  <!-- Layer 1: Nebula gradients — slow drifting blobs -->
  <div class="nebula" aria-hidden="true"></div>

  <!-- Layer 2: Star field — 140 twinkling white dots -->
  <div class="star-field" aria-hidden="true">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="{
        left: star.left,
        top: star.top,
        width: star.size,
        height: star.size,
        '--dur': star.duration,
        '--lo': star.minOpacity,
        '--hi': star.maxOpacity,
        animationDelay: star.delay
      }"
    />
  </div>

  <!-- Layer 3: Film grain — SVG feTurbulence noise texture -->
  <svg class="grain" aria-hidden="true">
    <filter id="grain-filter">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain-filter)" opacity="0.03" />
  </svg>
</template>

<style scoped>
/* ── Layer 1: Nebula ── */
.nebula {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}
.nebula::before {
  content: '';
  position: absolute;
  top: -20%;
  left: -10%;
  width: 60%;
  height: 70%;
  background: radial-gradient(ellipse, rgba(99, 179, 237, 0.06) 0%, transparent 70%);
  animation: drift-blue 22s ease-in-out infinite alternate;
}
.nebula::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 50%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(183, 148, 244, 0.07) 0%, transparent 70%);
  animation: drift-purple 25s ease-in-out infinite alternate;
}

@keyframes drift-blue {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(5%, 3%) scale(1.1); }
}
@keyframes drift-purple {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-3%, -5%) scale(1.15); }
}

/* ── Layer 2: Stars ── */
.star-field {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.star {
  position: absolute;
  border-radius: 50%;
  background: white;
  animation: twinkle var(--dur, 4s) ease-in-out infinite alternate;
}
@keyframes twinkle {
  from { opacity: var(--lo, 0.05); transform: scale(0.85); }
  to   { opacity: var(--hi, 0.55); transform: scale(1.15); }
}

/* ── Layer 3: Film Grain ── */
.grain {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  opacity: 0.4;
}
</style>
