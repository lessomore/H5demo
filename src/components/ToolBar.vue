<template>
  <div class="toolbar">
    <div class="toolbar-inner">
      <div
        v-for="item in items"
        :key="item.id"
        class="tool-slot"
        :class="{
          'tool-slot--filled': item.collected,
          'tool-slot--active': item.id === activeId,
        }"
        @touchstart.prevent="onToolTouch($event, item)"
        @mousedown.prevent="onToolTouch($event, item)"
      >
        <div v-if="item.collected" class="tool-icon">
          {{ item.icon }}
        </div>
        <div v-else class="tool-empty">
          <span class="tool-placeholder">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ToolItem {
  id: string
  name: string
  icon: string
  collected: boolean
}

defineProps<{
  items: ToolItem[]
  activeId?: string
}>()

const emit = defineEmits<{
  select: [item: ToolItem]
  dragStart: [event: TouchEvent | MouseEvent, item: ToolItem]
}>()

function onToolTouch(e: TouchEvent | MouseEvent, item: ToolItem) {
  if (!item.collected) return
  emit('select', item)
  emit('dragStart', e, item)
}
</script>

<style lang="scss" scoped>
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: $toolbar-height;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 50;
  padding: $spacing-sm $spacing-md;
  // 安全区域适配
  padding-bottom: max($spacing-sm, env(safe-area-inset-bottom));
}

.toolbar-inner {
  display: flex;
  gap: $spacing-sm;
  height: 100%;
  align-items: center;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tool-slot {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: $radius-sm;
  border: 2px dashed rgba($color-primary, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $duration-fast ease;

  &--filled {
    border: 2px solid $color-primary;
    background: rgba($color-primary, 0.05);
    cursor: grab;

    &:active {
      cursor: grabbing;
      transform: scale(1.1);
      box-shadow: $shadow-float;
    }
  }

  &--active {
    border-color: $color-accent;
    background: rgba($color-accent, 0.1);
    box-shadow: 0 0 0 3px rgba($color-accent, 0.2);
  }
}

.tool-icon {
  font-size: 28px;
}

.tool-placeholder {
  font-size: $font-size-xs;
  color: $color-text-light;
  text-align: center;
  word-break: keep-all;
}
</style>
