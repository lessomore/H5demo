<template>
  <div class="level3 page" :class="{ 'level3--operate': gamePhase === 'operate' }">
    <div v-if="gamePhase === 'start'" class="start-screen">
      <img class="lesson-img" :src="tipImage" alt="课堂说明" />
      <button class="start-btn" type="button" @click="gamePhase = 'select'">
        <img :src="startButtonImage" alt="开始挑战" />
      </button>
    </div>

    <div v-else-if="gamePhase === 'select'" class="select-screen">
      <div class="select-panel">
        <img class="select-bg" :src="selectBgImage" alt="选择设备" />
        <button class="close-btn" type="button" aria-label="关闭" @click="goHome">
          <img :src="closeImage" alt="" />
        </button>

        <div class="select-grid">
          <button
            v-for="tool in selectTools"
            :key="tool.id"
            class="select-tool"
            type="button"
            :class="{ 'select-tool--selected': tool.selected }"
            @click="trySelectTool(tool)"
            @touchstart.prevent="(e) => onSelectDragStart(e, tool)"
            @mousedown.prevent="(e) => onSelectDragStart(e, tool)"
          >
            <img class="select-tool-bg" :src="selectItemBgImage" alt="" />
            <img class="select-tool-icon" :src="tool.image" :alt="tool.name" />
            <span class="select-tool-name">{{ tool.name }}</span>
          </button>
        </div>
      </div>

      <div class="selected-panel">
        <img class="selected-panel-bg" :src="toolBgImage" alt="" />
        <div class="selected-slots" ref="selectedSlotsRef">
          <div v-for="slot in 4" :key="slot" class="selected-slot">
            <img class="selected-slot-bg" :src="selectedItemImage" alt="" />
            <img
              v-if="selectedTools[slot - 1]"
              class="selected-slot-icon"
              :src="selectedTools[slot - 1].image"
              :alt="selectedTools[slot - 1].name"
            />
          </div>
        </div>
      </div>

      <div
        v-if="selectDragState.active"
        class="select-drag-ghost"
        :style="{ left: `${selectDragState.x}px`, top: `${selectDragState.y}px` }"
      >
        <img :src="selectDragState.image" alt="" />
      </div>

    </div>

    <div v-else class="operate-screen">
      <img class="operate-bg" :src="wrapperImage" alt="操作场景" />
      <img class="top-tip" :src="topTipImage" alt="操作提示" />

      <div class="area-layer">
        <div
          v-for="area in operateAreas"
          :key="area.id"
          class="operate-area"
          :class="{ 'operate-area--active': area.active }"
          :style="area.style"
          :ref="(el) => setAreaRef(area.id, el as Element | null)"
        ></div>
      </div>

      <div v-if="showVideoTip" class="video-tip-mask" @click="showVideoTip = false">
        <div class="video-tip" @click.stop>
          <img :src="glovesImage" alt="操作提示" />
        </div>
      </div>

      <div v-if="workerChanged" class="worker-replace-tip">小人占位</div>

      <div class="operate-tool-panel">
        <img class="operate-tool-bg" :src="toolBgImage" alt="" />
        <div class="operate-tools">
          <button
            v-for="tool in selectedTools"
            :key="tool.id"
            class="operate-tool"
            type="button"
          >
            <img class="selected-slot-bg" :src="selectedItemImage" alt="" />
            <img
              class="operate-tool-icon"
              :src="tool.image"
              :alt="tool.name"
              :style="getDragStyle(tool.id)"
              @touchstart.prevent="(e) => onOperateDragStart(e, tool)"
              @mousedown.prevent="(e) => onOperateDragStart(e, tool)"
            />
          </button>
        </div>
      </div>

      <button class="operate-close" type="button" aria-label="关闭" @click="goHome">
        <img :src="closeImage" alt="" />
      </button>
    </div>

    <Transition name="toast">
      <div v-if="toastText" class="toast">{{ toastText }}</div>
    </Transition>
    <ResultModal
      v-if="levelComplete"
      :success="true"
      message="倒闸操作挑战成功！"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ResultModal from '@/components/ResultModal.vue'
