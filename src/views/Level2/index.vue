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
      <!-- 顶部栏 -->
      <div class="top-bar">
        <div class="back-btn" @click="goHome">
          <span class="back-arrow">&#10094;</span>
          <span class="back-text">返回</span>
        </div>
        <div class="level-title">智能巡检</div>
        <div class="score-area">
          <div class="score-badge">{{ placedCount }} / 3</div>
        </div>
      </div>

      <!-- 中间：6 宫格拼图区域（2行×3列） -->
      <div class="puzzle-grid">
        <div
          v-for="(slot, i) in allSlots"
          :key="'slot-' + i"
          class="grid-cell"
          :ref="(el) => { if (el) targetRefs[i] = el as HTMLElement }"
          :class="{
            'grid-cell--fixed': slot.fixed,
            'grid-cell--filled': slot.filled,
            'grid-cell--empty': !slot.fixed && !slot.filled,
          }"
        >
          <template v-if="slot.fixed">
            <!-- 已摆好的固定碎片 -->
            <div class="cell-content fixed-piece" :style="{ background: slot.color }">
              {{ slot.label }}
            </div>
          </template>
          <template v-else-if="slot.filled">
            <!-- 玩家拖入的碎片 -->
            <div class="cell-content placed-piece animate-snap" :style="{ background: slot.color }">
              {{ slot.label }}
            </div>
          </template>
          <template v-else>
            <!-- 待填入的空位 -->
            <div class="cell-empty">
              <span class="cell-index">{{ i + 1 }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 提示按钮 -->
      <div class="tip-btn" @click="toggleTip">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3'/%3E%3Cline x1='12' y1='17' x2='12.01' y2='17'/%3E%3C/svg%3E" alt="提示" />
      </div>

      <!-- 提示浮层：显示完整拼图答案 -->
      <div v-if="showTip" class="tip-overlay" @click="toggleTip">
        <div class="tip-card animate-bounce-in">
          <p class="tip-title">完整巡检影像</p>
          <div class="tip-grid">
            <div
              v-for="(item, i) in answerGrid"
              :key="'tip-' + i"
              class="tip-cell"
              :style="{ background: item.color }"
            >
              {{ item.label }}
            </div>
          </div>
          <p class="tip-hint">点击任意位置关闭</p>
        </div>
      </div>

      <!-- 底部：待拖拽的 3 块碎片 -->
      <div class="puzzle-pieces">
        <div
          v-for="piece in draggablePieces"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLevel } from '@/composables/useLevel'
import GameLoading from '@/components/GameLoading.vue'
import LessonDialog from '@/components/LessonDialog.vue'
import ResultModal from '@/components/ResultModal.vue'

const router = useRouter()
const { phase, startLoading, startPlaying, completeLevel } = useLevel()

const showTip = ref(false)

// 完整答案：6 宫格正确排列
const answerGrid = [
  { label: '主变压器',   color: '#C0392B' },
  { label: '断路器',     color: '#E74C3C' },
  { label: '电压互感器', color: '#E67E22' },
  { label: '隔离开关',   color: '#FF634E' },
  { label: '避雷器',     color: '#2980B9' },
  { label: '电流互感器', color: '#D63031' },
]

// 6 宫格数据：2 行 × 3 列
// fixed = 已摆好的位置，玩家不能动
// 没有 fixed = 空位，需要拖入对应碎片
interface SlotData {
  fixed: boolean
  filled: boolean
  color: string
  label: string
  expectedId: string
}

const allSlots = reactive<SlotData[]>([
  // 第一行：位置 0-2（2个固定 + 1个空位）
  { fixed: true,  filled: true,  color: '#C0392B', label: '主变压器', expectedId: '' },
  { fixed: false, filled: false, color: '',         label: '',         expectedId: 'p1' },
  { fixed: true,  filled: true,  color: '#E67E22', label: '电压互感器', expectedId: '' },
  // 第二行：位置 3-5（1个固定 + 2个空位）
  { fixed: false, filled: false, color: '',         label: '',         expectedId: 'p2' },
  { fixed: true,  filled: true,  color: '#2980B9', label: '避雷器',   expectedId: '' },
  { fixed: false, filled: false, color: '',         label: '',         expectedId: 'p3' },
])

