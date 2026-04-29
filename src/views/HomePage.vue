<template>
  <div class="home-page page">
    <!-- 背景装饰 -->
    <div class="bg-decor">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
    </div>

    <!-- 标题 -->
    <header class="home-header">
      <h1 class="main-title animate-bounce-in">
        <span class="title-sub">电网精工</span>
        <span class="title-main">孙晓兰的变电运维课堂</span>
      </h1>
    </header>

    <!-- 关卡轮播 -->
    <section class="level-carousel" ref="carouselRef">
      <div
        class="carousel-track"
        :style="{ transform: `translateX(${carouselOffset}px)` }"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div
          v-for="(level, index) in levels"
          :key="level.id"
          class="level-card card-pixar"
          :class="{ 'level-card--active': currentIndex === index }"
          @click="selectLevel(index)"
        >
          <!-- 关卡图片占位 -->
          <div class="level-image" :style="{ background: level.bgColor }">
            <span class="level-emoji">{{ level.emoji }}</span>
          </div>
          <div class="level-info">
            <h3 class="level-name">{{ level.name }}</h3>
            <p class="level-desc">{{ level.desc }}</p>
          </div>
        </div>
      </div>

      <!-- 指示器 -->
      <div class="carousel-dots">
        <span
          v-for="(_, i) in levels"
          :key="i"
          class="dot"
          :class="{ 'dot--active': currentIndex === i }"
        ></span>
      </div>
    </section>

    <!-- 进入按钮 -->
    <footer class="home-footer">
      <button class="btn-pixar animate-pulse" @click="enterGame">
        进入游戏
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const levels = [
  {
    id: 2,
    name: '智能巡检',
    desc: '拼图复原巡检影像',
    emoji: '🤖',
    bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    route: '/level2',
  },
  {
    id: 1,
    name: '日常巡检',
    desc: '红外测温排查隐患',
    emoji: '🔍',
    bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    route: '/level1',
  },
  {
    id: 3,
    name: '倒闸操作',
    desc: '规范操作安全作业',
    emoji: '⚡',
    bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    route: '/level3',
  },
]

// 轮播状态
const currentIndex = ref(1) // 默认中间（日常巡检）
const carouselRef = ref<HTMLElement>()
const touchStartX = ref(0)
const touchDeltaX = ref(0)
const isDragging = ref(false)

const CARD_WIDTH = 220
const CARD_GAP = 16

const carouselOffset = computed(() => {
  const containerWidth = carouselRef.value?.clientWidth ?? 375
  const baseOffset = containerWidth / 2 - CARD_WIDTH / 2
  return baseOffset - currentIndex.value * (CARD_WIDTH + CARD_GAP) + touchDeltaX.value
})

function selectLevel(index: number) {
  currentIndex.value = index
}

function onTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return
  touchDeltaX.value = e.touches[0].clientX - touchStartX.value
}

function onTouchEnd() {
  isDragging.value = false
  if (Math.abs(touchDeltaX.value) > 50) {
    if (touchDeltaX.value < 0 && currentIndex.value < levels.length - 1) {
      currentIndex.value++
    } else if (touchDeltaX.value > 0 && currentIndex.value > 0) {
      currentIndex.value--
    }
  }
  touchDeltaX.value = 0
}

function enterGame() {
  const level = levels[currentIndex.value]
  router.push(level.route)
}
</script>

<style lang="scss" scoped>
.home-page {
  background: linear-gradient(180deg, $color-bg-start 0%, $color-bg-end 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 60px;
}

// 背景装饰
.bg-decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.cloud {
  position: absolute;
  width: 120px;
  height: 40px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 40px;

  &-1 {
    top: 10%;
    left: -20px;
    animation: float 6s ease-in-out infinite;
  }

  &-2 {
    top: 25%;
    right: -30px;
    width: 80px;
    height: 28px;
    animation: float 8s ease-in-out infinite reverse;
  }
}

// 标题
.home-header {
  text-align: center;
  margin-bottom: 40px;
  z-index: 1;
}

.main-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-sub {
  font-size: $font-size-base;
  color: $color-accent-dark;
  font-weight: 600;
  letter-spacing: 4px;
}

.title-main {
  font-size: $font-size-xl;
  color: $color-primary-dark;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

// 轮播
.level-carousel {
  flex: 1;
  width: 100%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.carousel-track {
  display: flex;
  gap: 16px;
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  padding: 20px 0;
  touch-action: pan-y;
}

.level-card {
  flex-shrink: 0;
  width: 220px;
  border-radius: $radius-lg;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  transform: scale(0.9);
  opacity: 0.7;

  &--active {
    transform: scale(1);
    opacity: 1;
    box-shadow: $shadow-float;
  }
}

.level-image {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-emoji {
  font-size: 64px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.level-info {
  padding: $spacing-md;
  text-align: center;
}

.level-name {
  font-size: $font-size-lg;
  font-weight: 700;
  color: $color-text;
  margin-bottom: $spacing-xs;
}

.level-desc {
  font-size: $font-size-sm;
  color: $color-text-light;
}

// 指示器
.carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: $spacing-md;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba($color-primary, 0.2);
  transition: all 0.3s ease;

  &--active {
    width: 24px;
    border-radius: 4px;
    background: $color-primary;
  }
}

// 底部按钮
.home-footer {
  padding: $spacing-xl;
  padding-bottom: max($spacing-xl, env(safe-area-inset-bottom));
  z-index: 1;
}
</style>
