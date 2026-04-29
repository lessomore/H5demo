<template>
  <div class="home-page page" :style="homeStyle">
    <section class="carousel-section" aria-label="关卡选择">
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
        :spaceBetween="28"
        :initialSlide="1"
        :speed="400"
        :pagination="{ clickable: true }"
        @slideChange="onSlideChange"
        class="level-swiper"
      >
        <SwiperSlide v-for="level in levels" :key="level.id">
          <img class="level-image" :src="level.image" :alt="level.name" />
        </SwiperSlide>
      </Swiper>
    </section>

    <footer class="home-footer">
      <button class="btn-start" type="button" @click="enterGame">
        <img class="start-img" :src="playImage" alt="开始挑战" />
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { EffectCoverflow, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/pagination'
import level1Image from '@/assets/index/level1.png'
import level2Image from '@/assets/index/level2.png'
import level3Image from '@/assets/index/level3.png'
import playImage from '@/assets/index/play.png'

const router = useRouter()

const levels = [
  {
    id: 2,
    name: '第二关',
    image: level2Image,
    route: '/level2',
  },
  {
    id: 1,
    name: '第一关',
    image: level1Image,
    route: '/level1',
  },
  {
    id: 3,
    name: '第三关',
    image: level3Image,
    route: '/level3',
  },
]

const currentIndex = ref(1)
const currentLevel = computed(() => levels[currentIndex.value])
const homeStyle = ref<Record<string, string>>({})

function updateHomeLayout() {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const bgRatio = 1504 / 2668
  const viewportRatio = viewportWidth / viewportHeight
  const bgWidth = viewportRatio > bgRatio ? viewportWidth : viewportHeight * bgRatio
  const bgHeight = bgWidth / bgRatio
  const layoutWidth = Math.min(viewportWidth, bgWidth)
  const cardWidth = Math.min(300, Math.max(230, layoutWidth * 0.56))
  const playWidth = Math.min(160, Math.max(118, layoutWidth * 0.3))
  const footerBottom = Math.max(34, viewportHeight * 0.095)
  const carouselBottom = footerBottom + playWidth * 0.42 + viewportHeight * 0.075

  homeStyle.value = {
    '--home-bg-width': `${bgWidth}px`,
    '--home-bg-height': `${bgHeight}px`,
    '--home-card-width': `${cardWidth}px`,
    '--home-play-width': `${playWidth}px`,
    '--home-footer-bottom': `${footerBottom}px`,
    '--home-carousel-bottom': `${carouselBottom}px`,
  }
}

function onSlideChange(swiper: any) {
  currentIndex.value = swiper.activeIndex
}

function enterGame() {
  router.push(currentLevel.value.route)
}

onMounted(() => {
  updateHomeLayout()
  window.addEventListener('resize', updateHomeLayout)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHomeLayout)
})
</script>

<style lang="scss" scoped>
.home-page {
  --home-bg-width: 100vw;
  --home-bg-height: 100dvh;
  --home-card-width: 280px;
  --home-play-width: 150px;
  --home-footer-bottom: 16px;
  --home-carousel-bottom: 104px;
  // background-color: #f7d8a5;
  background-image: url('@/assets/index/all_bg.png');
  background-size: var(--home-bg-width) var(--home-bg-height);
  background-position: center;
  background-repeat: no-repeat;
  position: absolute;
  inset: 0;
}

.carousel-section {
  position: relative;
  z-index: 1;
  width: 100%;
  position: absolute;
  left: 0;
  bottom: var(--home-carousel-bottom);
}

.level-swiper {
  width: 100%;
  padding-bottom: 28px;

  :deep(.swiper-slide) {
    width: var(--home-card-width);
    height: auto;
  }

  :deep(.swiper-pagination) {
    bottom: 0;
  }

  :deep(.swiper-pagination-bullet) {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.4);
    opacity: 1;
    transition: all 0.3s ease;
  }

  :deep(.swiper-pagination-bullet-active) {
    width: 20px;
    border-radius: 4px;
    background: #fff;
  }
}

.level-image {
  width: 100%;
  display: block;
  filter: drop-shadow(0 8px 18px rgba(94, 49, 18, 0.22));
  user-select: none;
  -webkit-user-drag: none;
}

.home-footer {
  position: relative;
  z-index: 1;
  width: 100%;
  position: absolute;
  left: 0;
  bottom: var(--home-footer-bottom);
  padding: 0 $spacing-lg;
  text-align: center;
}

.btn-start {
  display: block;
  width: var(--home-play-width);
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: transform $duration-fast ease;

  &:active {
    transform: scale(0.97);
  }
}

.start-img {
  width: 100%;
  display: block;
}
</style>
