<template>
  <div
    class="drag-item"
    :class="{ 'drag-item--dragging': isDragging }"
    :style="dragStyle"
    @touchstart.prevent="onStart"
    @mousedown.prevent="onStart"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDrag } from '@/composables/useDrag'

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  dragStart: []
  dragEnd: [pos: { x: number; y: number }]
}>()

const isDragging = ref(false)
const translateX = ref(0)
const translateY = ref(0)
const itemEl = ref<HTMLElement>()

const { handleStart } = useDrag({
  onDragStart() {
    isDragging.value = true
    emit('dragStart')
  },
  onDragMove(s) {
    translateX.value = s.currentX - s.startX
    translateY.value = s.currentY - s.startY
  },
  onDragEnd(s) {
    isDragging.value = false
    emit('dragEnd', { x: s.currentX, y: s.currentY })
    // 回弹
    translateX.value = 0
    translateY.value = 0
  },
})

const dragStyle = computed(() => {
  if (!isDragging.value) return {}
  return {
    transform: `translate(${translateX.value}px, ${translateY.value}px) scale(1.1)`,
    zIndex: 999,
    transition: 'none',
  }
})

function onStart(e: TouchEvent | MouseEvent) {
  if (props.disabled) return
  const el = (e.currentTarget as HTMLElement)
  itemEl.value = el
  handleStart(e, el)
}
</script>

<style lang="scss" scoped>
.drag-item {
  touch-action: none;
  cursor: grab;
  transition: transform $duration-fast ease, box-shadow $duration-fast ease;
  will-change: transform;

  &--dragging {
    cursor: grabbing;
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
  }
}
</style>
