import { ref } from 'vue';
import { toPng, toSvg } from 'html-to-image';
import type { ExportFormat } from '@/types';

export function useExport() {
  const isExporting = ref(false);
  const exportError = ref<string | null>(null);

  // 导出图片
  const exportImage = async (
    element: HTMLElement | null,
    format: ExportFormat,
    filename = 'mermaid-chart'
  ): Promise<void> => {
    if (!element) {
      exportError.value = '预览元素不存在';
      return;
    }

    isExporting.value = true;
    exportError.value = null;

    try {
      let dataUrl: string;

      if (format === 'png') {
        dataUrl = await toPng(element, {
          backgroundColor: '#ffffff',
          pixelRatio: 2, // 提高清晰度
          style: {
            transform: 'scale(1)', // 导出时重置缩放
          },
        });
      } else {
        dataUrl = await toSvg(element, {
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
          },
        });
      }

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      link.click();

    } catch (err) {
      const error = err as Error;
      exportError.value = error.message || '导出失败';
      console.error('Export error:', err);
    } finally {
      isExporting.value = false;
    }
  };

  // 清除错误
  const clearError = () => {
    exportError.value = null;
  };

  return {
    isExporting,
    exportError,
    exportImage,
    clearError,
  };
}
