<template>
  <div class="lesson-dialog" @click.self="$emit('close')">
    <div class="lesson-card card-pixar animate-bounce-in">
      <!-- 头像区域 -->
      <div class="lesson-header">
        <div class="avatar">
          <span class="avatar-text">孙</span>
        </div>
        <h3 class="lesson-title">孙晓兰课堂</h3>
      </div>

      <!-- 课堂内容 -->
      <div class="lesson-body">
        <p class="lesson-content">{{ content }}</p>
      </div>

      <!-- 操作按钮 -->
      <div class="lesson-footer">
        <button class="btn-pixar" @click="$emit('start')">
          {{ buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  content: string
  buttonText?: string
}>(), {
  buttonText: '开始挑战',
})

defineEmits<{
  start: []
  close: []
}>()
</script>

<style lang="scss" scoped>
.lesson-dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  padding: $spacing-lg;
}

.lesson-card {
  width: 100%;
  max-width: 340px;
  padding: $spacing-lg;
}

.lesson-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, $color-primary-light, $color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba($color-primary, 0.3);
}

.avatar-text {
  color: #fff;
  font-size: $font-size-lg;
  font-weight: 700;
}

.lesson-title {
  font-size: $font-size-lg;
  color: $color-primary;
  font-weight: 700;
}

.lesson-body {
  margin-bottom: $spacing-lg;
}

.lesson-content {
  font-size: $font-size-sm;
  color: $color-text;
  line-height: 1.8;
  text-align: justify;
}

.lesson-footer {
  text-align: center;
}
</style>
