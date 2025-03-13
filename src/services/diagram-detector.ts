/**
 * Mermaid图表检测服务
 * 用于检测DOM中的Mermaid图表元素
 */
import { MermaidDiagram, DetectionResult } from '../types/diagram';

/**
 * 检测页面中的Mermaid图表
 * @returns Promise<DetectionResult>
 */
export const detectMermaidDiagrams = async (): Promise<DetectionResult> => {
  try {
    const startTime = performance.now();
    const diagrams: MermaidDiagram[] = [];
    
    // 1. 检测带有.mermaid类的元素
    const mermaidClassElements = document.querySelectorAll('.mermaid');
    mermaidClassElements.forEach((element, index) => {
      const id = `mermaid-class-${index}`;
      const sourceCode = element.textContent?.trim() || '';
      
      if (sourceCode) {
        diagrams.push({
          id,
          sourceCode,
          index,
          selector: getSelector(element),
          detectionMethod: 'class'
        });
      }
    });
    
    // 2. 检测带有data-processed属性的Mermaid图表
    const processedElements = document.querySelectorAll('[data-processed="true"]');
    processedElements.forEach((element, index) => {
      // 如果已经通过类选择器检测到，则跳过
      const existingSelector = getSelector(element);
      const isDuplicate = diagrams.some(d => d.selector === existingSelector);
      
      if (!isDuplicate) {
        const id = `mermaid-processed-${index}`;
        
        // 尝试从data-original属性获取源代码
        let sourceCode = element.getAttribute('data-original') || '';
        
        // 如果没有源代码，尝试在附近元素中查找
        if (!sourceCode && element.parentElement) {
          // 查找附近的注释节点或隐藏元素
          for (let i = 0; i < element.parentElement.childNodes.length; i++) {
            const node = element.parentElement.childNodes[i];
            if (node.nodeType === Node.COMMENT_NODE) {
              // 注释节点可能包含Mermaid代码
              const commentText = node.textContent?.trim() || '';
              if (commentText.startsWith('mermaid') || 
                  commentText.includes('graph ') || 
                  commentText.includes('sequenceDiagram')) {
                sourceCode = commentText;
                break;
              }
            }
          }
        }
        
        if (sourceCode) {
          diagrams.push({
            id,
            sourceCode,
            index: diagrams.length,
            selector: existingSelector,
            detectionMethod: 'attribute'
          });
        }
      }
    });
    
    // 3. 检测可能的Mermaid SVG图表
    const svgElements = document.querySelectorAll('svg[id^="mermaid-"]');
    svgElements.forEach((element, index) => {
      // 如果已经通过其他方法检测到，则跳过
      const existingSelector = getSelector(element);
      const isDuplicate = diagrams.some(d => d.selector === existingSelector);
      
      if (!isDuplicate) {
        const id = `mermaid-svg-${index}`;
        
        // 尝试从data-*属性获取源代码
        let sourceCode = '';
        const dataAttributes = Array.from(element.attributes)
          .filter(attr => attr.name.startsWith('data-'));
        
        for (const attr of dataAttributes) {
          if (attr.value.includes('graph ') || 
              attr.value.includes('sequenceDiagram') ||
              attr.value.includes('gantt') ||
              attr.value.includes('classDiagram')) {
            sourceCode = attr.value;
            break;
          }
        }
        
        // 如果没有找到直接的源代码，检查是否有script标签包含Mermaid定义
        if (!sourceCode) {
          const mermaidId = element.id.replace('mermaid-', '');
          const relatedScripts = document.querySelectorAll(`script[type="text/x-mermaid"]`);
          
          for (const script of Array.from(relatedScripts)) {
            if (script.textContent?.trim()) {
              sourceCode = script.textContent.trim();
              break;
            }
          }
        }
        
        if (sourceCode) {
          diagrams.push({
            id,
            sourceCode,
            index: diagrams.length,
            selector: existingSelector,
            detectionMethod: 'svg'
          });
        }
      }
    });
    
    // 尝试确定图表类型
    diagrams.forEach(diagram => {
      if (diagram.sourceCode.includes('graph ') || diagram.sourceCode.includes('flowchart ')) {
        diagram.type = 'flowchart';
      } else if (diagram.sourceCode.includes('sequenceDiagram')) {
        diagram.type = 'sequenceDiagram';
      } else if (diagram.sourceCode.includes('classDiagram')) {
        diagram.type = 'classDiagram';
      } else if (diagram.sourceCode.includes('gantt')) {
        diagram.type = 'gantt';
      } else if (diagram.sourceCode.includes('pie ')) {
        diagram.type = 'pieChart';
      } else if (diagram.sourceCode.includes('erDiagram')) {
        diagram.type = 'erDiagram';
      }
    });
    
    const endTime = performance.now();
    
    return {
      success: true,
      diagrams,
      elapsedTime: endTime - startTime
    };
  } catch (error) {
    return {
      success: false,
      diagrams: [],
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
};

/**
 * 获取元素的CSS选择器
 * @param element DOM元素
 * @returns CSS选择器
 */
const getSelector = (element: Element): string => {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  if (element.className) {
    const classList = Array.from(element.classList).filter(c => c);
    if (classList.length > 0) {
      selector += `.${classList.join('.')}`;
    }
  }
  
  // 添加位置索引
  if (element.parentElement) {
    const siblings = Array.from(element.parentElement.children);
    const sameTagSiblings = siblings.filter(el => el.tagName === element.tagName);
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(element as Element);
      selector += `:nth-of-type(${index + 1})`;
    }
  }
  
  return selector;
}; 