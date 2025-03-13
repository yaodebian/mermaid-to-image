/**
 * Mermaid图表类型定义
 */
export interface MermaidChart {
  /**
   * 图表唯一标识符
   */
  id: string;
  
  /**
   * 图表的Mermaid代码
   */
  code: string;
  
  /**
   * 图表是否已经渲染
   */
  rendered?: boolean;
  
  /**
   * 图表在页面中的位置信息（DOM元素路径、位置等）
   */
  location?: {
    /**
     * 元素选择器路径
     */
    selector?: string;
    
    /**
     * 元素在页面中的位置
     */
    position?: {
      top: number;
      left: number;
    };
  };
}

/**
 * 导出图片格式类型
 */
export type ExportFormats = 'svg' | 'png' | 'jpeg';

/**
 * 渲染选项类型
 */
export interface RenderOptions {
  /**
   * 背景颜色
   */
  backgroundColor?: string;
  
  /**
   * 缩放比例
   */
  scale?: number;
  
  /**
   * 其他Mermaid配置选项
   */
  mermaidConfig?: Record<string, any>;
}

/**
 * 渲染结果类型
 */
export interface RenderResult {
  /**
   * 渲染后的SVG代码
   */
  svg: string;
  
  /**
   * 是否渲染成功
   */
  success: boolean;
  
  /**
   * 错误信息（如果渲染失败）
   */
  error?: string;
}

/**
 * 导出选项类型
 */
export interface ExportOptions {
  /**
   * 导出格式
   */
  format: ExportFormats;
  
  /**
   * 缩放比例
   */
  scale: number;
  
  /**
   * 文件名
   */
  fileName?: string;
  
  /**
   * 背景颜色
   */
  backgroundColor?: string;
}

/**
 * 消息类型定义
 */
export type MessageType = 
  | 'DETECT_CHARTS'
  | 'CHARTS_DETECTED'
  | 'OPEN_SIDEBAR'
  | 'OPEN_CONVERTER'
  | 'SET_MERMAID_CODE'
  | 'OPEN_DIAGRAM_PREVIEW'
  | 'MERMAID_CHARTS_UPDATED';

/**
 * 消息结构
 */
export interface Message {
  type: MessageType;
  [key: string]: any;
} 