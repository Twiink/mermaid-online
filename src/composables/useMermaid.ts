import { ref } from 'vue';
import type { MermaidError, ZoomLevel } from '@/types';
import { DEFAULT_MERMAID_CODE } from '@/types';

// 缩放级别常量
const ZOOM_LEVELS: ZoomLevel[] = [0.01, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8];

export function useMermaid() {
  const code = ref(DEFAULT_MERMAID_CODE);
  const zoom = ref<ZoomLevel>(1);
  const error = ref<MermaidError | null>(null);
  const isRendering = ref(false);

  // 设置代码
  const setCode = (newCode: string) => {
    code.value = newCode;
    error.value = null;
  };

  // 清空代码
  const clearCode = () => {
    code.value = '';
    error.value = null;
  };

  // 粘贴代码
  const pasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  // 复制代码
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code.value);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  // 缩放控制
  const zoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom.value);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      zoom.value = ZOOM_LEVELS[currentIndex + 1] as ZoomLevel;
    }
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom.value);
    if (currentIndex > 0) {
      zoom.value = ZOOM_LEVELS[currentIndex - 1] as ZoomLevel;
    }
  };

  const resetZoom = () => {
    zoom.value = 1;
  };

  // 处理渲染错误
  const handleRenderError = (err: Error) => {
    error.value = {
      message: err.message,
      // 可以尝试解析行号
      line: parseErrorLine(err.message),
    };
  };

  // 解析错误信息中的行号
  const parseErrorLine = (message: string): number | undefined => {
    const lineMatch = message.match(/line\s+(\d+)/i);
    if (lineMatch && lineMatch[1]) {
      return parseInt(lineMatch[1], 10);
    }
    return undefined;
  };

  return {
    code,
    zoom,
    error,
    isRendering,
    clearCode,
    pasteCode,
    copyCode,
    zoomIn,
    zoomOut,
    resetZoom,
    handleRenderError,
  };
}
