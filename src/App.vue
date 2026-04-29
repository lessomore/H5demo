<template>
  <div class="app-container">
    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta.transition as string || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
// 根组件：提供路由视图和页面过渡动画
</script>

<style lang="scss">
.app-container {
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
