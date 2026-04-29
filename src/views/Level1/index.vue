<template>
  <div class="level1 page">
    <!-- 加载阶段 -->
    <GameLoading v-if="phase === 'loading'" />

    <!-- 课堂讲解阶段 -->
    <LessonDialog
      v-if="phase === 'lesson'"
      content="规范巡检是变电运维的核心技能。巡检需严格按照标准路线行进，借助红外测温仪细致排查设备隐患，发现缺陷问题及时拍照记录、上传报备。"
      button-text="开始巡检"
      @start="startPlaying"
    />

    <!-- 游戏阶段 -->
    <div v-if="phase === 'playing'" class="game-area">
      <!-- 变电站设备图片区域 -->
      <div class="device-scene" ref="sceneRef">
        <!-- 设备图片占位（后续替换为真实图片） -->
        <div class="device-image">
          <div class="device-placeholder">
            <p>🏭 变电站设备图</p>
            <p class="hint">将红外测温仪拖拽到设备上检测温度</p>
          </div>

          <!-- 热点区域（引流线夹 — 高温点） -->
          <div
            class="hotspot hotspot--danger"
            ref="hotspotRef"
            :class="{ 'hotspot--found': hotspotFound }"
          >
            <span v-if="thermalActive && isOverHotspot" class="temp-badge temp-badge--danger">
              {{ hotspotTemp }}°C
            </span>
          </div>

          <!-- 正常温度区域 -->
          <div class="hotspot hotspot--normal" style="top: 30%; left: 20%">
            <span v-if="thermalActive && thermalPos.near === 'normal1'" class="temp-badge">
              {{ normalTemp1 }}°C
            </span>
          </div>

          <!-- 红外测温仪叠加层 -->
          <div
            v-if="thermalActive"
            class="thermal-overlay"
            :style="thermalOverlayStyle"
          >
            <div class="thermal-circle">
              <div class="thermal-crosshair">+</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 装备栏 -->
      <div class="toolbar-area">
        <div class="tool-items">
          <div
            class="tool-btn"
            :class="{ 'tool-btn--active': activeTool === 'thermal' }"
            @touchstart.prevent="onToolDragStart($event, 'thermal')"
            @mousedown.prevent="onToolDragStart($event, 'thermal')"
          >
            <span class="tool-icon">🌡️</span>
            <span class="tool-label">红外测温仪</span>
          </div>
          <div
            class="tool-btn"
            :class="{ 'tool-btn--active': activeTool === 'camera', 'tool-btn--disabled': !hotspotFound }"
            @click="onCameraClick"
          >
            <span class="tool-icon">📷</span>
            <span class="tool-label">拍照</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 拍照上报弹窗 -->
    <div v-if="showReport" class="report-overlay">
      <div class="report-card card-pixar animate-bounce-in">
        <div class="report-image">
          <div class="report-thermal">
            <p>🌡️ 红外测温图</p>
            <p class="report-temp">温度：{{ capturedTemp }}°C</p>
          </div>
        </div>
        <p class="report-status" :class="capturedTemp >= 100 ? 'status-danger' : 'status-normal'">
          {{ capturedTemp >= 100 ? '⚠️ 设备存在异常' : '设备温度正常' }}
        </p>
        <button class="btn-pixar" @click="submitReport">提交</button>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <ResultModal
      v-if="phase === 'success' || phase === 'failed'"
      :success="phase === 'success'"
      :message="phase === 'success' ? '成功发现设备异常并上报！' : '未找到发热点或未正确拍照上报'"
      @retry="retry"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLevel } from '@/composables/useLevel'
import GameLoading from '@/components/GameLoading.vue'
import LessonDialog from '@/components/LessonDialog.vue'
import ResultModal from '@/components/ResultModal.vue'

const router = useRouter()
const { phase, startLoading, startPlaying, completeLevel, failLevel, retry: retryLevel } = useLevel()

// 工具状态
const activeTool = ref<'thermal' | 'camera' | null>(null)
const thermalActive = ref(false)
const thermalPos = ref({ x: 0, y: 0, near: '' })
const hotspotFound = ref(false)
const isOverHotspot = ref(false)
const showReport = ref(false)
const capturedTemp = ref(0)

// 温度数据
const hotspotTemp = 105 // 引流线夹高温
const normalTemp1 = 22

const sceneRef = ref<HTMLElement>()
const hotspotRef = ref<HTMLElement>()

const thermalOverlayStyle = computed(() => ({
  left: `${thermalPos.value.x - 50}px`,
  top: `${thermalPos.value.y - 50}px`,
}))

onMounted(() => {
  startLoading(1500)
})

