import { reactive, computed } from 'vue'

export type LevelId = 1 | 2 | 3
export type LevelStatus = 'locked' | 'unlocked' | 'completed' | 'failed'

interface GameState {
  currentLevel: LevelId | null
  levels: Record<LevelId, LevelStatus>
}

// 全局游戏状态（单例）
const state = reactive<GameState>({
  currentLevel: null,
  levels: {
    1: 'unlocked',
    2: 'unlocked',
    3: 'unlocked',
  },
})

/**
 * 全局游戏状态管理
 * 管理关卡解锁/完成状态
 */
export function useGameState() {
  const allCompleted = computed(() =>
    Object.values(state.levels).every((s) => s === 'completed')
  )

  function setLevelStatus(level: LevelId, status: LevelStatus) {
    state.levels[level] = status
  }

  function enterLevel(level: LevelId) {
    state.currentLevel = level
  }

  function exitLevel() {
    state.currentLevel = null
  }

  function resetAll() {
    state.currentLevel = null
    state.levels = { 1: 'unlocked', 2: 'unlocked', 3: 'unlocked' }
  }

  return {
    state,
    allCompleted,
    setLevelStatus,
    enterLevel,
    exitLevel,
    resetAll,
  }
}
