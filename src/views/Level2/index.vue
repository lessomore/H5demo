<template>
  <div class="level2 page">
    <!-- 阶段1：开始挑战页 -->
    <div v-if="gamePhase === 'start'" class="start-screen">
      <div class="start-content">
        <img class="start-tip-img" src="@/assets/level2/第二关/tishi.png" alt="任务说明" />
        <img class="start-person" src="@/assets/level2/第二关/person.png" alt="角色" />
      </div>
      <div class="start-bottom">
        <img
          class="start-btn"
          src="@/assets/level2/第二关/start_btn.png"
          alt="开始挑战"
          @click="enterLevel"
        />
      </div>
    </div>

    <!-- 阶段2：拼图游戏页 -->
    <div v-if="gamePhase === 'playing'" class="game-area">
      <button class="hint-btn" type="button" @click="showTipFromGame = true">提示</button>
      <div class="game-guide-panel">
        <img
          class="close-btn"
          src="@/assets/level2/第二关/close.png"
          alt="关闭"
          @click="goHome"
        />

      <!-- 拼图区域：9 个切图绝对定位拼成 -->
      <div class="puzzle-area">
        <div class="puzzle-container" ref="puzzleContainerRef">
          <!-- 顶部 3 块固定 -->
          <img class="tile" :style="tilePos.top1" :src="imgTop1" alt="" />
          <img class="tile" :style="tilePos.top2" :src="imgTop2" alt="" />
          <img class="tile" :style="tilePos.top3" :src="imgTop3" alt="" />
          <!-- 中间 + 底部 6 块：背景 + 拖放区 -->
          <div
            v-for="(slot, i) in dropSlots"
            :key="'slot-' + i"
            class="tile-slot"
            :style="slot.tileStyle"
            :ref="(el) => { if (el) slotRefs[i] = el as HTMLElement }"
          >
            <img class="tile-bg" :src="slot.bgSrc" alt="" />
            <img v-if="slot.filled" :src="slot.filledSrc" class="placed-piece animate-snap" />
          </div>
        </div>
      </div>

      <!-- 提示浮层 -->
      </div>

      <div v-if="showTipFromGame" class="tip-overlay" @click="showTipFromGame = false">
        <div class="tip-card animate-bounce-in">
          <p class="tip-title">完整巡检影像</p>
          <img class="tip-image" src="@/assets/level2/第二关/success_bg.png" alt="完整图" />
          <p class="tip-hint">点击任意位置关闭</p>
        </div>
      </div>

      <!-- 底部材料选择区域 -->
      <div class="material-area">
        <div class="material-panel">
          <img class="material-bg" src="@/assets/level2/第二关/swiper_bg.png" alt="" />
          <img
            class="swiper-arrow swiper-arrow--left"
            src="@/assets/level2/第二关/swiper_change.png"
            alt="上一页"
            :class="{ 'swiper-arrow--disabled': materialPage === 0 }"
            @click="materialPage = Math.max(0, materialPage - 1)"
          />
          <div class="material-content">
            <div class="material-grid">
              <div
                v-for="mat in currentPageMaterials"
                :key="mat.id"
                class="material-card"
                :class="{ 'material-card--placed': mat.placed }"
              >
                <img class="material-slot-bg" src="@/assets/level2/第二关/swiper_item_bg.png" alt="" />
                <div
                  v-if="!mat.placed"
                  class="material-draggable"
                  @touchstart.prevent="(e: any) => onDragStart(e, mat)"
                  @mousedown.prevent="(e: any) => onDragStart(e, mat)"
                >
                  <img :src="mat.src" :alt="mat.label" class="material-img" />
                </div>
              </div>
            </div>
          </div>
          <img
            class="swiper-arrow swiper-arrow--right"
            src="@/assets/level2/第二关/swiper_change.png"
            alt="下一页"
            :class="{ 'swiper-arrow--disabled': materialPage >= maxPage }"
            @click="materialPage = Math.min(maxPage, materialPage + 1)"
          />
        </div>
      </div>

      <!-- 错误提示 -->
      <Transition name="toast">
        <div v-if="errorToast" class="error-toast">{{ errorToast }}</div>
      </Transition>

      <!-- 拖拽幽灵 -->
      <div
        v-if="dragState.active"
        class="drag-ghost"
        :style="{
          left: dragState.currentX - dragState.ghostW / 2 + 'px',
          top: dragState.currentY - dragState.ghostH / 2 + 'px',
          width: dragState.ghostW + 'px',
          height: dragState.ghostH + 'px',
        }"
      >
        <img :src="dragState.ghostSrc" alt="" class="ghost-img" />
      </div>
    </div>

    <!-- 结果弹窗 -->
    <ResultModal
      v-if="gamePhase === 'success'"
      :success="true"
      message="拼图复原成功！你已熟悉变电设备的标准形态。"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isOverTarget } from '@/composables/useDrag'
