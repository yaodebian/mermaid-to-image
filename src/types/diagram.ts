/**
 * Mermaid图表相关类型定义
 */

/**
 * 表示一个网页中检测到的Mermaid图表
 */
export interface MermaidDiagram {
  /**
   * 图表唯一ID
   */
  id: string;
  
  /**
   * 图表源代码
   */
  sourceCode: string;
  
  /**
   * 图表在页面中的位置索引
   */
  index?: number;
  
  /**
   * 图表所在DOM元素的选择器
   */
  selector?: string;
  
  /**
   * 图表类型（如flowchart, sequenceDiagram等）
   */
  type?: string;
  
  /**
   * 检测方法（如何发现的这个图表）
   */
  detectionMethod?: 'class' | 'attribute' | 'content' | 'svg';
}

/**
 * 检测Mermaid图表的结果
 */
export interface DetectionResult {
  /**
   * 是否检测成功
   */
  success: boolean;
  
  /**
   * 检测到的图表列表
   */
  diagrams: MermaidDiagram[];
  
  /**
   * 错误信息（如果有）
   */
  error?: string;
  
  /**
   * 检测用时（毫秒）
   */
  elapsedTime?: number;
}