import startButtonImage from '@/assets/level2/第二关/start_btn.png'
import tipImage from '@/assets/level3/第三关/tishi.png'
import selectBgImage from '@/assets/level3/第三关/select_bg.png'
import selectItemBgImage from '@/assets/level3/第三关/selectitem_bg.png'
import selectedItemImage from '@/assets/level3/第三关/selectItem.png'
import toolBgImage from '@/assets/level3/第三关/tool_bg.png'
import wrapperImage from '@/assets/level3/第三关/wrapper.png'
import topTipImage from '@/assets/level3/第三关/top_tip.png'
import closeImage from '@/assets/level3/第三关/close.png'
import ticketImage from '@/assets/level3/第三关/工作票操作票.png'
import glovesImage from '@/assets/level3/第三关/绝缘手套.png'
import groundImage from '@/assets/level3/第三关/接地线.png'
import testerImage from '@/assets/level3/第三关/验电笔.png'
import knifeImage from '@/assets/level3/第三关/美工刀.png'
import cameraImage from '@/assets/level3/第三关/相机.png'
import droneImage from '@/assets/level3/第三关/无人机.png'
import tapeImage from '@/assets/level3/第三关/卷尺.png'
import nylonImage from '@/assets/level3/第三关/尼龙手套.png'

type GamePhase = 'start' | 'select' | 'operate'

interface SelectTool {
  id: string
  name: string
  image: string
  correct: boolean
  selected: boolean
  selectedOrder: number
}

interface OperateArea {
  id: string
  active: boolean
  style: Record<string, string>
}

const router = useRouter()
const gamePhase = ref<GamePhase>('start')
const toastText = ref('')
const showVideoTip = ref(false)
const workerChanged = ref(false)
const levelComplete = ref(false)
const selectedSlotsRef = ref<HTMLElement | null>(null)
const selectOrderCounter = ref(0)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const selectTools = reactive<SelectTool[]>([
  { id: 'ground', name: '接地线', image: groundImage, correct: true, selected: false, selectedOrder: 0 },
  { id: 'tester', name: '验电笔', image: testerImage, correct: true, selected: false, selectedOrder: 0 },
  { id: 'knife', name: '美工刀', image: knifeImage, correct: false, selected: false, selectedOrder: 0 },
  { id: 'camera', name: '相机', image: cameraImage, correct: false, selected: false, selectedOrder: 0 },
  { id: 'drone', name: '无人机', image: droneImage, correct: false, selected: false, selectedOrder: 0 },
  { id: 'tape', name: '卷尺', image: tapeImage, correct: false, selected: false, selectedOrder: 0 },
  { id: 'gloves', name: '绝缘手套', image: glovesImage, correct: true, selected: false, selectedOrder: 0 },
  { id: 'ticket', name: '工作票操作票', image: ticketImage, correct: true, selected: false, selectedOrder: 0 },
  { id: 'nylon', name: '尼龙手套', image: nylonImage, correct: false, selected: false, selectedOrder: 0 },
])

const selectedTools = computed(() =>
  selectTools
    .filter((tool) => tool.selected && tool.correct)
    .sort((a, b) => a.selectedOrder - b.selectedOrder)
)

const operateAreas = reactive<OperateArea[]>([
  { id: 'topLeft', active: false, style: { left: '4%', top: '13%', width: '13%', height: '7%' } },
  { id: 'middle', active: false, style: { left: '43%', top: '29%', width: '16%', height: '7%' } },
  { id: 'right', active: false, style: { left: '84%', top: '62%', width: '13%', height: '8%' } },
  { id: 'bottomRight', active: false, style: { left: '50%', top: '68%', width: '13%', height: '8%' } },
])

const completedOperateAreas = reactive({
  right: false,
  middle: false,
  bottomRight: false,
})

const areaRefs = new Map<string, HTMLElement>()
const draggingId = ref('')
const dragOffsets = reactive<Record<string, { x: number; y: number }>>({})
const selectDragState = reactive({
  active: false,
  toolId: '',
  image: '',
  x: 0,
  y: 0,
})

