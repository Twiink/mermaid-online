<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { ZoomLevel, ExportFormat } from '@/types';

const props = defineProps<{
  zoom: ZoomLevel;
  canUndo: boolean;
  canRedo: boolean;
  canCopy: boolean;
  isExporting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'paste'): void;
  (e: 'clear'): void;
  (e: 'copy'): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'export', format: ExportFormat): void;
  (e: 'zoomChange', zoom: ZoomLevel): void;
}>();

const zoomPercent = computed(() => Math.round(props.zoom * 100));
const zoomInput = ref(zoomPercent.value);

// 限制范围
const MAX_ZOOM = 800;

// 同步输入框值
watch(() => props.zoom, (newZoom) => {
  if (zoomInput.value !== 0) {
    zoomInput.value = Math.round(newZoom * 100);
  }
});

const handleZoomInput = () => {
  // 处理空值或无效值
  if (!zoomInput.value || zoomInput.value < 0) {
    zoomInput.value = 0;
  }
  // 自动限制范围（0是允许的，表示清空）
  if (zoomInput.value > MAX_ZOOM) {
    zoomInput.value = MAX_ZOOM;
  }
  // 0 表示清空，其他值正常缩放
  if (zoomInput.value === 0) {
    emit('zoomChange', 0.01 as ZoomLevel); // 用最小值代替0，避免完全不可见
  } else {
    emit('zoomChange', (zoomInput.value / 100) as ZoomLevel);
  }
};

const handleBlur = () => {
  // 失焦时恢复当前实际缩放值
  zoomInput.value = zoomPercent.value;
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    (e.target as HTMLInputElement).blur();
  }
};
</script>

<template>
  <div class="toolbar-container">
    <div class="toolbar-glass">
      <!-- 左侧：编辑操作 -->
      <div class="left-actions">
        <button
          class="tool-btn"
          title="粘贴 (Ctrl+V)"
          @click="emit('paste')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>粘贴</span>
        </button>

        <button
          class="tool-btn"
          title="清空"
          @click="emit('clear')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>清空</span>
        </button>

        <div class="divider"></div>

        <button
          class="icon-btn"
          :disabled="!canUndo"
          title="撤销"
          @click="emit('undo')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          class="icon-btn"
          :disabled="!canRedo"
          title="重做"
          @click="emit('redo')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>

        <button
          class="tool-btn"
          :disabled="!canCopy"
          title="复制代码"
          @click="emit('copy')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>复制</span>
        </button>
      </div>

      <!-- 中间：缩放控制（使用鼠标滚轮缩放或手动输入） -->
      <div class="zoom-display">
        <input
          v-model.number="zoomInput"
          type="number"
          class="zoom-input"
          @input="handleZoomInput"
          @blur="handleBlur"
          @keydown="handleKeydown"
        />
        <span class="zoom-unit">%</span>
        <span class="zoom-hint">Ctrl+滚轮</span>
      </div>

      <!-- 右侧：导出操作 -->
      <div class="right-actions">
        <div v-if="isExporting" class="exporting">
          <svg class="animate-spin w-5 h-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>导出中...</span>
        </div>

        <button
          class="export-btn"
          title="导出为 PNG"
          :disabled="isExporting"
          @click="emit('export', 'png')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>PNG</span>
        </button>

        <button
          class="export-btn"
          title="导出为 SVG"
          :disabled="isExporting"
          @click="emit('export', 'svg')"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>SVG</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-container {
  perspective: 1000px;
}

.toolbar-glass {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100px;
  padding: 0 32px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 12px 40px -20px rgba(14, 165, 233, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-glass:hover {
  box-shadow:
    0 16px 50px -25px rgba(14, 165, 233, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
}

/* 左侧操作区 */
.left-actions, .right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 按钮基础样式 */
.tool-btn, .icon-btn, .zoom-btn, .export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 20px;
  border-radius: 16px;
  transition: all 0.2s ease;
  color: #475569;
  font-size: 15px;
  font-weight: 500;
}

.tool-btn {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.tool-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95);
  color: #0284c7;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.15);
}

.icon-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.icon-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.85);
  color: #0284c7;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 分割线 */
.divider {
  width: 1px;
  height: 32px;
  background: linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.4), transparent);
  margin: 0 8px;
}

/* 缩放控制 */
.zoom-display {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.zoom-input {
  width: 50px;
  height: 24px;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  font-family: ui-monospace, monospace;
  text-align: right;
  outline: none;
}

.zoom-input:focus {
  color: #0284c7;
}

.zoom-input::-webkit-outer-spin-button,
.zoom-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.zoom-unit {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  margin-right: 8px;
}

.zoom-hint {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 8px;
  border-left: 1px solid rgba(148, 163, 184, 0.3);
}

/* 导出按钮 */
.export-btn {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(56, 189, 248, 0.2));
  border: 1px solid rgba(14, 165, 233, 0.4);
  color: #0284c7;
}

.export-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.25), rgba(56, 189, 248, 0.3));
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.25);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 导出中状态 */
.exporting {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #0284c7;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
