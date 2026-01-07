// Mermaid 错误类型
export interface MermaidError {
  message: string;
  line?: number;
  column?: number;
  hash?: string;
}

// 预览缩放比例
export type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2 | 2.5 | 3;

// 导出格式
export type ExportFormat = 'png' | 'svg';

// 编辑器主题
export type EditorTheme = 'dark' | 'light';

// 默认 Mermaid 代码
export const DEFAULT_MERMAID_CODE = `graph TD
    A[开始] --> B[处理数据]
    B --> C{检查结果}
    C -->|成功| D[输出结果]
    C -->|失败| E[报错处理]
    D --> F[结束]
    E --> F`;
