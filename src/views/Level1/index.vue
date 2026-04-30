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
          <div v-if="thermalVisible" class="thermal-scene">
            <div
              class="thermal-window"
              :style="thermalWindowStyle"
            ></div>
            <img
              class="meter-ghost"
              :src="meterImage"
              alt=""
              :style="meterGhostStyle"
            />
            <div
              v-if="!currentHotArea"
              class="normal-temperature"
              :style="normalTemperatureStyle"
            >
              {{ normalTemperature }}°C
            </div>
          </div>

          <template v-if="thermalVisible && currentHotArea">
            <img
              class="temperature-mark temperature-mark--hot"
              :src="temp62Image"
              alt="62度"
            />
            <img class="warning-mark" :src="warningImage" alt="" />
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
            :class="['tool-card', 'tool-card--photo', { 'tool-card--disabled': !canOpenPreview }]"
            type="button"
            @click="openPreview"
          >
            <img :src="cameraToolImage" alt="拍照" />
          </button>
        </div>
      </div>

      <Transition name="toast">
        <div v-if="toastText" class="toast">{{ toastText }}</div>
      </Transition>
    </div>

    <div v-if="previewVisible" class="preview-overlay" @click.self="previewVisible = false">
      <div class="preview-card">
        <img class="preview-success" :src="successImage" alt="检测成功" />
        <button class="upload-button" type="button" @click="submitLevel">
          <img :src="submitImage" alt="点击上传" />
        </button>
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
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ResultModal from '@/components/ResultModal.vue'
import tipImage from '@/assets/level1/第一大关/tishi.png'
import personImage from '@/assets/level1/第一大关/person.png'
import startImage from '@/assets/level1/第一大关/start.png'
import contentImage from '@/assets/level1/第一大关/content.png'
import meterToolImage from '@/assets/level1/第一大关/cewen.png'
import cameraToolImage from '@/assets/level1/第一大关/photo.png'
import meterImage from '@/assets/level1/第一大关/yiqi.png'
import infraredImage from '@/assets/level1/第一大关/hongwai.png'
import submitImage from '@/assets/level1/第一大关/submit.png'
import successImage from '@/assets/level1/第一大关/success.png'
import warningImage from '@/assets/level1/第一大关/warning.png'
import temp62Image from '@/assets/level1/第一大关/62.png'

type Phase = 'start' | 'playing'

const router = useRouter()
const phase = ref<Phase>('start')
const photoAreaRef = ref<HTMLElement | null>(null)
const toastText = ref('')
const hotDetected = ref(false)
const currentHotArea = ref(false)
const normalTemperature = ref(26)
const previewVisible = ref(false)
const levelComplete = ref(false)
const thermalLocked = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const hotArea = {
  left: 0.25,
  top: 0.1,
  width: 0.18,
  height: 0.2,
}

const dragState = reactive({
  active: false,
  inPhotoArea: false,
  x: 0,
  y: 0,
  areaWidth: 0,
  areaHeight: 0,
})

