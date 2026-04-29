<template>
  <div class="level3 page">
    <!-- 加载 -->
    <GameLoading v-if="phase === 'loading'" />

    <!-- 课堂讲解 -->
    <LessonDialog
      v-if="phase === 'lesson'"
      content="岗位操作，规章为要。倒闸作业严格恪守两票三制，正确选用合格安全工器具，牢记标准操作顺序：先拉闸、再验电、后接地，严守安全作业准则。"
      button-text="选择设备"
      @start="enterToolSelect"
    />

    <!-- 画面2：工具选择 -->
    <div v-if="gamePhase === 'select'" class="game-area">
      <h3 class="phase-title">选择正确的安全工器具</h3>
      <div class="tool-grid">
        <div
          v-for="tool in allTools"
          :key="tool.id"
          class="select-tool"
          :class="{
            'select-tool--correct': tool.selected && tool.correct,
            'select-tool--wrong': tool.showError,
          }"
          @click="onToolClick(tool)"
        >
          <span class="select-icon">{{ tool.icon }}</span>
          <span class="select-name">{{ tool.name }}</span>
          <span v-if="tool.selected" class="check-mark">✓</span>
        </div>
      </div>

      <!-- 已选装备栏 -->
      <div class="selected-bar">
        <div class="selected-label">已选装备：</div>
        <div class="selected-items">
          <span
            v-for="t in selectedTools"
            :key="t.id"
            class="selected-tag"
          >
            {{ t.icon }} {{ t.name }}
          </span>
          <span v-if="selectedTools.length === 0" class="empty-hint">请点击上方工具选择</span>
        </div>
      </div>

      <button
        class="btn-pixar"
        :disabled="!allCorrectSelected"
        @click="enterOperation"
      >
        开始操作
      </button>

      <!-- 错误提示 -->
      <p v-if="selectError" class="error-tip animate-shake">
        ⚠️ 请选择适配工作场景工具
      </p>
    </div>

    <!-- 画面3：倒闸操作场景 -->
    <div v-if="gamePhase === 'operate'" class="game-area">
      <div class="scene-area">
        <!-- 操作场景 -->
        <div class="switch-scene" ref="sceneRef">
          <div class="scene-bg">
            <!-- 场景元素 -->
            <div class="scene-element switch-blade" ref="switchRef">
              <span class="element-label">刀闸</span>
            </div>
            <div class="scene-element bus-bar">
              <span class="element-label">母线</span>
            </div>
            <div class="scene-element ground-point" ref="groundRef">
              <span class="element-label">接地点</span>
            </div>
            <div class="scene-element supervisor">
              <span class="element-label">👷 监护人</span>
            </div>
          </div>

          <!-- 操作提示 -->
          <div class="operation-hint">
            <p>{{ currentHint }}</p>
          </div>

          <!-- 操作反馈 -->
          <div v-if="operationFeedback" class="operation-feedback animate-bounce-in">
            {{ operationFeedback }}
          </div>
        </div>
      </div>

      <!-- 装备栏（可拖拽） -->
      <div class="operate-toolbar">
        <div
          v-for="tool in operateTools"
          :key="tool.id"
          class="operate-tool"
          :class="{
            'operate-tool--used': tool.used,
            'operate-tool--active': tool.id === currentStep,
          }"
          :style="getDragStyle(tool.id)"
          @touchstart.prevent="(e) => onOperateDrag(e, tool)"
          @mousedown.prevent="(e) => onOperateDrag(e, tool)"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span class="tool-name">{{ tool.name }}</span>
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <ResultModal
      v-if="phase === 'success' || phase === 'failed'"
      :success="phase === 'success'"
      :message="phase === 'success' ? '倒闸操作规范完成！' : '操作顺序错误，请严格按照规程执行'"
      @retry="retryAll"
      @next="goHome"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLevel } from '@/composables/useLevel'
import { isOverTarget } from '@/composables/useDrag'
import GameLoading from '@/components/GameLoading.vue'
import LessonDialog from '@/components/LessonDialog.vue'
import ResultModal from '@/components/ResultModal.vue'

const router = useRouter()
const { phase, startLoading, startPlaying, completeLevel, failLevel, retry } = useLevel()

