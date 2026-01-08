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

// 拖拽状态
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);

const handleMouseDown = (e: MouseEvent) => {
  if (!previewRef.value) return;
  isDragging.value = true;
  startX.value = e.pageX;
  startY.value = e.pageY;
  scrollLeft.value = previewRef.value.scrollLeft;
  scrollTop.value = previewRef.value.scrollTop;
  previewRef.value.style.cursor = 'grabbing';
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !previewRef.value) return;
  e.preventDefault();
  const dx = e.pageX - startX.value;
  const dy = e.pageY - startY.value;
  previewRef.value.scrollLeft = scrollLeft.value - dx;
  previewRef.value.scrollTop = scrollTop.value - dy;
};

const handleMouseUp = () => {
  if (!previewRef.value) return;
  isDragging.value = false;
  previewRef.value.style.cursor = 'grab';
};

const handleMouseLeave = () => {
  if (isDragging.value) {
    handleMouseUp();
  }
};

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
    previewRef.value!.innerHTML = '<div class="empty-state"><svg class="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg><p class="text-slate-400">输入 Mermaid 代码以生成图表</p></div>';
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
    <!-- 预览区域 - 可拖拽 -->
    <div
      ref="previewRef"
      class="mermaid-preview flex items-center justify-center"
      :style="{ transform: `scale(${zoom})`, transformOrigin: 'center center' }"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <Transition name="fade" mode="out-in">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <span>渲染中...</span>
        </div>
      </Transition>
    </div>

    <!-- 错误提示 -->
    <Transition name="slide-up">
      <div
        v-if="errorMessage"
        class="error-bar"
      >
        <div class="flex items-start gap-3">
          <div class="error-icon">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="error-title">渲染错误</p>
            <p class="error-message">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.mermaid-preview-container {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  overflow: hidden;
  height: 100%;
}

.mermaid-preview {
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 24px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: grab;
}

.mermaid-preview:active {
  cursor: grabbing;
}

.mermaid-preview :deep(svg) {
  max-width: none;
  height: auto;
  display: block;
}

.mermaid-preview :deep(svg) {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  color: #94a3b8;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(14, 165, 233, 0.2);
  border-top-color: #0ea5e9;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 错误提示 */
.error-bar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(254, 202, 202, 0.95), rgba(252, 165, 165, 0.9));
  border: 1px solid rgba(252, 165, 165, 0.6);
  box-shadow: 0 8px 24px -8px rgba(239, 68, 68, 0.2);
}

.error-icon {
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #ef4444;
  flex-shrink: 0;
}

.error-title {
  font-weight: 600;
  font-size: 14px;
  color: #b91c1c;
}

.error-message {
  font-size: 13px;
  color: #dc2626;
  margin-top: 2px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
