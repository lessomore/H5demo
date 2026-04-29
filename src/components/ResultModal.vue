<template>
  <div class="result-overlay">
    <div class="result-modal animate-bounce-in">
      <div class="result-icon" :class="success ? 'result-icon--success' : 'result-icon--fail'">
        {{ success ? '🎉' : '😥' }}
      </div>
      <h2 class="result-title">{{ success ? '闯关成功！' : '闯关失败' }}</h2>
      <p class="result-desc">{{ message }}</p>
      <div class="result-actions">
        <button v-if="!success" class="btn-pixar" @click="$emit('retry')">
          重新挑战
        </button>
        <button class="btn-pixar btn-pixar--primary" @click="$emit('next')">
          {{ success ? '继续' : '返回首页' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  success: boolean
  message?: string
}>()

defineEmits<{
  retry: []
  next: []
}>()
</script>

<style lang="scss" scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: $spacing-lg;
}

.result-modal {
  background: $color-bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-float;
  padding: $spacing-xl;
  text-align: center;
  width: 100%;
  max-width: 300px;
}

.result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto $spacing-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;

  &--success {
    background: rgba($color-success, 0.15);
  }

  &--fail {
    background: rgba($color-danger, 0.15);
  }
}

.result-title {
  font-size: $font-size-xl;
  font-weight: 700;
  margin-bottom: $spacing-sm;
}

.result-desc {
  font-size: $font-size-sm;
  color: $color-text-light;
  margin-bottom: $spacing-lg;
}

.result-actions {
  display: flex;
  gap: $spacing-sm;

  .btn-pixar {
    flex: 1;
    font-size: $font-size-base;
    padding: 10px 16px;
  }
}
</style>