// 拖拽测温仪
function onToolDragStart(_e: TouchEvent | MouseEvent, tool: string) {
  if (tool !== 'thermal') return
  activeTool.value = 'thermal'
  thermalActive.value = true

  const onMove = (ev: TouchEvent | MouseEvent) => {
    const pos = 'touches' in ev ? ev.touches[0] : ev
    if (!sceneRef.value) return
    const rect = sceneRef.value.getBoundingClientRect()
    thermalPos.value = {
      x: pos.clientX - rect.left,
      y: pos.clientY - rect.top,
      near: '',
    }

    // 检测是否在高温热点上
    if (hotspotRef.value) {
      const hr = hotspotRef.value.getBoundingClientRect()
      const cx = pos.clientX
      const cy = pos.clientY
      isOverHotspot.value =
        cx > hr.left - 20 && cx < hr.right + 20 &&
        cy > hr.top - 20 && cy < hr.bottom + 20

      if (isOverHotspot.value) {
        hotspotFound.value = true
      }
    }
  }

  const onEnd = () => {
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

function onCameraClick() {
  if (!hotspotFound.value) {
    // 没找到发热点就拍照 → 失败
    capturedTemp.value = normalTemp1
    showReport.value = true
    return
  }
  capturedTemp.value = hotspotTemp
  showReport.value = true
}

function submitReport() {
  showReport.value = false
  if (capturedTemp.value >= 100) {
    completeLevel()
  } else {
    failLevel()
  }
}

function retry() {
  hotspotFound.value = false
  isOverHotspot.value = false
  thermalActive.value = false
  capturedTemp.value = 0
  retryLevel()
}

function goHome() {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.level1 {
  background: linear-gradient(180deg, #e8f0fe 0%, #d0e2f7 100%);
}

.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.device-scene {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.device-image {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(180deg, #c5d5e8 0%, #a8bdd4 100%);
}

.device-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $color-text-light;
  font-size: $font-size-lg;

  .hint {
    font-size: $font-size-sm;
    margin-top: $spacing-sm;
    opacity: 0.7;
  }
}

// 热点区域
.hotspot {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  // 默认不可见，只有测温仪靠近才显示温度
  &--danger {
    top: 55%;
    right: 25%;
  }

  &--normal {
    top: 30%;
    left: 20%;
  }

  &--found {
    background: rgba(255, 0, 0, 0.1);
    border: 2px dashed rgba(255, 0, 0, 0.3);
  }
}

.temp-badge {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #4ade80;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: $font-size-sm;
  font-weight: 700;
  white-space: nowrap;

  &--danger {
    color: #ff4444;
    background: rgba(255, 0, 0, 0.15);
    border: 1px solid rgba(255, 0, 0, 0.3);
  }
}

// 红外测温叠加层
.thermal-overlay {
  position: absolute;
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 10;
}

.thermal-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid rgba(255, 100, 0, 0.6);
  background: radial-gradient(circle, rgba(255, 100, 0, 0.15) 0%, transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thermal-crosshair {
  color: rgba(255, 100, 0, 0.8);
  font-size: 24px;
  font-weight: 300;
}

// 装备栏
.toolbar-area {
  height: $toolbar-height;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: $spacing-sm $spacing-md;
  padding-bottom: max($spacing-sm, env(safe-area-inset-bottom));
}

.tool-items {
  display: flex;
  gap: $spacing-md;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: $spacing-sm $spacing-md;
  border-radius: $radius-sm;
  background: rgba($color-primary, 0.05);
  border: 2px solid transparent;
  cursor: grab;
  touch-action: none;
  transition: all $duration-fast ease;

  &--active {
    border-color: $color-primary;
    background: rgba($color-primary, 0.1);
  }

  &--disabled {
    opacity: 0.4;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.95);
  }
}

.tool-icon {
  font-size: 28px;
}

.tool-label {
  font-size: $font-size-xs;
  color: $color-text-light;
}

// 拍照上报弹窗
.report-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: $spacing-lg;
}

.report-card {
  width: 100%;
  max-width: 300px;
  padding: $spacing-lg;
  text-align: center;
}

.report-image {
  background: #1a1a2e;
  border-radius: $radius-sm;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
}

.report-thermal {
  color: #ff6b35;
  font-size: $font-size-base;
}

.report-temp {
  font-size: $font-size-lg;
  font-weight: 700;
  margin-top: $spacing-sm;
}

.report-status {
  font-size: $font-size-base;
  font-weight: 600;
  margin-bottom: $spacing-lg;
  padding: $spacing-sm;
  border-radius: $radius-sm;
}

.status-danger {
  color: $color-danger;
  background: rgba($color-danger, 0.1);
}

.status-normal {
  color: $color-success;
  background: rgba($color-success, 0.1);
}
</style>
