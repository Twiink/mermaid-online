<script setup lang="ts">
import { ref } from 'vue';
import CodeEditor from './components/editor/CodeEditor.vue';
import MermaidPreview from './components/preview/MermaidPreview.vue';
import Toolbar from './components/toolbar/Toolbar.vue';
import { useMermaid } from './composables/useMermaid';
import { useExport } from './composables/useExport';
import type { ExportFormat, ZoomLevel } from '@/types';

// 组合式函数
const {
  code,
  zoom,
  clearCode,
  pasteCode,
  copyCode,
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
  await copyCode();
};

const handleUndo = () => {
  // CodeMirror 自带撤销
};

const handleRedo = () => {
  // CodeMirror 自带重做
};

const handleExport = async (format: ExportFormat) => {
  const element = previewRef.value?.getPreviewElement() || null;
  await exportImage(element, format, `mermaid-${Date.now()}`);
};

// 预览区域缩放变化
const handleZoomChange = (newZoom: ZoomLevel) => {
  zoom.value = newZoom;
};

// 键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    handlePaste();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    if (document.activeElement !== document.querySelector('.cm-editor')) {
      handleCopy();
    }
  }
};
</script>

<template>
  <div
    class="app-container min-h-screen flex flex-col"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <!-- 工具栏 -->
    <div class="toolbar-wrapper">
      <Toolbar
        :zoom="zoom"
        :can-undo="true"
        :can-redo="true"
        :can-copy="!!code"
        :is-exporting="isExporting"
        @paste="handlePaste"
        @clear="handleClear"
        @copy="handleCopy"
        @undo="handleUndo"
        @redo="handleRedo"
        @zoom-change="handleZoomChange"
        @export="handleExport"
      />
    </div>

    <!-- 主内容区 -->
    <main class="main-content flex-1 flex gap-8">
      <!-- 左侧：代码编辑区 -->
      <section class="editor-card card-glass rounded-3xl flex-1 flex flex-col">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <div class="header-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span class="card-title">代码编辑</span>
          </div>
          <span class="char-count">{{ code.length }} 字符</span>
        </div>

        <div class="card-body flex-1 relative overflow-hidden">
          <CodeEditor
            v-model="code"
          />
        </div>

      </section>

      <!-- 右侧：预览区 -->
      <section class="preview-card card-glass rounded-3xl flex-1 flex flex-col">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <div class="header-icon">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span class="card-title">实时预览</span>
          </div>
          <span class="zoom-badge">{{ Math.round(zoom * 100) }}%</span>
        </div>

        <div class="card-body flex-1 relative overflow-hidden">
          <MermaidPreview
            ref="previewRef"
            :code="code"
            :zoom="zoom"
            @zoom-change="handleZoomChange"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px 32px;
  height: 100vh;
  overflow: hidden;
}

.toolbar-wrapper {
  margin-bottom: 24px;
  padding: 0 8px;
}

/* 主内容区 */
.main-content {
  padding: 0 8px;
  min-height: 0;
}

/* 卡片样式 */
.card-glass {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 25px 50px -25px rgba(14, 165, 233, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-glass:hover {
  box-shadow:
    0 30px 60px -30px rgba(14, 165, 233, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(56, 189, 248, 0.2));
  color: #0284c7;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.025em;
}

.char-count, .zoom-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 卡片内容区 */
.card-body {
  padding: 16px;
  background: rgba(255, 255, 255, 0.35);
  min-height: 0;
}
</style>
