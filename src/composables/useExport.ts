import { ref } from 'vue';
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

    // 获取 SVG 容器中的 SVG 元素
    const svgContainer = element.querySelector('.svg-container');
    if (!svgContainer) {
      exportError.value = 'SVG 内容不存在';
      return;
    }

    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
      exportError.value = 'SVG 元素不存在';
      return;
    }

    isExporting.value = true;
    exportError.value = null;

    try {
      // 获取 SVG 的完整内容
      const svgClone = svgElement.cloneNode(true) as SVGElement;

      // 确保 SVG 有正确的命名空间
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // 获取 SVG 的实际尺寸
      let width = svgElement.getAttribute('width') || svgElement.viewBox?.baseVal?.width || 800;
      let height = svgElement.getAttribute('height') || svgElement.viewBox?.baseVal?.height || 600;

      // 尝试获取 SVG 内容的实际边界（BBox）
      let bbox: DOMRect | null = null;
      try {
        // 尝试直接获取 SVG 元素的 BBox
        if ((svgElement as unknown as { getBBox(): DOMRect }).getBBox) {
          bbox = (svgElement as unknown as { getBBox(): DOMRect }).getBBox();
        }
      } catch (e) {
        // getBBox 可能因为某些原因失败
        console.warn('无法获取 SVG BBox:', e);
      }

      // 如果成功获取 BBox，使用实际内容尺寸
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        // 添加一点边距
        const padding = 30;
        width = bbox.width + padding * 2;
        height = bbox.height + padding * 2;

        // 更新 viewBox
        svgClone.setAttribute('viewBox', `${-bbox.x - padding} ${-bbox.y - padding} ${width} ${height}`);
        svgClone.setAttribute('width', width.toString());
        svgClone.setAttribute('height', height.toString());
      } else {
        // 如果无法获取 BBox，使用原始尺寸
        svgClone.setAttribute('width', width.toString());
        svgClone.setAttribute('height', height.toString());
        if (!svgClone.hasAttribute('viewBox') && svgElement.hasAttribute('viewBox')) {
          svgClone.setAttribute('viewBox', svgElement.getAttribute('viewBox')!);
        }
      }

      // 将外部图片的 href 转换为 base64
      const images = svgClone.querySelectorAll('image');
      for (const img of images) {
        const href = img.getAttribute('href');
        if (href && href.startsWith('http')) {
          try {
            const response = await fetch(href, { mode: 'cors' });
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);
            img.setAttribute('href', base64);
          } catch (e) {
            console.warn('无法加载图片:', href);
          }
        }
      }

      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      let dataUrl: string = '';
      let fileExt: string = '';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (format === 'png') {
        // 将 SVG 转换为 PNG - 使用 data URL 方式避免 CORS
        const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        const img = new Image();

        // 使用实际尺寸的两倍作为画布大小，提高清晰度
        const scale = 2;
        const w = parseFloat(width.toString());
        const h = parseFloat(height.toString());
        canvas.width = w * scale;
        canvas.height = h * scale;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            if (ctx) {
              ctx.scale(scale, scale);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              dataUrl = canvas.toDataURL('image/png');
              fileExt = 'png';
              resolve();
            } else {
              reject(new Error('无法获取 canvas context'));
            }
          };
          img.onerror = () => {
            // 如果 data URL 也失败，尝试使用 SVG 导出
            console.warn('PNG 导出失败，自动切换为 SVG 格式');
            dataUrl = svgUrl;
            fileExt = 'svg';
            resolve();
          };
          img.src = svgDataUrl;
        });
      } else {
        dataUrl = svgUrl;
        fileExt = 'svg';
      }

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `${filename}.${fileExt}`;
      link.href = dataUrl;
      link.click();

      if (format === 'svg') {
        URL.revokeObjectURL(svgUrl);
      }

    } catch (err) {
      const error = err as Error;
      exportError.value = error.message || '导出失败';
      console.error('Export error:', err);
    } finally {
      isExporting.value = false;
    }
  };

  // 辅助函数：将 Blob 转换为 Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
