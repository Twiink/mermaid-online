<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import mermaid from 'mermaid';
import type { ZoomLevel } from '@/types';

const props = defineProps<{
  code: string;
  zoom: ZoomLevel;
}>();

const emit = defineEmits<{
  (e: 'rendered'): void;
  (e: 'error', error: Error): void;
}>();

const previewRef = ref<HTMLDivElement>();
const isLoading = ref(false);
const errorMessage = ref<string>();

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
});

// 渲染图表
const render = async () => {
  if (!previewRef.value || !props.code.trim()) {
    previewRef.value!.innerHTML = '<p class="text-gray-400">请输入 Mermaid 代码</p>';
    return;
  }

  isLoading.value = true;
  errorMessage.value = undefined;

  try {
    // 动态设置图表 ID
    const id = `mermaid-${Date.now()}`;

    const { svg } = await mermaid.render(id, props.code);

    previewRef.value!.innerHTML = svg;
    emit('rendered');
  } catch (error) {
    const err = error as Error;
    errorMessage.value = err.message || '渲染失败';
    emit('error', err);
    previewRef.value!.innerHTML = `<p class="text-red-400">${err.message}</p>`;
  } finally {
    isLoading.value = false;
  }
};

// 监听代码变化
watch(() => props.code, () => {
  nextTick(render);
});

// 监听缩放变化
watch(() => props.zoom, () => {
  nextTick(render);
});

onMounted(() => {
  nextTick(render);
});

// 获取预览元素（用于导出）
const getPreviewElement = () => previewRef.value;

defineExpose({
  getPreviewElement,
  refresh: render,
});
</script>

<template>
  <div class="mermaid-preview-container h-full w-full flex flex-col">
    <!-- 预览区域 -->
    <div
      ref="previewRef"
      class="mermaid-preview flex-1 overflow-auto flex items-center justify-center p-4"
      :style="{ transform: `scale(${zoom})`, transformOrigin: 'center center' }"
    >
      <div v-if="isLoading" class="flex items-center gap-2">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
        <span class="text-gray-300">渲染中...</span>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="errorMessage"
      class="error-bar glass-dark mx-4 mb-4 p-3 rounded-lg text-red-300 text-sm"
    >
      <span class="font-medium">错误:</span>
      {{ errorMessage }}
    </div>
  </div>
</template>

<style scoped>
.mermaid-preview-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.mermaid-preview {
  background: white;
  min-height: 200px;
  transition: transform 0.2s ease;
}

.mermaid-preview :deep(svg) {
  max-width: 100%;
  height: auto;
}

.error-bar {
  border: 1px solid rgba(239, 68, 68, 0.3);
}
</style>
