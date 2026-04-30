<template>
  <div class="level1 page">
    <div v-if="phase === 'start'" class="start-screen">
      <div class="start-panel">
        <img class="start-tip" :src="tipImage" alt="课堂说明" />
        <img class="start-person" :src="personImage" alt="" />
      </div>
      <button class="start-button" type="button" @click="phase = 'playing'">
        <img :src="startImage" alt="开始挑战" />
      </button>
    </div>

    <div v-else class="game-area">
      <div class="game-board">
        <img class="game-bg" :src="contentImage" alt="日常巡检" />
        <button class="close-hit" type="button" aria-label="关闭" @click="goHome"></button>

        <div ref="photoAreaRef" class="photo-area">
          <div
            v-for="point in temperaturePoints"
            :key="`debug-${point.id}`"
            class="debug-hit-area"
            :style="getHitAreaStyle(point)"
          >
            {{ point.temperature }}°C
          </div>

          <img
            v-if="dragState.active && dragState.inPhotoArea"
            class="meter-ghost"
            :src="meterImage"
            alt=""
            :style="meterGhostStyle"
          />

          <template v-for="point in temperaturePoints" :key="point.id">
            <img
              v-if="point.found"
              class="temperature-mark"
              :class="`temperature-mark--${point.id}`"
              :src="point.labelImage"
              :alt="`${point.temperature}度`"
              :style="point.labelStyle"
            />
            <img
              v-if="point.id === 'hot' && point.found"
              class="warning-mark"
              :src="warningImage"
              alt=""
            />
          </template>
        </div>

        <div class="toolbar">
          <button
            class="tool-card tool-card--meter"
            type="button"
            @touchstart.prevent="onMeterDragStart"
            @mousedown.prevent="onMeterDragStart"
          >
            <img :src="meterToolImage" alt="测温仪" />
          </button>
          <button
            :class="['tool-card', 'tool-card--camera', { 'tool-card--disabled': !canUseCamera }]"
            type="button"
            @click="openPreview"
          >
            <img :src="cameraToolImage" alt="照相机" />
          </button>
        </div>
      </div>

      <Transition name="toast">
        <div v-if="toastText" class="toast">{{ toastText }}</div>
      </Transition>
    </div>

    <div v-if="phase === 'preview'" class="preview-overlay" @click.self="phase = 'playing'">
      <div class="preview-card">
        <div class="preview-board">
          <img class="preview-bg" :src="contentImage" alt="测温结果" />
          <div class="preview-photo">
            <img
              v-for="point in temperaturePoints"
              :key="point.id"
              class="temperature-mark"
              :class="`temperature-mark--${point.id}`"
              :src="point.labelImage"
              :alt="`${point.temperature}度`"
              :style="point.labelStyle"
            />
            <img class="warning-mark" :src="warningImage" alt="" />
          </div>
        </div>
        <button class="submit-button" type="button" @click="levelComplete = true">完成</button>
      </div>
    </div>

    <ResultModal
      v-if="levelComplete"
      :success="true"
      :level="1"
      message="日常巡检挑战成功！"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ResultModal from '@/components/ResultModal.vue'
import tipImage from '@/assets/level1/第一大关/tishi.png'
import personImage from '@/assets/level1/第一大关/person.png'
import startImage from '@/assets/level1/第一大关/start.png'
import contentImage from '@/assets/level1/第一大关/content.png'
import meterToolImage from '@/assets/level1/第一大关/cewen.png'
import cameraToolImage from '@/assets/level1/第一大关/photo.png'
import meterImage from '@/assets/level1/第一大关/yiqi.png'
import warningImage from '@/assets/level1/第一大关/warning.png'
import temp102Image from '@/assets/level1/第一大关/102.png'
import temp50Image from '@/assets/level1/第一大关/50.png'
import temp20Image from '@/assets/level1/第一大关/20.png'

type Phase = 'start' | 'playing' | 'preview'

interface TemperaturePoint {
  id: 'hot' | 'warm' | 'normal'
  temperature: number
  found: boolean
  labelImage: string
  hitArea: {
    left: number
    top: number
    width: number
    height: number
  }
  labelStyle: Record<string, string>
}

const router = useRouter()
const phase = ref<Phase>('start')
const photoAreaRef = ref<HTMLElement | null>(null)
const toastText = ref('')
const levelComplete = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const temperaturePoints = reactive<TemperaturePoint[]>([
  {
    id: 'hot',
    temperature: 102,
    found: false,
    labelImage: temp102Image,
    hitArea: { left: 0.25, top: 0.1, width: 0.18, height: 0.2 },
    labelStyle: { left: '36%', top: '5%', width: '22%' },
  },
  {
    id: 'warm',
    temperature: 50,
    found: false,
    labelImage: temp50Image,
    hitArea: { left: 0.21, top: 0.45, width: 0.22, height: 0.18 },
    labelStyle: { left: '27%', top: '42%', width: '22%' },
  },
  {
    id: 'normal',
    temperature: 20,
    found: false,
    labelImage: temp20Image,
    hitArea: { left: 0.77, top: 0.47, width: 0.17, height: 0.18 },
    labelStyle: { left: '68.5%', top: '52%', width: '24%' },
  },
])

const dragState = reactive({
  active: false,
  inPhotoArea: false,
  x: 0,
  y: 0,
})

const canUseCamera = computed(() => temperaturePoints.every((point) => point.found))
const meterGhostStyle = computed(() => ({
  left: `${dragState.x}px`,
  top: `${dragState.y}px`,
}))

