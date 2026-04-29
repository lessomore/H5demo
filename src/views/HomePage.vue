<template>
  <div class="home-page page">
    <!-- 头部 -->
    <header class="home-header">
      <h1 class="main-title">电网精工</h1>
      <p class="sub-title">孙晓兰的变电运维课堂</p>
    </header>

    <!-- 中间：选中关卡大图 -->
    <section class="preview-area">
      <transition name="preview-fade" mode="out-in">
        <div class="preview-card" :key="currentLevel.id">
          <div class="preview-image" :style="{ backgroundColor: currentLevel.solidColor }">
            <span class="preview-icon">{{ currentLevel.icon }}</span>
          </div>
          <div class="preview-label" :style="{ backgroundColor: currentLevel.labelColor }">
            {{ currentLevel.name }}
          </div>
        </div>
      </transition>
      <p class="preview-desc">{{ currentLevel.desc }}</p>
    </section>

    <!-- 下部：Swiper 轮播 -->
    <section class="carousel-section">
      <Swiper
        :modules="[EffectCoverflow, Pagination]"
        :effect="'coverflow'"
        :coverflowEffect="{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }"
        :slidesPerView="'auto'"
        :centeredSlides="true"
        :initialSlide="1"
        :speed="400"
        :pagination="{ clickable: true }"
        @slideChange="onSlideChange"
        class="level-swiper"
      >
        <SwiperSlide v-for="level in levels" :key="level.id">
          <div class="swiper-card">
            <div class="card-thumb" :style="{ backgroundColor: level.solidColor }">
              <span class="card-icon">{{ level.icon }}</span>
            </div>
            <div class="card-label" :style="{ backgroundColor: level.labelColor }">
              {{ level.name }}
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </section>

    <!-- 底部按钮 -->
    <footer class="home-footer">
      <button class="btn-start animate-pulse" @click="enterGame">
        开始挑战
      </button>
      <p class="participation-text">一起学习变电运维知识</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCoverflow, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'

const router = useRouter()

const levels = [
  {
    id: 2,
    name: '智能巡检',
    desc: '拼图复原巡检影像，熟悉设备标准形态',
    icon: '🤖',
    solidColor: '#E8F4FD',
    labelColor: 'rgba(255, 99, 78, 0.92)',
    route: '/level2',
  },
  {
    id: 1,
    name: '日常巡检',
    desc: '红外测温排查隐患，掌握巡检技能',
    icon: '🔍',
    solidColor: '#FFF3E0',
    labelColor: 'rgba(255, 99, 78, 0.92)',
    route: '/level1',
  },
  {
    id: 3,
    name: '倒闸操作',
    desc: '规范操作安全作业，牢记操作规程',
    icon: '⚡',
    solidColor: '#E8F5E9',
    labelColor: 'rgba(255, 99, 78, 0.92)',
    route: '/level3',
  },
]

const currentIndex = ref(1)
const currentLevel = computed(() => levels[currentIndex.value])

function onSlideChange(swiper: any) {
  currentIndex.value = swiper.activeIndex
}

function enterGame() {
  router.push(currentLevel.value.route)
}
</script>

<style lang="scss" scoped>
.home-page {
  background-image: url('@/assets/demo/home_bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 头部
.home-header {
  width: 100%;
  text-align: center;
  padding: 40px 16px 0;
}

.main-title {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4px;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.sub-title {
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.85);
  margin-top: $spacing-xs;
  letter-spacing: 1px;
}

// 中间大图
.preview-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-md;
  width: 100%;
}

.preview-card {
  width: 220px;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: all 0.3s ease;
}
.preview-fade-enter-from {
  opacity: 0;
  transform: scale(0.92);
}
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.preview-image {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.preview-label {
  text-align: center;
  padding: 10px 0;
  color: #fff;
  font-size: $font-size-lg;
  font-weight: 700;
  letter-spacing: 2px;
}

.preview-desc {
  margin-top: $spacing-md;
  font-size: $font-size-sm;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
}

// ===== Swiper 轮播 =====
.carousel-section {
  width: 100%;
  padding: 0 0 $spacing-md;
}

.level-swiper {
  width: 100%;
  padding-bottom: 28px; // 给 pagination 留空间

  :deep(.swiper-slide) {
    width: 160px;
    height: 130px;
  }

  :deep(.swiper-pagination) {
    bottom: 0;
  }

  :deep(.swiper-pagination-bullet) {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    opacity: 1;
    transition: all 0.3s ease;
  }

  :deep(.swiper-pagination-bullet-active) {
    width: 20px;
    border-radius: 4px;
    background: #fff;
  }
}

.swiper-card {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.card-thumb {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  font-size: 44px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.card-label {
  text-align: center;
  padding: 6px 0;
  color: #fff;
  font-size: $font-size-sm;
  font-weight: 700;
  letter-spacing: 1px;
}

// 底部按钮
.home-footer {
  padding: $spacing-lg;
  padding-bottom: max($spacing-lg, env(safe-area-inset-bottom));
  text-align: center;
}

.btn-start {
  display: block;
  width: 200px;
  margin: 0 auto;
  padding: 14px 0;
  border: none;
  border-radius: $radius-lg;
  background: $color-accent;
  color: #fff;
  font-size: $font-size-lg;
  font-weight: 700;
  letter-spacing: 4px;
  box-shadow: $shadow-button;
  cursor: pointer;
  transition: all $duration-fast ease;

  &:active {
    transform: scale(0.97);
    background: $color-accent-dark;
  }
}

.participation-text {
  margin-top: $spacing-sm;
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.7);
}
</style>