const gamePhase = ref<'none' | 'select' | 'operate'>('none')
const selectError = ref(false)
const operationFeedback = ref('')

// 所有可选工具
const allTools = reactive([
  { id: 'ticket', name: '工作票操作票', icon: '📋', correct: true, selected: false, showError: false },
  { id: 'gloves', name: '绝缘手套', icon: '🧤', correct: true, selected: false, showError: false },
  { id: 'nylon', name: '尼龙手套', icon: '🧤', correct: false, selected: false, showError: false },
  { id: 'tester', name: '验电笔', icon: '🔍', correct: true, selected: false, showError: false },
  { id: 'camera', name: '相机', icon: '📷', correct: false, selected: false, showError: false },
  { id: 'ground', name: '接地线', icon: '🔗', correct: true, selected: false, showError: false },
  { id: 'drone', name: '无人机', icon: '🚁', correct: false, selected: false, showError: false },
])

const selectedTools = computed(() => allTools.filter((t) => t.selected && t.correct))
const allCorrectSelected = computed(() => {
  const correctOnes = allTools.filter((t) => t.correct)
  return correctOnes.every((t) => t.selected)
})

function onToolClick(tool: typeof allTools[0]) {
  if (tool.correct) {
    tool.selected = !tool.selected
    selectError.value = false
  } else {
    tool.showError = true
    selectError.value = true
    setTimeout(() => { tool.showError = false }, 1000)
  }
}

function enterToolSelect() {
  startPlaying()
  gamePhase.value = 'select'
}

function enterOperation() {
  gamePhase.value = 'operate'
}

// 操作阶段
const steps = [
  { id: 'gloves', target: 'switch', hint: '步骤1：拖动绝缘手套至刀闸完成拉闸', feedback: '✅ 拉闸完成' },
  { id: 'tester', target: 'switch', hint: '步骤2：拖动验电笔至刀闸验电', feedback: '✅ 设备无电' },
  { id: 'ground', target: 'ground', hint: '步骤3：拖动接地线至刀闸线路侧', feedback: '🎉 闯关成功！' },
]

const stepIndex = ref(0)
const currentStep = computed(() => steps[stepIndex.value]?.id ?? '')
const currentHint = computed(() => steps[stepIndex.value]?.hint ?? '')

const operateTools = reactive([
  { id: 'gloves', name: '绝缘手套', icon: '🧤', used: false },
  { id: 'tester', name: '验电笔', icon: '🔍', used: false },
  { id: 'ground', name: '接地线', icon: '🔗', used: false },
])

const switchRef = ref<HTMLElement>()
const groundRef = ref<HTMLElement>()
const dragOffsets = reactive<Record<string, { x: number; y: number }>>({})
const draggingId = ref<string | null>(null)

function getDragStyle(id: string) {
  if (draggingId.value !== id || !dragOffsets[id]) return {}
  return {
    transform: `translate(${dragOffsets[id].x}px, ${dragOffsets[id].y}px) scale(1.1)`,
    zIndex: 100,
    transition: 'none',
  }
}

function onOperateDrag(e: TouchEvent | MouseEvent, tool: typeof operateTools[0]) {
  if (tool.used) return
  const pos = 'touches' in e ? e.touches[0] : e
  const startX = pos.clientX
  const startY = pos.clientY
  draggingId.value = tool.id
  dragOffsets[tool.id] = { x: 0, y: 0 }

  const onMove = (ev: TouchEvent | MouseEvent) => {
    ev.preventDefault()
    const p = 'touches' in ev ? ev.touches[0] : ev
    dragOffsets[tool.id] = { x: p.clientX - startX, y: p.clientY - startY }
  }

  const onEnd = (ev: TouchEvent | MouseEvent) => {
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)

    const p = 'changedTouches' in ev ? ev.changedTouches[0] : ev
    handleOperationDrop(tool, p.clientX, p.clientY)
    draggingId.value = null
    delete dragOffsets[tool.id]
  }

  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
}

