<template>
  <div class="level2 page">
    <!-- 加载 -->
    <GameLoading v-if="phase === 'loading'" />

    <!-- 课堂讲解 -->
    <LessonDialog
      v-if="phase === 'lesson'"
      content="机器狗已完成现场智能巡检，传回多组设备实拍影像。本次实训需要你将打乱的巡检图片精准复原规整。熟知各类变电设备样貌、牢记设备结构形态与标准安装位置，是变电运维人员的必修课。"
      button-text="开始挑战"
      @start="startPlaying"
    />

    <!-- 游戏阶段 -->
    <div v-if="phase === 'playing'" class="game-area">
      <!-- 上方：目标拼图区域（3个位置） -->
      <div class="puzzle-target">
        <div
          v-for="(slot, i) in targetSlots"
          :key="'target-' + i"
          class="target-slot"
          :ref="(el) => { if (el) targetRefs[i] = el as HTMLElement }"
          :class="{ 'target-slot--filled': slot.filled }"
        >
          <div v-if="slot.filled" class="filled-piece animate-snap">
            <div class="piece-content" :style="{ background: slot.color }">
              {{ slot.label }}
            </div>
          </div>
          <div v-else class="slot-placeholder">
            <span class="slot-index">{{ i + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- 下方：碎片区域（可拖拽） -->
      <div class="puzzle-pieces">
        <div
          v-for="piece in shuffledPieces"
          :key="piece.id"
          class="puzzle-piece"
          :class="{ 'puzzle-piece--placed': piece.placed }"
          :style="piece.placed ? { opacity: 0.3 } : getDragStyle(piece.id)"
          @touchstart.prevent="(e) => onPieceDragStart(e, piece)"
          @mousedown.prevent="(e) => onPieceDragStart(e, piece)"
        >
          <div class="piece-inner" :style="{ background: piece.color }">
            {{ piece.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <ResultModal
      v-if="phase === 'success'"
      :success="true"
      message="拼图复原成功！你已熟悉变电设备的标准形态。"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLevel } from '@/composables/useLevel'
import GameLoading from '@/components/GameLoading.vue'
import LessonDialog from '@/components/LessonDialog.vue'
import ResultModal from '@/components/ResultModal.vue'

const router = useRouter()
const { phase, startLoading, startPlaying, completeLevel } = useLevel()

// 拼图数据：3块碎片对应3个目标位置
const pieces = [
  { id: 'p1', label: '变压器', color: 'linear-gradient(135deg, #667eea, #764ba2)', targetIndex: 0 },
  { id: 'p2', label: '断路器', color: 'linear-gradient(135deg, #f093fb, #f5576c)', targetIndex: 1 },
  { id: 'p3', label: '隔离开关', color: 'linear-gradient(135deg, #4facfe, #00f2fe)', targetIndex: 2 },
]

// 打乱顺序
const shuffledPieces = reactive(
  [...pieces].sort(() => Math.random() - 0.5).map((p) => ({ ...p, placed: false }))
)

// 目标槽位
const targetSlots = reactive([
  { filled: false, color: '', label: '', expectedId: 'p1' },
  { filled: false, color: '', label: '', expectedId: 'p2' },
  { filled: false, color: '', label: '', expectedId: 'p3' },
])

const targetRefs = ref<HTMLElement[]>([])

// 拖拽状态
const draggingId = ref<string | null>(null)
const dragOffset = reactive({ x: 0, y: 0 })

onMounted(() => {
  startLoading(1500)
})

function getDragStyle(id: string) {
  if (draggingId.value === id) {
    return {
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.1)`,
      zIndex: 100,
      transition: 'none',
    }
  }
  return {}
}

function onPieceDragStart(e: TouchEvent | MouseEvent, piece: typeof pieces[0] & { placed: boolean }) {
  if (piece.placed) return

  const pos = 'touches' in e ? e.touches[0] : e
  const startX = pos.clientX
  const startY = pos.clientY
  draggingId.value = piece.id
  dragOffset.x = 0
  dragOffset.y = 0

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    const p = 'touches' in ev ? ev.touches[0] : ev
    dragOffset.x = p.clientX - startX
    dragOffset.y = p.clientY - startY
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    const p = 'changedTouches' in ev ? ev.changedTouches[0] : ev
    checkDrop(piece, p.clientX, p.clientY)
    draggingId.value = null
    dragOffset.x = 0
    dragOffset.y = 0

    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
  }

  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}

function checkDrop(piece: typeof pieces[0] & { placed: boolean }, x: number, y: number) {
  // 检查是否落在正确的目标槽位上
  for (let i = 0; i < targetRefs.value.length; i++) {
    const el = targetRefs.value[i]
    if (!el || targetSlots[i].filled) continue

    const rect = el.getBoundingClientRect()
    const isOver =
      x > rect.left - 20 && x < rect.right + 20 &&
      y > rect.top - 20 && y < rect.bottom + 20

    if (isOver && piece.targetIndex === i) {
      // 正确位置 → 吸附
      targetSlots[i].filled = true
      targetSlots[i].color = piece.color
      targetSlots[i].label = piece.label
      piece.placed = true

      // 检查是否全部完成
      if (targetSlots.every((s) => s.filled)) {
        setTimeout(() => completeLevel(), 800)
      }
      return
    }
  }
  // 未命中或位置不对 → 回弹（自动通过 dragOffset 重置）
}

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.level2 {
  background: linear-gradient(180deg, #eef2ff 0%, #c7d2fe 100%);
}

.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-md;
  gap: $spacing-lg;
}

// 目标区域
.puzzle-target {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
  padding: $spacing-md 0;
}

.target-slot {
  width: 100px;
  height: 130px;
  border: 3px dashed rgba($color-primary, 0.3);
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &--filled {
    border-color: $color-success;
    border-style: solid;
    background: rgba($color-success, 0.05);
  }
}

.slot-placeholder {
  text-align: center;
}

.slot-index {
  font-size: $font-size-title;
  color: rgba($color-primary, 0.2);
  font-weight: 700;
}

.filled-piece {
  width: 100%;
  height: 100%;
}

.piece-content {
  width: 100%;
  height: 100%;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: $font-size-sm;
}

// 碎片区域
.puzzle-pieces {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  flex-wrap: wrap;
  padding: $spacing-lg 0;
}

.puzzle-piece {
  width: 100px;
  height: 130px;
  border-radius: $radius-md;
  box-shadow: $shadow-card;
  cursor: grab;
  touch-action: none;
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform;

  &:active {
    cursor: grabbing;
  }

  &--placed {
    pointer-events: none;
  }
}

.piece-inner {
  width: 100%;
  height: 100%;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: $font-size-sm;
}
</style>