// 可拖拽的 3 块碎片（打乱顺序）
const pieces = [
  { id: 'p1', label: '断路器',   color: '#E74C3C', targetIndex: 1 },
  { id: 'p2', label: '隔离开关', color: '#FF634E', targetIndex: 3 },
  { id: 'p3', label: '电流互感器', color: '#D63031', targetIndex: 5 },
]

const draggablePieces = reactive(
  [...pieces].sort(() => Math.random() - 0.5).map((p) => ({ ...p, placed: false }))
)

const targetRefs = ref<HTMLElement[]>([])

const placedCount = computed(() =>
  allSlots.filter((s) => !s.fixed && s.filled).length
)

// 拖拽状态
const draggingId = ref<string | null>(null)
const dragOffset = reactive({ x: 0, y: 0 })

onMounted(() => {
  startLoading(1500)
})

function toggleTip() {
  showTip.value = !showTip.value
}

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
  // 只检查非固定、未填入的空位
  for (let i = 0; i < allSlots.length; i++) {
    const slot = allSlots[i]
    if (slot.fixed || slot.filled) continue

    const el = targetRefs.value[i]
    if (!el) continue

    const rect = el.getBoundingClientRect()
    const isOver =
      x > rect.left - 20 && x < rect.right + 20 &&
      y > rect.top - 20 && y < rect.bottom + 20

    if (isOver && piece.targetIndex === i) {
      slot.filled = true
      slot.color = piece.color
      slot.label = piece.label
      piece.placed = true

      // 全部空位填满 → 通关
      const allEmptyFilled = allSlots.every((s) => s.fixed || s.filled)
      if (allEmptyFilled) {
        setTimeout(() => completeLevel(), 800)
      }
      return
    }
  }
}

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.level2 {
  background-image: url('@/assets/demo/common_bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
  position: relative;
}

// 顶部栏
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  padding-top: max(12px, env(safe-area-inset-top));
  position: relative;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 20px;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;

  &:active {
    background: rgba(0, 0, 0, 0.6);
  }
}

.back-arrow { font-size: 12px; }
.back-text { letter-spacing: 1px; }

.level-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: $font-size-lg;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  letter-spacing: 2px;
}

.score-badge {
  padding: 4px 12px;
  background: rgba(255, 99, 78, 0.9);
  border-radius: 12px;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 700;
}

// ===== 6 宫格拼图 =====
.puzzle-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: $spacing-md;
  align-content: center;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}

.grid-cell {
  aspect-ratio: 3 / 4;
  border-radius: $radius-md;
  overflow: hidden;
  position: relative;

  &--fixed {
    // 固定碎片，正常展示
  }

  &--empty {
    border: 2px dashed rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.1);
  }

  &--filled {
    border: 2px solid $color-success;
    background: rgba($color-success, 0.05);
  }
}

.cell-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: $font-size-sm;
  border-radius: $radius-md;
}

.fixed-piece {
  opacity: 0.85;
}

.placed-piece {
  animation: snap-success 0.3s ease;
}

.cell-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-index {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 700;
}

// 提示按钮
.tip-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;

  &:active {
    background: rgba(0, 0, 0, 0.6);
  }

  img {
    width: 22px;
    height: 22px;
  }
}

// 提示浮层
.tip-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
}

.tip-card {
  width: 100%;
  max-width: 320px;
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-lg;
  box-shadow: $shadow-float;
}

.tip-title {
  text-align: center;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $color-text;
  margin-bottom: $spacing-md;
}

.tip-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tip-cell {
  aspect-ratio: 3 / 4;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 11px;
}

.tip-hint {
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-light;
  margin-top: $spacing-md;
}

.tip-text {
  font-size: $font-size-sm;
  color: $color-text;
  line-height: 1.8;
  text-align: justify;
}

// 底部碎片区域
.puzzle-pieces {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  padding: $spacing-md;
  padding-bottom: max($spacing-lg, env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.85);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.puzzle-piece {
  width: 90px;
  border-radius: $radius-md;
  background: #fff;
  box-shadow: $shadow-card;
  cursor: grab;
  touch-action: none;
  transition: transform 0.3s ease, opacity 0.3s ease;
  will-change: transform;
  overflow: hidden;
  aspect-ratio: 3 / 4;

  &:active { cursor: grabbing; }

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
