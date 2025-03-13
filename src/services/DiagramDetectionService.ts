import { MermaidChart } from '../types';

/**
 * 图表检测服务
 * 用于检测页面中的Mermaid图表
 */
export class DiagramDetectionService {
  /**
   * 从当前页面检测Mermaid图表
   * @returns Promise<MermaidChart[]> 检测到的图表列表
   */
  public static async detectChartsFromCurrentPage(): Promise<MermaidChart[]> {
    return new Promise((resolve, reject) => {
      try {
        // 获取当前激活的标签页
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (!tabs || !tabs[0] || !tabs[0].id) {
            return resolve([]);
          }
          
          try {
            // 向内容脚本发送检测命令
            const response = await chrome.tabs.sendMessage(tabs[0].id, {
              type: 'DETECT_CHARTS'
            });
            
            if (response && response.charts) {
              resolve(response.charts);
            } else {
              resolve([]);
            }
          } catch (err) {
            console.error('与内容脚本通信失败:', err);
            reject(new Error('无法与页面通信，请确保页面已完全加载'));
          }
        });
      } catch (err) {
        console.error('检测图表时出错:', err);
        reject(err);
      }
    });
  }
  
  /**
   * 从Mermaid代码创建唯一ID
   * @param code Mermaid代码
   * @returns 哈希后的ID
   */
  public static generateChartId(code: string): string {
    // 简单哈希算法
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // 转为32位整数
    }
    return `mermaid-${hash}`;
  }
  
  /**
   * 检测元素是否包含Mermaid图表
   * @param element DOM元素
   * @returns 如果包含Mermaid图表，返回图表代码；否则返回null
   */
  public static detectMermaidFromElement(element: Element): string | null {
    // 检查是否是pre>code组合
    if (element.tagName === 'PRE' && element.querySelector('code')) {
      const codeElement = element.querySelector('code');
      const content = codeElement?.textContent || '';
      
      if (this.isMermaidCode(content)) {
        return content;
      }
    }
    
    // 检查是否是带有mermaid类的元素
    if (element.classList.contains('mermaid')) {
      return element.textContent || null;
    }
    
    // 检查data-diagram-source属性
    if (element.hasAttribute('data-diagram-source')) {
      const source = element.getAttribute('data-diagram-source');
      if (source && this.isMermaidCode(source)) {
        return source;
      }
    }
    
    return null;
  }
  
  /**
   * 简单检查文本是否可能是Mermaid代码
   * @param code 文本内容
   * @returns 是否可能是Mermaid代码
   */
  public static isMermaidCode(code: string): boolean {
    if (!code || code.trim().length < 10) {
      return false;
    }
    
    const trimmedCode = code.trim();
    
    // 检查常见的Mermaid图表类型开头
    const mermaidPatterns = [
      /^graph\s+[A-Za-z0-9]/i,        // 流程图
      /^flowchart\s+[A-Za-z0-9]/i,    // 流程图（新语法）
      /^sequenceDiagram/i,            // 时序图
      /^classDiagram/i,               // 类图
      /^stateDiagram/i,               // 状态图
      /^erDiagram/i,                  // ER图
      /^gantt/i,                      // 甘特图
      /^pie/i,                        // 饼图
      /^journey/i,                    // 用户旅程图
      /^gitGraph/i,                   // Git图表
      /^mindmap/i,                    // 思维导图
      /^timeline/i,                   // 时间线
      /^quadrantChart/i,              // 象限图
      /^requirement/i,                // 需求图
      /^sankey/i,                     // 桑基图
      /^C4Context/i,                  // C4上下文图
      /^C4Container/i,                // C4容器图
      /^C4Component/i,                // C4组件图
      /^C4Dynamic/i,                  // C4动态图
      /^C4Deployment/i,               // C4部署图
    ];
    
    // 检查是否匹配任一模式
    return mermaidPatterns.some(pattern => pattern.test(trimmedCode));
  }
} 