function trySelectTool(tool: SelectTool) {
  if (!tool.correct) {
    showToast('请选择正确的安全工器具')
    return
  }

  if (tool.selected) {
    tool.selected = false
    tool.selectedOrder = 0
    return
  }

  if (selectedTools.value.length >= 4) {
    showToast('设备栏只能选择 4 个设备')
    return
  }

  tool.selected = true
  tool.selectedOrder = ++selectOrderCounter.value
  if (selectedTools.value.length === 4) {
    setTimeout(() => {
      gamePhase.value = 'operate'
    }, 250)
  }
}

function onSelectDragStart(e: TouchEvent | MouseEvent, tool: SelectTool) {
  const start = getPointer(e)
  selectDragState.active = true
  selectDragState.toolId = tool.id
  selectDragState.image = tool.image
  selectDragState.x = start.clientX
  selectDragState.y = start.clientY

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    const point = getPointer(ev)
    selectDragState.x = point.clientX
    selectDragState.y = point.clientY
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    const point = getPointer(ev)
    const slotsRect = selectedSlotsRef.value?.getBoundingClientRect()
    if (
      slotsRect &&
      point.clientX >= slotsRect.left &&
      point.clientX <= slotsRect.right &&
      point.clientY >= slotsRect.top &&
      point.clientY <= slotsRect.bottom
    ) {
      trySelectTool(tool)
    }

    selectDragState.active = false
    selectDragState.toolId = ''
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

function setAreaRef(id: string, el: Element | null) {
  if (el instanceof HTMLElement) {
    areaRefs.set(id, el)
  }
}

function getDragStyle(id: string) {
  const offset = dragOffsets[id]
  if (draggingId.value !== id || !offset) return {}
  return {
    transform: `translate(${offset.x}px, ${offset.y}px) scale(1.06)`,
    zIndex: 80,
    transition: 'none',
  }
}

function onOperateDragStart(e: TouchEvent | MouseEvent, tool: SelectTool) {
  const start = getPointer(e)
  draggingId.value = tool.id
  dragOffsets[tool.id] = { x: 0, y: 0 }

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    const point = getPointer(ev)
    dragOffsets[tool.id] = {
      x: point.clientX - start.clientX,
      y: point.clientY - start.clientY,
    }
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    const point = getPointer(ev)
    handleToolDrop(tool, point.clientX, point.clientY)
    draggingId.value = ''
    delete dragOffsets[tool.id]
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

function handleToolDrop(tool: SelectTool, x: number, y: number) {
  const targetArea = operateAreas.find((area) => {
    const el = areaRefs.get(area.id)
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  })

  if (!targetArea) return

  if (targetArea.id === 'right' && tool.id === 'gloves') {
    targetArea.active = true
    completedOperateAreas.right = true
    showVideoTip.value = true
    checkOperateComplete()
    return
  }

  if (targetArea.id === 'middle' && tool.id === 'tester') {
    targetArea.active = true
    completedOperateAreas.middle = true
    showToast('验电成功，电压 0V')
    checkOperateComplete()
    return
  }

  if (targetArea.id === 'bottomRight' && tool.id === 'ticket') {
    targetArea.active = true
    completedOperateAreas.bottomRight = true
    workerChanged.value = true
    showToast('工作票操作票确认完成')
    checkOperateComplete()
    return
  }

  showToast('错误区域')
}

function checkOperateComplete() {
  if (completedOperateAreas.right && completedOperateAreas.middle && completedOperateAreas.bottomRight) {
    levelComplete.value = true
    showToast('全部操作完成')
  }
}

function getPointer(e: TouchEvent | MouseEvent) {
  if (e instanceof TouchEvent) {
    return e.changedTouches[0] || e.touches[0]
  }
  return e
}

function showToast(text: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastText.value = text
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1400)
}

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.level3 {
  background-image: url('@/assets/level2/第二关/all_bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.level3--operate {
  background-image: none;
}

.start-screen,
.select-screen,
.operate-screen {
  width: 100%;
  height: 100%;
  position: relative;
}

.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: max(18px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
}

.lesson-img {
  width: min(92vw, 390px);
  display: block;
  pointer-events: none;
}

.start-btn {
  width: min(48vw, 190px);
  margin-top: -24px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;

  img {
    width: 100%;
    display: block;
  }
}

.select-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: max(10px, env(safe-area-inset-top)) 10px max(142px, env(safe-area-inset-bottom));
}

.select-panel {
  position: relative;
  width: min(90vw, 380px);
  aspect-ratio: 1402 / 2020;
  max-height: calc(100dvh - 168px - env(safe-area-inset-top));
  flex-shrink: 0;
}

.select-bg {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
}

.selected-panel-bg,
.operate-bg,
.operate-tool-bg {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}
.select-bg {
  height: 80%;
}

.close-btn {
  position: absolute;
  top: 6.8%;
  right: -5.5%;
  width: 12%;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;

  img {
    width: 100%;
    display: block;
  }
}

.select-grid {
  position: absolute;
  left: 10.8%;
  right: 10.8%;
  top: 16.5%;
  height: 54.5%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 5.8% 6.5%;
}

.select-tool {
  position: relative;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: transform $duration-fast ease, filter $duration-fast ease;

  &:active {
    transform: scale(0.96);
  }
}

.select-tool--selected {
  filter: drop-shadow(0 0 8px rgba(24, 178, 35, 0.95));
}

.select-tool-bg {
  width: 100%;
  height: 100%;
  display: block;
}

.select-tool-icon {
  position: absolute;
  left: 15%;
  top: 12%;
  width: 70%;
  height: 54%;
  object-fit: contain;
  pointer-events: none;
}

.select-tool-name {
  position: absolute;
  left: 4%;
  right: 4%;
  bottom: 8%;
  color: #623a13;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  pointer-events: none;
}

.selected-panel {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(100vw, 430px);
  aspect-ratio: 1500 / 326;
  transform: translateX(-50%);
  flex-shrink: 0;
}

.selected-slots {
  position: absolute;
  left: 6.8%;
  right: 6.8%;
  top: -28%;
  height: 76%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4%;
}

.selected-slot,
.operate-tool {
  position: relative;
  min-width: 0;
}

.selected-slot-bg {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.selected-slot-icon,
.operate-tool-icon {
  position: absolute;
  left: 13%;
  top: 12%;
  width: 74%;
  height: 64%;
  object-fit: contain;
  pointer-events: none;
}

.select-drag-ghost {
  position: fixed;
  z-index: 120;
  width: 72px;
  height: 72px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.3));

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.operate-screen {
  overflow: hidden;
  background: #9ec4ea;
}

.operate-bg {
  object-fit: cover;
}

.top-tip {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  left: 3%;
  width: 75%;
  max-width: 350px;
  pointer-events: none;
}

.area-layer {
  position: absolute;
  inset: 0;
}

.operate-area {
  position: absolute;
  background-image: url('@/assets/level3/第三关/area.gif');
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.72;
  pointer-events: none;
}

.operate-area--active {
  opacity: 1;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.9));
}

