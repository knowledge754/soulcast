<script setup lang="ts">
import { onMounted, ref } from 'vue'

interface Star {
  id: number
  left: string
  top: string
  size: string
  duration: string
  minOpacity: string
  maxOpacity: string
  delay: string
}

const stars = ref<Star[]>([])

onMounted(() => {
  const result: Star[] = []
  for (let i = 0; i < 120; i++) {
    const size = Math.random() * 2 + 0.5
    result.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${size}px`,
      duration: `${3 + Math.random() * 6}s`,
      minOpacity: `${0.05 + Math.random() * 0.1}`,
      maxOpacity: `${0.4 + Math.random() * 0.5}`,
      delay: `${Math.random() * 5}s`
    })
  }
  stars.value = result
})
</script>

<template>
  <!-- Nebula gradient blobs -->
  <div class="nebula" aria-hidden="true"></div>

  <!-- Stars -->
  <div class="stars" aria-hidden="true">
    <div
      v-for="star in stars"
      :key="star.id"
      class="star"
      :style="{
        left: star.left,
        top: star.top,
        width: star.size,
        height: star.size,
        '--duration': star.duration,
        '--min-opacity': star.minOpacity,
        '--max-opacity': star.maxOpacity,
        animationDelay: star.delay
      }"
    />
  </div>
</template>

<style scoped>
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
  animation: drift1 20s ease-in-out infinite alternate;
}
.nebula::after {
  content: '';
  position: absolute;
  bottom: -10%;
  right: -10%;
  width: 50%;
  height: 60%;
  background: radial-gradient(ellipse, rgba(183, 148, 244, 0.07) 0%, transparent 70%);
  animation: drift2 25s ease-in-out infinite alternate;
}

.stars {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: white;
  animation: twinkle var(--duration) ease-in-out infinite alternate;
}

@keyframes twinkle {
  from { opacity: var(--min-opacity); }
  to { opacity: var(--max-opacity); }
}

@keyframes drift1 {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(5%, 3%) scale(1.1); }
}

@keyframes drift2 {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(-3%, -5%) scale(1.15); }
}
</style>
