<script setup lang="ts">
import { ref } from 'vue';
import CodeEditor from './components/editor/CodeEditor.vue';
import MermaidPreview from './components/preview/MermaidPreview.vue';
import Toolbar from './components/toolbar/Toolbar.vue';
import { useMermaid } from './composables/useMermaid';
import { useExport } from './composables/useExport';
import type { ExportFormat } from './types';

// 组合式函数
const {
  code,
  zoom,
  error,
  clearCode,
  pasteCode,
  copyCode,
  zoomIn,
  zoomOut,
  resetZoom,
  handleRenderError,
} = useMermaid();

const { exportImage, isExporting } = useExport();

// 组件引用
const previewRef = ref<InstanceType<typeof MermaidPreview> | null>(null);

// 工具栏事件处理
const handlePaste = async () => {
  await pasteCode();
};

const handleClear = () => {
  clearCode();
};

const handleCopy = async () => {
  const success = await copyCode();
  if (success) {
    // 可以添加 toast 提示
  }
};

const handleUndo = () => {
  // CodeMirror 自带撤销，这里可以添加额外逻辑
};

const handleRedo = () => {
  // CodeMirror 自带重做
};

const handleZoomIn = () => {
  zoomIn();
};

const handleZoomOut = () => {
  zoomOut();
};

const handleZoomReset = () => {
  resetZoom();
};

const handleExport = async (format: ExportFormat) => {
  const element = previewRef.value?.getPreviewElement() || null;
  await exportImage(element, format, `mermaid-${Date.now()}`);
};

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd + V - 粘贴
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    handlePaste();
  }
  // Ctrl/Cmd + C - 复制
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    if (document.activeElement !== document.querySelector('.cm-editor')) {
      handleCopy();
    }
  }
};
</script>

<template>
  <div
    class="app-container min-h-screen p-4 flex flex-col gap-4"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <!-- 标题栏 -->
    <header class="glass rounded-xl px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Mermaid 在线编辑器</h1>
          <p class="text-sm text-white/60">实时预览 · 便捷导出</p>
        </div>
      </div>

      <div class="flex items-center gap-2 text-white/60 text-sm">
        <span v-if="isExporting" class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent"></div>
          导出中...
        </span>
      </div>
    </header>

    <!-- 工具栏 -->
    <Toolbar
      :zoom="zoom"
      :can-undo="true"
      :can-redo="true"
      :can-copy="!!code"
      @paste="handlePaste"
      @clear="handleClear"
      @copy="handleCopy"
      @undo="handleUndo"
      @redo="handleRedo"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-reset="handleZoomReset"
      @export="handleExport"
    />

    <!-- 主内容区 -->
    <main class="flex-1 flex gap-4 min-h-0">
      <!-- 左侧：代码编辑区 -->
      <section class="glass rounded-xl flex-1 flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span class="text-white/80 text-sm font-medium">Mermaid 代码</span>
          <span class="text-white/40 text-xs">{{ code.length }} 字符</span>
        </div>
        <div class="flex-1 p-2 overflow-hidden">
          <CodeEditor
            v-model="code"
            :error-line="error?.line"
          />
        </div>

        <!-- 错误提示 -->
        <div
          v-if="error"
          class="error-toast glass-dark mx-4 mb-4 p-3 rounded-lg border border-red-500/30"
        >
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="font-medium text-red-300">语法错误</p>
              <p class="text-sm text-white/80 mt-1">{{ error.message }}</p>
              <p v-if="error.line" class="text-xs text-white/50 mt-1">
                第 {{ error.line }} 行
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 右侧：预览区 -->
      <section class="glass rounded-xl flex-1 flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <span class="text-white/80 text-sm font-medium">实时预览</span>
          <span class="text-white/40 text-xs">缩放: {{ Math.round(zoom * 100) }}%</span>
        </div>
        <div class="flex-1 p-2 overflow-hidden">
          <MermaidPreview
            ref="previewRef"
            :code="code"
            :zoom="zoom"
            @error="handleRenderError"
          />
        </div>
      </section>
    </main>

    <!-- 底部提示 -->
    <footer class="glass rounded-xl px-4 py-2 text-center text-white/50 text-xs">
      使用 Ctrl+V 粘贴代码 · Ctrl+C 复制代码 · 快捷键支持
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1800px;
  margin: 0 auto;
}

.error-toast {
  border: 1px solid rgba(239, 68, 68, 0.3);
}
</style>
