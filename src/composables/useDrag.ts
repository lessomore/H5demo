import { ref, reactive } from 'vue'

export interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  offsetX: number
  offsetY: number
}

/**
 * 通用拖拽逻辑（支持 touch + mouse）
 * 用于关卡中拖拽工具/拼图到目标区域
 */
export function useDrag(options?: {
  onDragStart?: (e: DragState) => void
  onDragMove?: (e: DragState) => void
  onDragEnd?: (e: DragState) => void
}) {
  const state = reactive<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    offsetX: 0,
    offsetY: 0,
  })

  // 当前拖拽的元素
  const dragEl = ref<HTMLElement | null>(null)

  function getEventPos(e: TouchEvent | MouseEvent) {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: e.clientX, y: e.clientY }
  }

  function handleStart(e: TouchEvent | MouseEvent, el: HTMLElement) {
    e.preventDefault()
    const pos = getEventPos(e)
    const rect = el.getBoundingClientRect()

    state.isDragging = true
    state.startX = pos.x
    state.startY = pos.y
    state.currentX = pos.x
    state.currentY = pos.y
    // 记录触摸点相对于元素左上角的偏移
    state.offsetX = pos.x - rect.left
    state.offsetY = pos.y - rect.top
    dragEl.value = el

    options?.onDragStart?.(state)

    // 绑定全局事件
    document.addEventListener('touchmove', handleMove, { passive: false })
    document.addEventListener('touchend', handleEnd)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
  }

  function handleMove(e: TouchEvent | MouseEvent) {
    if (!state.isDragging) return
    e.preventDefault()
    const pos = getEventPos(e)
    state.currentX = pos.x
    state.currentY = pos.y
    options?.onDragMove?.(state)
  }

  function handleEnd() {
    if (!state.isDragging) return
    state.isDragging = false
    options?.onDragEnd?.(state)
    dragEl.value = null

    // 移除全局事件
    document.removeEventListener('touchmove', handleMove)
    document.removeEventListener('touchend', handleEnd)
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
  }

  return {
    state,
    dragEl,
    handleStart,
  }
}

/**
 * 碰撞检测：判断拖拽元素是否落在目标区域内
 */
export function isOverTarget(
  dragPos: { x: number; y: number },
  targetEl: HTMLElement,
  threshold = 30
): boolean {
  const rect = targetEl.getBoundingClientRect()
  return (
    dragPos.x > rect.left - threshold &&
    dragPos.x < rect.right + threshold &&
    dragPos.y > rect.top - threshold &&
    dragPos.y < rect.bottom + threshold
  )
}