const thermalVisible = computed(() => (dragState.active && dragState.inPhotoArea) || thermalLocked.value)
const canOpenPreview = computed(() => hotDetected.value && thermalLocked.value && currentHotArea.value)
const meterGhostStyle = computed(() => ({
  left: `${dragState.x}px`,
  top: `${dragState.y}px`,
}))
const thermalWindowStyle = computed(() => {
  const windowWidth = dragState.areaWidth * 0.28
  const windowHeight = windowWidth
  const left = dragState.x - windowWidth / 2
  const top = dragState.y - windowHeight / 2

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${windowWidth}px`,
    height: `${windowHeight}px`,
    backgroundImage: `url(${infraredImage})`,
    backgroundSize: `${dragState.areaWidth}px ${dragState.areaHeight}px`,
    backgroundPosition: `${-left}px ${-top}px`,
  }
})
const normalTemperatureStyle = computed(() => ({
  left: `${dragState.x}px`,
  top: `${dragState.y}px`,
}))

function onMeterDragStart(e: TouchEvent | MouseEvent) {
  if (previewVisible.value || levelComplete.value) return

  dragState.active = true
  thermalLocked.value = false
  updateDragPosition(e)

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    updateDragPosition(ev)
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    updateDragPosition(ev)
    thermalLocked.value = dragState.inPhotoArea
    if (!dragState.inPhotoArea) {
      currentHotArea.value = false
    }
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

function updateDragPosition(e: TouchEvent | MouseEvent) {
  const point = getPointer(e)
  const rect = photoAreaRef.value?.getBoundingClientRect()
  if (!point || !rect) return

  dragState.areaWidth = rect.width
  dragState.areaHeight = rect.height
  dragState.inPhotoArea =
    point.clientX >= rect.left &&
    point.clientX <= rect.right &&
    point.clientY >= rect.top &&
    point.clientY <= rect.bottom
  dragState.x = point.clientX - rect.left
  dragState.y = point.clientY - rect.top

  if (dragState.inPhotoArea) {
    updateTemperatureState()
  } else {
    currentHotArea.value = false
  }
}

function getPointer(e: TouchEvent | MouseEvent) {
  if ('changedTouches' in e) {
    return e.changedTouches[0] || e.touches[0]
  }
  return e
}

function updateTemperatureState() {
  if (!dragState.areaWidth || !dragState.areaHeight) return

  const xRatio = dragState.x / dragState.areaWidth
  const yRatio = dragState.y / dragState.areaHeight
  currentHotArea.value =
    xRatio >= hotArea.left &&
    xRatio <= hotArea.left + hotArea.width &&
    yRatio >= hotArea.top &&
    yRatio <= hotArea.top + hotArea.height

  if (currentHotArea.value) {
    if (!hotDetected.value) {
      showToast('已定位异常区域')
    }
    hotDetected.value = true
  } else {
    normalTemperature.value = getNormalTemperature(xRatio, yRatio)
  }
}

function getNormalTemperature(xRatio: number, yRatio: number) {
  const value = Math.floor(((xRatio * 17 + yRatio * 23) % 1) * 11)
  return 20 + value
}

function openPreview() {
  if (!canOpenPreview.value) {
    showToast('请将测温仪停在异常区域')
    return
  }

  previewVisible.value = true
}

function submitLevel() {
  previewVisible.value = false
  levelComplete.value = true
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

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
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

.thermal-scene {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.86);
}

.thermal-window {
  position: absolute;
  z-index: 11;
  border-radius: 50%;
  overflow: hidden;
  background-repeat: no-repeat;
  box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.82);
  pointer-events: none;
}

.meter-ghost {
  position: absolute;
  width: 28%;
  transform: translate(-50%, -50%);
  z-index: 12;
  pointer-events: none;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.34));
}

.temperature-mark {
  position: absolute;
  z-index: 14;
  height: auto;
  pointer-events: none;
}

.temperature-mark--hot {
  left: 36%;
  top: 5%;
  width: 22%;
}

.warning-mark {
  position: absolute;
  left: 29%;
  top: 10%;
  width: 16%;
  z-index: 13;
  pointer-events: none;
  opacity: 0.9;
}

.normal-temperature {
  position: absolute;
  z-index: 14;
  min-width: 56px;
  padding: 5px 9px;
  border: 2px solid rgba(255, 255, 255, 0.88);
  border-radius: 14px;
  color: #f8ffe8;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  background: linear-gradient(180deg, rgba(31, 144, 200, 0.92), rgba(18, 86, 148, 0.92));
  box-shadow: 0 0 12px rgba(42, 196, 255, 0.72), inset 0 0 8px rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.65);
  pointer-events: none;
  transform: translate(-50%, -170%);
}

.toolbar {
  position: absolute;
  inset: 0;
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
  transition: transform $duration-fast ease, opacity $duration-fast ease, filter $duration-fast ease;

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
    opacity: 0.48;
    filter: grayscale(0.25);
  }
}

.tool-card--meter {
  left: 20.7%;
}

.tool-card--photo {
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

.preview-success {
  width: min(88vw, 360px);
  display: block;
  pointer-events: none;
}

.upload-button {
  width: min(42vw, 160px);
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    width: 100%;
    display: block;
  }

  &:active {
    transform: scale(0.96);
  }
}

</style>
