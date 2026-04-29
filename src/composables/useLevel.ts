import { ref, onUnmounted } from 'vue'

export type LevelPhase = 'loading' | 'lesson' | 'playing' | 'success' | 'failed'

/**
 * 关卡通用逻辑
 * 管理关卡生命周期：加载 → 课堂讲解 → 游戏中 → 结果
 */
export function useLevel() {
  const phase = ref<LevelPhase>('loading')
  const timer = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // 模拟加载动画
  function startLoading(duration = 1500): Promise<void> {
    phase.value = 'loading'
    return new Promise((resolve) => {
      setTimeout(() => {
        phase.value = 'lesson'
        resolve()
      }, duration)
    })
  }

  // 从课堂讲解进入游戏
  function startPlaying() {
    phase.value = 'playing'
    timer.value = 0
    timerInterval = setInterval(() => {
      timer.value++
    }, 1000)
  }

  // 通关成功
  function completeLevel() {
    phase.value = 'success'
    stopTimer()
  }

  // 闯关失败
  function failLevel() {
    phase.value = 'failed'
    stopTimer()
  }

  // 重新开始当前关卡
  function retry() {
    phase.value = 'lesson'
    timer.value = 0
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  onUnmounted(() => {
    stopTimer()
  })

  return {
    phase,
    timer,
    startLoading,
    startPlaying,
    completeLevel,
    failLevel,
    retry,
  }
}
