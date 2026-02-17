<script setup lang="ts">
import { computed } from 'vue'
import { iconPaths } from './index'

const props = defineProps<{
  name: string
  size?: number | string
  strokeWidth?: number
  color?: string
}>()

const pathData = computed(() => iconPaths[props.name] || '')
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
    class="icon"
    v-html="pathData"
  />
</template>

<style scoped>
.icon {
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
