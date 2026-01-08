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
const svgContent = ref<string>('');
const isLoading = ref(false);
const errorMessage = ref<string>();
const isCopied = ref(false);
const hasError = ref(false);

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

// 复制错误信息
const copyError = async () => {
  if (!errorMessage.value) return;
  try {
    await navigator.clipboard.writeText(errorMessage.value);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// 禁用 Mermaid 默认的错误渲染
mermaid.parseError = (_err) => {
  // 保持空实现以阻止 Mermaid 在 DOM 中渲染默认的错误图表
  // 不要在此时抛出错误，以免中断渲染流程导致 isLoading 状态卡住
};

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  // @ts-ignore - 尝试配置抑制错误渲染（某些版本支持）
  suppressErrorRendering: true,
});

// 渲染图表
const render = async () => {
  if (!previewRef.value || !props.code.trim()) {
    svgContent.value = '<div class="empty-state"><svg class="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg><p class="text-slate-400">输入 Mermaid 代码以生成图表</p></div>';
    errorMessage.value = undefined;
    hasError.value = false;
    return;
  }

  isLoading.value = true;
  errorMessage.value = undefined;
  hasError.value = false;

  try {
    // 动态设置图表 ID
    const id = `mermaid-${Date.now()}`;

    const { svg } = await mermaid.render(id, props.code);

    // 检查 Mermaid 是否生成了包含错误的 SVG（尽管我们已经尝试抑制）
    if (svg.includes('Syntax error') || svg.includes('mermaid-error')) {
      // 尝试从 SVG 中提取具体的错误信息
      const match = svg.match(/Parse error[^<]*/);
      const specificError = match ? match[0] : 'Syntax error in graph definition';
      throw new Error(specificError);
    }

    svgContent.value = svg;
    hasError.value = false;
    emit('rendered');
  } catch (error) {
    const err = error as Error;
    errorMessage.value = err.message;
    hasError.value = true;
    svgContent.value = '';
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
        <!-- 错误状态 -->
        <div v-else-if="hasError" class="error-preview">
          <div class="error-icon-large">
            <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="error-content">
            <p class="error-text">{{ errorMessage }}</p>
            <button
              class="copy-btn"
              :class="{ copied: isCopied }"
              @click="copyError"
            >
              <svg v-if="!isCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isCopied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>
        <!-- SVG 内容 -->
        <div v-else class="svg-container" v-html="svgContent"></div>
      </Transition>
    </div>
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

/* SVG 容器 */
.svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-container :deep(svg) {
  max-width: none;
  height: auto;
  display: block;
}

.svg-container :deep(svg) {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));
}

/* 错误预览 */
.error-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
}

.error-icon-large {
  padding: 16px;
  border-radius: 16px;
  background: rgba(254, 202, 202, 0.9);
  color: #ef4444;
  margin-bottom: 16px;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 80%;
}

.error-text {
  font-size: 13px;
  color: #dc2626;
  font-family: ui-monospace, monospace;
  word-break: break-all;
  line-height: 1.6;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(252, 165, 165, 0.6);
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.copy-btn.copied {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.4);
  color: #16a34a;
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
</style>
