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
      <!-- 关闭按钮 -->
      <img
        class="close-btn"
        src="@/assets/level2/第二关/close.png"
        alt="关闭"
        @click="goHome"
      />

      <!-- 拼图区域 -->
      <div class="puzzle-area">
        <div class="puzzle-container" ref="puzzleContainerRef">
          <!-- 基图（有6个空洞） -->
          <img class="puzzle-base" src="@/assets/level2/第二关/drag_bg.png" alt="拼图基图" />
          <!-- 6个放置区域（绝对定位在基图上） -->
          <div
            v-for="(slot, i) in dropSlots"
            :key="'slot-' + i"
            class="drop-zone"
            :ref="(el) => { if (el) slotRefs[i] = el as HTMLElement }"
            :style="slot.position"
            :class="{ 'drop-zone--filled': slot.filled }"
          >
            <img
              v-if="slot.filled"
              :src="slot.filledSrc"
              class="placed-piece animate-snap"
              :style="{ width: '100%', height: '100%' }"
            />
          </div>
        </div>
      </div>

      <!-- 提示按钮 -->
      <!-- <img
        class="game-tip-btn"
        src="@/assets/level2/第二关/tishi.png"
        alt="提示"
        @click="showTipFromGame = true"
      /> -->

      <!-- 提示浮层 -->
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
          <div class="material-content">
            <!-- 左翻页按钮 -->
            <img
              class="swiper-arrow swiper-arrow--left"
              src="@/assets/level2/第二关/swiper_change.png"
              alt="上一页"
              :class="{ 'swiper-arrow--disabled': materialPage === 0 }"
              @click="materialPage = Math.max(0, materialPage - 1)"
            />
            <!-- 材料卡片（当前页显示4个） -->
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
                  @touchstart.prevent="(e) => onDragStart(e, mat)"
                  @mousedown.prevent="(e) => onDragStart(e, mat)"
                >
                  <img
                    :src="mat.src"
                    :alt="mat.label"
                    class="material-img"
                    :style="getDragStyle(mat.id)"
                  />
                </div>
              </div>
            </div>
            <!-- 右翻页按钮 -->
            <img
              class="swiper-arrow swiper-arrow--right"
              src="@/assets/level2/第二关/swiper_change.png"
              alt="下一页"
              :class="{ 'swiper-arrow--disabled': materialPage >= maxPage }"
              @click="materialPage = Math.min(maxPage, materialPage + 1)"
            />
          </div>
        </div>
      </div>

      <!-- 拖拽中的幽灵图片 -->
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

// 图片资源引入
import center1 from '@/assets/level2/第二关/center1.png'
import center2 from '@/assets/level2/第二关/center2.png'
import center3 from '@/assets/level2/第二关/center3.png'
import bottom1 from '@/assets/level2/第二关/bottom1.png'
import bottom2 from '@/assets/level2/第二关/bottom2.png'
import bottom3 from '@/assets/level2/第二关/bottom3.png'

const router = useRouter()

// 游戏阶段：start → playing → success
const gamePhase = ref<'start' | 'playing' | 'success'>('start')
const showTipFromGame = ref(false)

// ===== 材料定义 =====
// 6块拼图材料，对应基图中的6个空洞位置
interface Material {
  id: string
  src: string
  label: string
  targetSlotIndex: number // 对应 dropSlots 的索引
  placed: boolean
}

const materials = reactive<Material[]>([
  { id: 'c1', src: center1, label: '中间1', targetSlotIndex: 0, placed: false },
  { id: 'c2', src: center2, label: '中间2', targetSlotIndex: 1, placed: false },
  { id: 'c3', src: center3, label: '中间3', targetSlotIndex: 2, placed: false },
  { id: 'b1', src: bottom1, label: '底部1', targetSlotIndex: 3, placed: false },
  { id: 'b2', src: bottom2, label: '底部2', targetSlotIndex: 4, placed: false },
  { id: 'b3', src: bottom3, label: '底部3', targetSlotIndex: 5, placed: false },
])