import ResultModal from '@/components/ResultModal.vue'

// ===== 图片资源 =====
import imgTop1 from '@/assets/level2/第二关/top1.png'
import imgTop2 from '@/assets/level2/第二关/top2.png'
import imgTop3 from '@/assets/level2/第二关/top3.png'
import imgC1Bg from '@/assets/level2/第二关/center1_bg.png'
import imgC2Bg from '@/assets/level2/第二关/center2_bg.png'
import imgC3Bg from '@/assets/level2/第二关/center3_bg.png'
import imgB1Bg from '@/assets/level2/第二关/bottom1_bg.png'
import imgB2Bg from '@/assets/level2/第二关/bottom2_bg.png'
import imgB3Bg from '@/assets/level2/第二关/bottom3_bg.png'
import center1 from '@/assets/level2/第二关/center1.png'
import center2 from '@/assets/level2/第二关/center2.png'
import center3 from '@/assets/level2/第二关/center3.png'
import bottom1 from '@/assets/level2/第二关/bottom1.png'
import bottom2 from '@/assets/level2/第二关/bottom2.png'
import bottom3 from '@/assets/level2/第二关/bottom3.png'
// 大尺寸拼图块（与 *_bg 同尺寸，用于拖拽幽灵和放置后显示）
import center11 from '@/assets/level2/第二关/center11.png'
import center22 from '@/assets/level2/第二关/center22.png'
import center33 from '@/assets/level2/第二关/center33.png'
import bottom11 from '@/assets/level2/第二关/bottom11.png'
import bottom22 from '@/assets/level2/第二关/bottom22.png'
import bottom33 from '@/assets/level2/第二关/bottom33.png'

const router = useRouter()
const gamePhase = ref<'start' | 'playing' | 'success'>('start')
const showTipFromGame = ref(false)
const puzzleContainerRef = ref<HTMLElement | null>(null)
const errorToast = ref('')
let errorTimer: ReturnType<typeof setTimeout> | null = null

// ===== 切图定位（模板匹配结果，百分比相对于 1178x1174 基图） =====
const tilePos = {
  top1: { left: '0%', top: '0%', width: '33.62%', height: '44.21%' },
  top2: { left: '22.58%', top: '0%', width: '44.23%', height: '33.65%' },
  top3: { left: '55.77%', top: '0%', width: '44.23%', height: '33.65%' },
}

// ===== 材料定义 =====
interface Material {
  id: string
  src: string      // 缩略图，工具栏展示用
  fullSrc: string  // 大图，拖拽幽灵和放置后用
  label: string
  targetSlotIndex: number
  placed: boolean
}

const materials = reactive<Material[]>([
  { id: 'c2', src: center2, fullSrc: center22, label: '中间2', targetSlotIndex: 1, placed: false },
  { id: 'b1', src: bottom1, fullSrc: bottom11, label: '底部1', targetSlotIndex: 3, placed: false },
  { id: 'c3', src: center3, fullSrc: center33, label: '中间3', targetSlotIndex: 2, placed: false },
  { id: 'b3', src: bottom3, fullSrc: bottom33, label: '底部3', targetSlotIndex: 5, placed: false },
  { id: 'c1', src: center1, fullSrc: center11, label: '中间1', targetSlotIndex: 0, placed: false },
  { id: 'b2', src: bottom2, fullSrc: bottom22, label: '底部2', targetSlotIndex: 4, placed: false },
])

const materialPage = ref(0)
const PAGE_SIZE = 4
const maxPage = computed(() => Math.ceil(materials.length / PAGE_SIZE) - 1)
const currentPageMaterials = computed(() => {
  const start = materialPage.value * PAGE_SIZE
  return materials.slice(start, start + PAGE_SIZE)
})

// ===== 放置区域定义 =====
interface DropSlot {
  tileStyle: { left: string; top: string; width: string; height: string }
  bgSrc: string
  filled: boolean
  filledSrc: string
  expectedId: string
}

