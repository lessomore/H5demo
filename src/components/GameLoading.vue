<template>
  <div class="game-loading page">
    <div class="loading-content">
      <div class="loading-icon">
        <div class="bolt">⚡</div>
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
  background: linear-gradient(180deg, $color-bg-start 0%, $color-bg-end 100%);
}

.loading-content {
  text-align: center;
}

.loading-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, $color-accent 0%, $color-accent-dark 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse-glow 2s ease-in-out infinite;
}

.bolt {
  font-size: 36px;
  animation: float 2s ease-in-out infinite;
}

.loading-text {
  font-size: $font-size-lg;
  color: $color-text;
  font-weight: 600;
}

.dot {
  animation: loading-dots 1.2s ease-in-out infinite;
}
</style>