// 材料分页：每页4个
const materialPage = ref(0)
const PAGE_SIZE = 4
const maxPage = computed(() => Math.ceil(materials.length / PAGE_SIZE) - 1)
const currentPageMaterials = computed(() => {
  const start = materialPage.value * PAGE_SIZE
  return materials.slice(start, start + PAGE_SIZE)
})

// ===== 放置区域定义 =====
// 6个空洞位置（百分比，相对于基图）
// 布局：上排3个（中间行）+ 下排3个（底部行）
interface DropSlot {
  position: {
    left: string
    top: string
    width: string
    height: string
  }
  filled: boolean
  filledSrc: string
  expectedId: string
}

const dropSlots = reactive<DropSlot[]>([
  // 中间行3个空洞（center1, center2, center3）
  { position: { left: '1%', top: '33%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'c1' },
  { position: { left: '34%', top: '33%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'c2' },
  { position: { left: '67%', top: '33%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'c3' },
  // 底部行3个空洞（bottom1, bottom2, bottom3）
  { position: { left: '1%', top: '57%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'b1' },
  { position: { left: '34%', top: '57%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'b2' },
  { position: { left: '67%', top: '57%', width: '31%', height: '22%' }, filled: false, filledSrc: '', expectedId: 'b3' },
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
  offsetX: 0,
  offsetY: 0,
})

function getDragStyle(_id: string) {
  return {}
}

function onDragStart(e: TouchEvent | MouseEvent, mat: Material) {
  if (mat.placed) return

  const pos = 'touches' in e ? e.touches[0] : e
  dragState.active = true
  dragState.matId = mat.id
  dragState.currentX = pos.clientX
  dragState.currentY = pos.clientY
  dragState.ghostSrc = mat.src
  dragState.ghostW = 60
  dragState.ghostH = 60

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

function handleDrop(mat: Material, x: number, y: number) {
  // 找到该材料对应的目标槽位
  const targetIdx = mat.targetSlotIndex
  const slot = dropSlots[targetIdx]
  if (!slot || slot.filled) return

  const el = slotRefs.value[targetIdx]
  if (!el) return

  if (isOverTarget({ x, y }, el, 30)) {
    // 放置成功
    slot.filled = true
    slot.filledSrc = mat.src
    mat.placed = true

    // 检查是否全部完成
    const allFilled = dropSlots.every((s) => s.filled)
    if (allFilled) {
      setTimeout(() => {
        gamePhase.value = 'success'
      }, 800)
    }
  }
}

// ===== 页面操作 =====
function enterLevel() {
  console.log('进入关卡')
  gamePhase.value = 'playing'
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  // 默认进入开始页
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
  // height: auto;
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
  position: relative;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: max($spacing-md, env(safe-area-inset-top));
  left: $spacing-md;
  width: 32px;
  height: 32px;
  z-index: 20;
  cursor: pointer;
  pointer-events: auto;
}

// 拼图区域
.puzzle-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm;
  padding-top: max(40px, env(safe-area-inset-top));
}

.puzzle-container {
  position: relative;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 3 / 4;
}

.puzzle-base {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: $radius-md;
  user-select: none;
  -webkit-user-drag: none;
}

// 放置区域
.drop-zone {
  position: absolute;
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: $radius-sm;
  overflow: hidden;

  &--filled {
    border: none;
  }
}

.placed-piece {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

// 提示按钮
.game-tip-btn {
  position: absolute;
  right: $spacing-md;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  z-index: 20;
  cursor: pointer;
  pointer-events: auto;
}

// ===== 底部材料选择区域 =====
.material-area {
  padding: $spacing-sm;
  padding-bottom: max($spacing-md, env(safe-area-inset-bottom));
}

.material-panel {
  position: relative;
  width: 100%;
  max-width: 400px;
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
  padding: 8px 40px;
  gap: 4px;
}

.swiper-arrow {
  width: 24px;
  height: 24px;
  cursor: pointer;
  pointer-events: auto;
  flex-shrink: 0;
  transition: opacity $duration-fast ease;

  &--left {
    transform: scaleX(-1);
  }

  &--disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.9);
  }

  &--left:active {
    transform: scaleX(-1) scale(0.9);
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
  aspect-ratio: 3 / 4;

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
</style>