const dropSlots = reactive<DropSlot[]>([
  // center1_bg @(0, 390) 521x395
  { tileStyle: { left: '0%', top: '33.22%', width: '44.23%', height: '33.65%' }, bgSrc: imgC1Bg, filled: false, filledSrc: '', expectedId: 'c1' },
  // center2_bg @(391, 266) 396x519
  { tileStyle: { left: '33.19%', top: '22.66%', width: '33.62%', height: '44.21%' }, bgSrc: imgC2Bg, filled: false, filledSrc: '', expectedId: 'c2' },
  // center3_bg @(657, 266) 521x643
  { tileStyle: { left: '55.77%', top: '22.66%', width: '44.23%', height: '54.77%' }, bgSrc: imgC3Bg, filled: false, filledSrc: '', expectedId: 'c3' },
  // bottom1_bg @(0, 655) 396x519
  { tileStyle: { left: '0%', top: '55.79%', width: '33.62%', height: '44.21%' }, bgSrc: imgB1Bg, filled: false, filledSrc: '', expectedId: 'b1' },
  // bottom2_bg @(266, 655) 646x519
  { tileStyle: { left: '22.58%', top: '55.79%', width: '54.84%', height: '44.21%' }, bgSrc: imgB2Bg, filled: false, filledSrc: '', expectedId: 'b2' },
  // bottom3_bg @(782, 780) 396x394
  { tileStyle: { left: '66.38%', top: '66.44%', width: '33.62%', height: '33.56%' }, bgSrc: imgB3Bg, filled: false, filledSrc: '', expectedId: 'b3' },
])

const slotRefs = ref<HTMLElement[]>([])

// ===== 拖拽逻辑 =====
const dragState = reactive({
  active: false,
  matId: '',
  currentX: 0,
  currentY: 0,
  ghostW: 60,
  ghostH: 60,
  ghostSrc: '',
})

function onDragStart(e: TouchEvent | MouseEvent, mat: Material) {
  if (mat.placed) return

  const pos = 'touches' in e ? e.touches[0] : e
  dragState.active = true
  dragState.matId = mat.id
  dragState.currentX = pos.clientX
  dragState.currentY = pos.clientY
  dragState.ghostSrc = mat.fullSrc

  const targetSlotEl = slotRefs.value[mat.targetSlotIndex]
  if (targetSlotEl) {
    const rect = targetSlotEl.getBoundingClientRect()
    dragState.ghostW = rect.width
    dragState.ghostH = rect.height
  } else {
    dragState.ghostW = 60
    dragState.ghostH = 60
  }

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    const p = 'touches' in ev ? ev.touches[0] : ev
    dragState.currentX = p.clientX
    dragState.currentY = p.clientY
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    const p = 'changedTouches' in ev ? ev.changedTouches[0] : ev
    handleDrop(mat, p.clientX, p.clientY)
    dragState.active = false
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

function showError(msg: string) {
  if (errorTimer) clearTimeout(errorTimer)
  errorToast.value = msg
  errorTimer = setTimeout(() => {
    errorToast.value = ''
  }, 1500)
}

function handleDrop(mat: Material, x: number, y: number) {
  const targetIdx = mat.targetSlotIndex
  const slot = dropSlots[targetIdx]
  if (!slot || slot.filled) return

  const el = slotRefs.value[targetIdx]
  if (!el) return

  // 检查是否落在正确的目标 slot 上
  if (isOverTarget({ x, y }, el, 30)) {
    slot.filled = true
    slot.filledSrc = mat.fullSrc
    mat.placed = true

    const allFilled = dropSlots.every((s) => s.filled)
    if (allFilled) {
      setTimeout(() => {
        gamePhase.value = 'success'
      }, 800)
    }
    return
  }

  // 检查是否落在了其他 slot 上（放错位置）
  for (let i = 0; i < dropSlots.length; i++) {
    if (i === targetIdx || dropSlots[i].filled) continue
    const otherEl = slotRefs.value[i]
    if (otherEl && isOverTarget({ x, y }, otherEl, 30)) {
      showError('位置不对，再试试！')
      return
    }
  }
}

function enterLevel() {
  gamePhase.value = 'playing'
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  gamePhase.value = 'start'
})
</script>

