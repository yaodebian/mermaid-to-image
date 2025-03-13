/**
 * Mermaid相关的工具函数
 */

/**
 * 初始化Mermaid配置
 * @returns boolean 是否初始化成功
 */
export const initMermaid = (mermaid: any) => {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose', // 允许点击事件
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75
      }
    });
    console.log('Mermaid初始化成功');
    return true;
  } catch (error) {
    console.error('Mermaid初始化失败:', error);
    return false;
  }
};

/**
 * 示例Mermaid图表代码
 */
export const MERMAID_EXAMPLES = {
  flowchart: `flowchart LR
    A[方形节点] --> B(圆角节点)
    B --> C{菱形节点}
    C -->|选项1| D[结果1]
    C -->|选项2| E[结果2]`,
  
  sequenceDiagram: `sequenceDiagram
    participant 浏览器
    participant 服务器
    浏览器->>服务器: GET请求
    服务器-->>浏览器: 返回HTML
    浏览器->>服务器: GET资源
    服务器-->>浏览器: 返回资源
    Note right of 浏览器: 渲染页面`,
  
  classDiagram: `classDiagram
    class Animal {
      +String name
      +move()
    }
    class Dog {
      +String breed
      +bark()
    }
    class Bird {
      +String color
      +fly()
    }
    Animal <|-- Dog
    Animal <|-- Bird`,
  
  gantt: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 计划阶段
    需求分析     :a1, 2023-01-01, 7d
    设计文档     :a2, after a1, 5d
    section 开发阶段
    编码实现     :a3, after a2, 10d
    单元测试     :a4, after a3, 5d
    section 发布阶段
    部署上线     :a5, after a4, 2d`,
  
  pieChart: `pie title 用户分布
    "中国" : 45
    "美国" : 25
    "欧洲" : 20
    "其他" : 10`,
  
  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
};

/**
 * 默认的Mermaid文本
 */
export const DEFAULT_MERMAID_TEXT = `graph TD
    A[开始] --> B[流程步骤]
    B --> C{判断条件}
    C -->|是| D[执行步骤1]
    C -->|否| E[执行步骤2]
    D --> F[结束]
    E --> F`;

/**
 * 从解析错误中提取错误行和字符位置
 * @param error 错误信息
 * @returns 错误行和字符位置信息
 */
export const extractErrorInfo = (error: string) => {
  let errorLine = 'Unknown';
  let errorChar = '';
  
  const lineMatch = error.match(/Line (\d+)/i);
  if (lineMatch) {
    errorLine = lineMatch[1];
  }
  
  const charMatch = error.match(/character (\d+)/i);
  if (charMatch) {
    errorChar = `，字符 ${charMatch[1]}`;
  }
  
  return { errorLine, errorChar };
}; 