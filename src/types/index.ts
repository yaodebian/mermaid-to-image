/**
 * 消息类型声明
 */
export interface Message {
  /**
   * 消息类型
   */
  type: string;
  /**
   * 可选的代码内容
   */
  code?: string;
  /**
   * 可选的数据对象
   */
  data?: any;
  /**
   * 可选的错误信息
   */
  error?: string;
}

/**
 * 导出格式类型
 */
export type ExportFormat = 'svg' | 'png' | 'jpeg';

/**
 * 导出配置
 */
export interface ExportOptions {
  /**
   * 导出格式
   */
  format: ExportFormat;
  /**
   * 缩放比例
   */
  scale: number;
  /**
   * 背景色
   */
  backgroundColor?: string;
  /**
   * 图片质量 (仅适用于JPEG)
   */
  quality?: number;
  /**
   * 图片边距
   */
  padding?: number;
}

/**
 * 渲染完成回调函数类型
 */
export type RenderCallback = (success: boolean, errorMsg?: string, svg?: SVGElement) => void; 