.video-tip-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  pointer-events: auto;
}

.video-tip {
  position: absolute;
  top: 13%;
  left: 50%;
  width: min(46vw, 180px);
  aspect-ratio: 16 / 9;
  transform: translateX(-50%);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #fff;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.55);

  img {
    width: 48%;
    height: 70%;
    object-fit: contain;
  }
}

.worker-replace-tip {
  position: absolute;
  left: 38%;
  top: 72%;
  z-index: 35;
  padding: 6px 12px;
  border-radius: 14px;
  color: #fff;
  font-size: $font-size-xs;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.58);
  pointer-events: none;
}

.operate-tool-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 10.5%;
}

.operate-tools {
  position: absolute;
  left: 5%;
  right: 6%;
  top: -30%;
  height: 84%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4%;
}

.operate-tool {
  border: 0;
  padding: 0;
  background: transparent;
  pointer-events: auto;
}

.operate-tool-icon {
  cursor: grab;
  pointer-events: auto;
  transition: transform $duration-fast ease;

  &:active {
    cursor: grabbing;
  }
}

.operate-close {
  position: absolute;
  top: max(14px, env(safe-area-inset-top));
  right: 10px;
  width: 42px;
  padding: 0;
  border: 0;
  background: transparent;
  pointer-events: auto;

  img {
    width: 100%;
    display: block;
  }
}

.toast {
  position: fixed;
  left: 50%;
  top: 18%;
  z-index: 100;
  transform: translateX(-50%);
  padding: 8px 18px;
  border-radius: 18px;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.72);
  white-space: nowrap;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

</style>
