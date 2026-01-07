<script setup lang="ts">
import { computed } from 'vue';
import type { ZoomLevel, ExportFormat } from '@/types';

const props = defineProps<{
  zoom: ZoomLevel;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
}>();

const emit = defineEmits<{
  (e: 'paste'): void;
  (e: 'clear'): void;
  (e: 'copy'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'zoomIn'): void;
  (e: 'zoomOut'): void;
  (e: 'zoomReset'): void;
  (e: 'export', format: ExportFormat): void;
}>();

const zoomPercent = computed(() => Math.round(props.zoom * 100));

const zoomLevels: ZoomLevel[] = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

const handleZoomIn = () => {
  const currentIndex = zoomLevels.indexOf(props.zoom);
  if (currentIndex < zoomLevels.length - 1) {
    emit('zoomIn');
  }
};

const handleZoomOut = () => {
  const currentIndex = zoomLevels.indexOf(props.zoom);
  if (currentIndex > 0) {
    emit('zoomOut');
  }
};
</script>

<template>
  <div class="toolbar glass flex items-center justify-between px-4 py-3 gap-4">
    <!-- 左侧：编辑操作 -->
    <div class="flex items-center gap-2">
      <button
        class="glass-btn text-sm"
        title="粘贴 (Ctrl+V)"
        @click="emit('paste')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        粘贴
      </button>

      <button
        class="glass-btn text-sm"
        title="清空"
        @click="emit('clear')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        清空
      </button>

      <div class="w-px h-6 bg-white/20 mx-2"></div>

      <button
        class="glass-btn text-sm"
        :disabled="!canUndo"
        title="撤销 (Ctrl+Z)"
        @click="emit('undo')"
      >
        <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <button
        class="glass-btn text-sm"
        :disabled="!canRedo"
        title="重做 (Ctrl+Y)"
        @click="emit('redo')"
      >
        <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>

      <button
        class="glass-btn text-sm"
        :disabled="!canCopy"
        title="复制代码"
        @click="emit('copy')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        复制
      </button>
    </div>

    <!-- 中间：缩放控制 -->
    <div class="flex items-center gap-2">
      <button
        class="glass-btn text-sm px-3"
        :disabled="zoom <= 0.5"
        title="缩小"
        @click="handleZoomOut"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
        </svg>
      </button>

      <span class="text-white/80 text-sm min-w-[60px] text-center">
        {{ zoomPercent }}%
      </span>

      <button
        class="glass-btn text-sm px-3"
        :disabled="zoom >= 3"
        title="放大"
        @click="handleZoomIn"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <button
        class="glass-btn text-sm px-3"
        title="重置缩放"
        @click="emit('zoomReset')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>

    <!-- 右侧：导出操作 -->
    <div class="flex items-center gap-2">
      <button
        class="glass-btn text-sm"
        title="导出为 PNG"
        @click="emit('export', 'png')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        PNG
      </button>

      <button
        class="glass-btn text-sm"
        title="导出为 SVG"
        @click="emit('export', 'svg')"
      >
        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        SVG
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  border-radius: 12px;
}
</style>
