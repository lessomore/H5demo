<template>
  <div class="result-overlay">
    <div v-if="success" class="success-modal animate-bounce-in">
      <img class="success-bg" :src="successBg" alt="闯关成功" />
      <button class="continue-btn" type="button" @click="$emit('next')">
        <img :src="continueImage" alt="继续" />
      </button>
    </div>

    <div v-else class="fail-modal animate-bounce-in">
      <h2 class="fail-title">闯关失败</h2>
      <p class="fail-desc">{{ message }}</p>
      <div class="fail-actions">
        <button class="btn-pixar" type="button" @click="$emit('retry')">重新挑战</button>
        <button class="btn-pixar btn-pixar--primary" type="button" @click="$emit('next')">返回首页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import level1Image from '@/assets/all/level1.png'
import level2Image from '@/assets/all/level2.png'
import level3Image from '@/assets/all/level3.png'
import continueImage from '@/assets/all/jixu.png'

const props = withDefaults(defineProps<{
  success: boolean
  message?: string
  level?: 1 | 2 | 3
}>(), {
  level: 1,
})

defineEmits<{
  retry: []
  next: []
}>()

const successBg = computed(() => {
  if (props.level === 2) return level2Image
  if (props.level === 3) return level3Image
  return level1Image
})
</script>

<style lang="scss" scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-lg;
  background: rgba(0, 0, 0, 0.58);
}

.success-modal {
  position: relative;
  width: min(82vw, 340px);
  aspect-ratio: 994 / 1109;
}

.success-bg {
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
}

.continue-btn {
  position: absolute;
  left: 50%;
  bottom: 11%;
  width: 54%;
  padding: 0;
  border: 0;
  background: transparent;
  transform: translateX(-50%);
  cursor: pointer;
  pointer-events: auto;

  img {
    width: 100%;
    display: block;
  }

  &:active {
    transform: translateX(-50%) scale(0.96);
  }
}

.fail-modal {
  width: min(86vw, 320px);
  padding: $spacing-xl;
  border-radius: $radius-lg;
  text-align: center;
  background: $color-bg-card;
  box-shadow: $shadow-float;
}

.fail-title {
  font-size: $font-size-xl;
  font-weight: 700;
  margin-bottom: $spacing-sm;
}

.fail-desc {
  font-size: $font-size-sm;
  color: $color-text-light;
  margin-bottom: $spacing-lg;
}

.fail-actions {
  display: flex;
  gap: $spacing-sm;

  .btn-pixar {
    flex: 1;
    font-size: $font-size-base;
    padding: 10px 16px;
  }
}
</style>
