<script setup lang="ts">
defineProps<{
  size?: number | string
  strokeWidth?: number
  color?: string
}>()
</script>

<template>
  <svg
    :width="size || 20"
    :height="size || 20"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color || 'currentColor'"
    :stroke-width="strokeWidth || 1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="svg-icon"
  >
    <slot />
  </svg>
</template>

<style scoped>
.svg-icon {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
