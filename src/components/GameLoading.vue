<template>
  <div class="game-loading page">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="spinner-dot" v-for="i in 8" :key="i" :style="{ animationDelay: `${-0.125 * (9 - i)}s` }"></div>
      </div>
      <p class="loading-text">
        加载中
        <span class="dots">
          <span class="dot" style="animation-delay: 0s">.</span>
          <span class="dot" style="animation-delay: 0.2s">.</span>
          <span class="dot" style="animation-delay: 0.4s">.</span>
        </span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 加载动画组件 — 进入关卡时展示
</script>

<style lang="scss" scoped>
.game-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-start;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
}

.spinner-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: $color-primary;
  animation: ball-spin 1s infinite ease-in-out;

  &:nth-child(1) { top: 5%; left: 50%; }
  &:nth-child(2) { top: 18%; left: 82%; }
  &:nth-child(3) { top: 50%; left: 95%; }
  &:nth-child(4) { top: 82%; left: 82%; }
  &:nth-child(5) { top: 95%; left: 50%; }
  &:nth-child(6) { top: 82%; left: 18%; }
  &:nth-child(7) { top: 50%; left: 5%; }
  &:nth-child(8) { top: 18%; left: 18%; }
}

@keyframes ball-spin {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  20% { opacity: 1; }
  80% {
    opacity: 0;
    transform: scale(0);
  }
}

.loading-text {
  font-size: $font-size-base;
  color: $color-text;
  font-weight: 600;
}

.dot {
  animation: loading-dots 1.2s ease-in-out infinite;
}
</style>