<style lang="scss" scoped>
.level2 {
  background-image: url('@/assets/level2/第二关/all_bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

// ===== 开始挑战页 =====
.start-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-lg;
  padding-top: max(60px, env(safe-area-inset-top));
  padding-bottom: max($spacing-xl, env(safe-area-inset-bottom));
}

.start-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  justify-content: center;
}

.start-tip-img {
  width: 100%;
  max-width: 380px;
  min-height: 400px;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.start-person {
  width: 120px;
  height: auto;
  margin-top: -120px;
  align-self: flex-end;
  margin-right: 5%;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
  pointer-events: none;
}

.start-bottom {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: $spacing-md 0;
  position: relative;
  z-index: 10000;
}

.start-btn {
  width: 160px;
  height: auto;
  cursor: pointer;
  pointer-events: auto;
  margin-top: -120px;
  transition: transform $duration-fast ease;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
  &:active {
    transform: scale(0.95);
  }
}

// ===== 提示浮层 =====
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
  padding: $spacing-md;
  box-shadow: $shadow-float;
}

.tip-title {
  text-align: center;
  font-size: $font-size-lg;
  font-weight: 700;
  color: $color-text;
  margin-bottom: $spacing-sm;
}

.tip-image {
  width: 100%;
  border-radius: $radius-sm;
}

.tip-hint {
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-light;
  margin-top: $spacing-sm;
}

// ===== 游戏页 =====
.game-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  position: relative;
  overflow: hidden;
  padding: max($spacing-sm, env(safe-area-inset-top)) 0 max($spacing-sm, env(safe-area-inset-bottom));
}

.game-guide-panel {
  position: relative;
  width: min(86vw, 350px);
  aspect-ratio: 1402 / 1648;
  flex: 0 1 auto;
  max-height: calc(100% - 138px);
  background-image: url('@/assets/level2/第二关/pic_bg.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.close-btn {
  position: absolute;
  top: 5%;
  right: 5%;
  width: 34px;
  height: auto;
  z-index: 30;
  cursor: pointer;
  pointer-events: auto;
}

.hint-btn {
  position: absolute;
  top: max($spacing-md, env(safe-area-inset-top));
  left: $spacing-md;
  z-index: 30;
  min-width: 52px;
  height: 28px;
  border: 0;
  border-radius: 14px;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  pointer-events: auto;

  &:active {
    transform: scale(0.96);
  }
}

// ===== 拼图区域 =====
.puzzle-area {
  position: absolute;
  left: 50%;
  top: 17%;
  z-index: 10;
  width: 90%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  background-image: url('@/assets/level2/第二关/area.png');
}

.puzzle-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1178 / 1174;
}

.tile {
  position: absolute;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.tile-slot {
  position: absolute;
  overflow: visible;
}

.tile-bg {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.placed-piece {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
}

// ===== 底部材料选择区域 =====
.material-area {
  width: 100%;
  flex-shrink: 0;
  padding: 0 $spacing-sm;
}

.material-panel {
  position: relative;
  width: min(96vw, 430px);
  margin: 0 auto;
}

.material-bg {
  width: 100%;
  height: auto;
  display: block;
}

.material-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 34px;
}

.swiper-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  cursor: pointer;
  pointer-events: auto;
  z-index: 5;
  transition: opacity $duration-fast ease;
  &--left {
    left: 4px;
    transform: translateY(-50%) scaleX(-1);
  }
  &--right {
    right: 4px;
  }
  &--disabled {
    opacity: 0.3;
    pointer-events: none;
  }
  &:active {
    transform: translateY(-50%) scale(0.9);
  }
  &--left:active {
    transform: translateY(-50%) scaleX(-1) scale(0.9);
  }
}

.material-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.material-card {
  position: relative;
  aspect-ratio: 1;
  &--placed {
    opacity: 0.3;
  }
}

.material-slot-bg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  inset: 0;
}

.material-draggable {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  z-index: 1;
  &:active {
    cursor: grabbing;
  }
}

.material-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}

// ===== 拖拽幽灵 =====
.drag-ghost {
  position: fixed;
  z-index: 200;
  pointer-events: none;
  opacity: 0.85;
  transform: scale(1.1);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.ghost-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

// ===== 错误提示 =====
.error-toast {
  position: fixed;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: $font-size-sm;
  padding: 10px 24px;
  border-radius: 20px;
  white-space: nowrap;
  pointer-events: none;
}

.toast-enter-active {
  transition: all 0.3s ease;
}
.toast-leave-active {
  transition: all 0.4s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