function handleOperationDrop(tool: typeof operateTools[0], x: number, y: number) {
  const expected = steps[stepIndex.value]
  if (!expected) return

  // 检查是否是正确的工具
  if (tool.id !== expected.id) {
    showFeedback('⚠️ 操作顺序错误！')
    setTimeout(() => failLevel(), 1200)
    return
  }

  // 检查是否拖到了正确的目标
  const targetMap: Record<string, HTMLElement | undefined> = {
    switch: switchRef.value,
    ground: groundRef.value,
  }
  const targetEl = targetMap[expected.target]
  if (!targetEl || !isOverTarget({ x, y }, targetEl, 50)) {
    showFeedback('请拖拽到正确的位置')
    return
  }

  // 操作成功
  tool.used = true
  showFeedback(expected.feedback)

  if (stepIndex.value >= steps.length - 1) {
    setTimeout(() => completeLevel(), 1000)
  } else {
    stepIndex.value++
  }
}

function showFeedback(msg: string) {
  operationFeedback.value = msg
  setTimeout(() => { operationFeedback.value = '' }, 2000)
}

function retryAll() {
  gamePhase.value = 'none'
  stepIndex.value = 0
  selectError.value = false
  allTools.forEach((t) => { t.selected = false; t.showError = false })
  operateTools.forEach((t) => { t.used = false })
  retry()
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  startLoading(1500)
})
</script>

<style lang="scss" scoped>
.level3 {
  background: $color-bg-start;
}

.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-md;
  gap: $spacing-md;
  overflow-y: auto;
}

.phase-title {
  font-size: $font-size-lg;
  font-weight: 700;
  text-align: center;
  color: $color-text;
  padding-top: $spacing-md;
}

// 工具选择网格
.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.select-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-md $spacing-sm;
  background: $color-bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-card;
  border: 2px solid transparent;
  position: relative;
  cursor: pointer;
  transition: all $duration-fast ease;

  &--correct {
    border-color: $color-success;
    background: rgba($color-success, 0.05);
  }

  &--wrong {
    border-color: $color-danger;
    animation: shake 0.5s ease;
  }
}

.select-icon { font-size: 32px; }
.select-name {
  font-size: $font-size-xs;
  color: $color-text;
  text-align: center;
  font-weight: 600;
}

.check-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: $color-success;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-bar {
  background: rgba(255, 255, 255, 0.8);
  border-radius: $radius-sm;
  padding: $spacing-sm $spacing-md;
}

.selected-label {
  font-size: $font-size-sm;
  color: $color-text-light;
  margin-bottom: $spacing-xs;
}

.selected-items {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.selected-tag {
  background: rgba($color-primary, 0.1);
  color: $color-primary;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: $font-size-xs;
}

.empty-hint {
  font-size: $font-size-xs;
  color: $color-text-light;
}

.error-tip {
  text-align: center;
  color: $color-danger;
  font-size: $font-size-sm;
  font-weight: 600;
}

// 操作场景
.scene-area { flex: 1; }

.switch-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.scene-bg {
  width: 100%;
  min-height: 220px;
  background: #F0EDEA;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  position: relative;
}

.scene-element {
  background: rgba(255, 255, 255, 0.8);
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: $radius-sm;
  padding: $spacing-md;
  text-align: center;
}

.element-label {
  font-size: $font-size-sm;
  font-weight: 600;
}

.supervisor {
  position: absolute;
  right: $spacing-md;
  top: $spacing-md;
}

.operation-hint {
  text-align: center;
  padding: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-primary;
  font-weight: 600;
}

.operation-feedback {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: $spacing-md $spacing-xl;
  border-radius: $radius-lg;
  font-size: $font-size-lg;
  font-weight: 700;
  z-index: 50;
}

// 操作装备栏
.operate-toolbar {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
  padding: $spacing-md 0;
}

.operate-tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-card;
  border-radius: $radius-sm;
  box-shadow: $shadow-card;
  cursor: grab;
  touch-action: none;
  transition: all $duration-fast ease;
  position: relative;

  &--used {
    opacity: 0.3;
    pointer-events: none;
  }

  &--active {
    box-shadow: 0 0 0 2px $color-primary;
  }

  &:active { cursor: grabbing; }
}

.tool-icon { font-size: 28px; }
.tool-name {
  font-size: $font-size-xs;
  color: $color-text-light;
}
</style>