function getHitAreaStyle(point: TemperaturePoint) {
  return {
    left: `${point.hitArea.left * 100}%`,
    top: `${point.hitArea.top * 100}%`,
    width: `${point.hitArea.width * 100}%`,
    height: `${point.hitArea.height * 100}%`,
  }
}

function onMeterDragStart(e: TouchEvent | MouseEvent) {
  dragState.active = true
  updateDragPosition(e)

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    updateDragPosition(ev)
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    updateDragPosition(ev)
    measurePoint()
    dragState.active = false
    dragState.inPhotoArea = false
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

function updateDragPosition(e: TouchEvent | MouseEvent) {
  const point = getPointer(e)
  const rect = photoAreaRef.value?.getBoundingClientRect()
  if (!rect) return

  dragState.inPhotoArea =
    point.clientX >= rect.left &&
    point.clientX <= rect.right &&
    point.clientY >= rect.top &&
    point.clientY <= rect.bottom
  dragState.x = point.clientX - rect.left
  dragState.y = point.clientY - rect.top
}

function getPointer(e: TouchEvent | MouseEvent) {
  if (e instanceof TouchEvent) {
    return e.changedTouches[0] || e.touches[0]
  }
  return e
}

function measurePoint() {
  const rect = photoAreaRef.value?.getBoundingClientRect()
  if (!rect || !dragState.inPhotoArea) return

  const xRatio = dragState.x / rect.width
  const yRatio = dragState.y / rect.height
  const target = temperaturePoints.find((point) => {
    const area = point.hitArea
    return (
      !point.found &&
      xRatio >= area.left &&
      xRatio <= area.left + area.width &&
      yRatio >= area.top &&
      yRatio <= area.top + area.height
    )
  })

  if (target) {
    target.found = true
    showToast(`${target.temperature}°C`)
  } else {
    showToast('未检测到测温点')
  }
}

function openPreview() {
  if (!canUseCamera.value) {
    showToast('请先完成三个测温点')
    return
  }
  phase.value = 'preview'
}

function showToast(text: string) {
  if (toastTimer) clearTimeout(toastTimer)
  toastText.value = text
  toastTimer = setTimeout(() => {
    toastText.value = ''
  }, 1200)
}

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.level1 {
  background-image: url('@/assets/level1/第一大关/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.start-screen,
.game-area {
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

.start-panel {
  position: relative;
  width: min(92vw, 390px);
  aspect-ratio: 1401 / 1648;
}

.start-tip {
  width: 100%;
  display: block;
  pointer-events: none;
}

.start-person {
  position: absolute;
  right: -2%;
  bottom: -8%;
  width: 34%;
  pointer-events: none;
}

.start-button {
  position: relative;
  z-index: 2;
  width: min(56vw, 230px);
  margin-top: -4px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;

  img {
    width: 100%;
    display: block;
  }

  &:active {
    transform: scale(0.97);
  }
}

.game-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(8px, env(safe-area-inset-top)) 0 max(8px, env(safe-area-inset-bottom));
}

.game-board {
  position: relative;
  width: min(100vw, calc(100dvh * 1500 / 2667));
  max-height: 100%;
  aspect-ratio: 1500 / 2667;
}

.game-bg {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.close-hit {
  position: absolute;
  top: 13.2%;
  right: 2%;
  width: 11%;
  aspect-ratio: 1;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
}

.photo-area {
  position: absolute;
  left: 8.8%;
  top: 22.58%;
  width: 82.35%;
  height: 46.76%;
  overflow: hidden;
}

.meter-ghost {
  position: absolute;
  width: 24%;
  transform: translate(-50%, -50%);
  z-index: 20;
  pointer-events: none;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.28));
}

.temperature-mark {
  position: absolute;
  z-index: 12;
  height: auto;
  pointer-events: none;
}

.warning-mark {
  position: absolute;
  left: 29%;
  top: 10%;
  width: 16%;
  z-index: 11;
  pointer-events: none;
  opacity: 0.9;
}

.toolbar {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.debug-hit-area {
  position: absolute;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(0, 180, 255, 0.95);
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  background: rgba(0, 150, 255, 0.18);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.75);
  pointer-events: none;
}

.tool-card {
  position: absolute;
  top: 75.62%;
  width: 30.5%;
  height: 13.2%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: grab;
  pointer-events: auto;
  transition: transform $duration-fast ease, opacity $duration-fast ease;

  img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: contain;
  }

  &:active {
    transform: scale(0.96);
  }

  &--disabled {
    opacity: 0.45;
  }
}

.tool-card--meter {
  left: 20.7%;
}

.tool-card--camera {
  left: 54%;
}

.toast {
  position: fixed;
  top: 20%;
  left: 50%;
  z-index: 80;
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

.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.68);
}

.preview-card {
  width: min(92vw, 390px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-board {
  position: relative;
  width: 100%;
  aspect-ratio: 1500 / 2667;
}

.preview-bg {
  width: 100%;
  height: 100%;
  display: block;
}

.preview-photo {
  position: absolute;
  left: 8.8%;
  top: 22.58%;
  width: 82.35%;
  height: 46.76%;
  overflow: hidden;
}

.submit-button {
  width: 120px;
  height: 40px;
  border: 0;
  border-radius: 20px;
  color: #fff;
  font-size: $font-size-base;
  font-weight: 700;
  background: #ff5a16;
  box-shadow: 0 4px 0 #c53209;
  cursor: pointer;
}
</style>
