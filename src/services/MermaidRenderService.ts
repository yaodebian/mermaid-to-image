/**
 * 渲染选项类型
 */
interface RenderOptions {
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
interface RenderResult {
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
 * Mermaid渲染服务
 * 提供将Mermaid代码渲染为SVG图像的功能
 */
export class MermaidRenderService {
  /**
   * 默认Mermaid配置
   */
  private static defaultConfig = {
    theme: 'default' as 'default',
    securityLevel: 'loose' as 'loose',
    startOnLoad: false,
    logLevel: 3 as 3, // 错误级别
    flowchart: {
      htmlLabels: true,
      curve: 'linear' as 'linear',
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
    },
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      sectionFontSize: 11,
      numberSectionStyles: 3,
    }
  };

  /**
   * 初始化Mermaid库
   * @returns Promise<void>
   */
  private static async initMermaid(): Promise<any> {
    // 动态导入mermaid库
    const mermaid = await import('mermaid');
    
    // 初始化配置
    mermaid.default.initialize({
      ...this.defaultConfig,
      startOnLoad: false
    });
    
    return mermaid.default;
  }

  /**
   * 将Mermaid代码渲染为SVG字符串
   * @param code Mermaid代码
   * @param options 渲染选项
   * @returns Promise<string> SVG字符串
   */
  public static async renderToSvg(code: string, options: RenderOptions = {}): Promise<string> {
    try {
      const mermaid = await this.initMermaid();
      
      // 处理自定义配置
      if (options.mermaidConfig) {
        mermaid.initialize({
          ...this.defaultConfig,
          ...options.mermaidConfig,
          startOnLoad: false
        });
      }
      
      // 使用Mermaid API渲染为SVG
      const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, code);
      
      // 如果指定了背景色，添加背景矩形
      if (options.backgroundColor) {
        return this.addBackground(svg, options.backgroundColor);
      }
      
      // 如果指定了缩放比例，应用缩放
      if (options.scale && options.scale !== 1) {
        return this.applyScale(svg, options.scale);
      }
      
      return svg;
    } catch (error) {
      console.error('Mermaid渲染失败:', error);
      throw new Error(error instanceof Error ? error.message : '渲染失败');
    }
  }
  
  /**
   * 添加背景色到SVG
   * @param svgString SVG字符串
   * @param backgroundColor 背景颜色
   * @returns 添加背景后的SVG字符串
   */
  private static addBackground(svgString: string, backgroundColor: string): string {
    // 解析SVG
    const parser = new DOMParser();
    const svg = parser.parseFromString(svgString, 'image/svg+xml').documentElement;
    
    // 获取尺寸
    const width = svg.getAttribute('width') || '100%';
    const height = svg.getAttribute('height') || '100%';
    
    // 创建背景矩形
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', backgroundColor);
    
    // 将背景矩形添加为第一个子元素
    svg.insertBefore(rect, svg.firstChild);
    
    return new XMLSerializer().serializeToString(svg);
  }
  
  /**
   * 应用缩放比例到SVG
   * @param svgString SVG字符串
   * @param scale 缩放比例
   * @returns 缩放后的SVG字符串
   */
  private static applyScale(svgString: string, scale: number): string {
    // 解析SVG
    const parser = new DOMParser();
    const svg = parser.parseFromString(svgString, 'image/svg+xml').documentElement;
    
    // 获取原始尺寸
    const originalWidth = parseFloat(svg.getAttribute('width') || '0');
    const originalHeight = parseFloat(svg.getAttribute('height') || '0');
    
    if (originalWidth && originalHeight) {
      // 设置新尺寸
      svg.setAttribute('width', `${originalWidth * scale}`);
      svg.setAttribute('height', `${originalHeight * scale}`);
      
      // 应用缩放
      const g = svg.querySelector('g');
      if (g) {
        const transform = g.getAttribute('transform') || '';
        g.setAttribute('transform', `${transform} scale(${scale})`);
      }
    }
    
    return new XMLSerializer().serializeToString(svg);
  }
  
  /**
   * 将SVG转换为图片URL
   * @param svgString SVG字符串
   * @returns SVG的Data URL
   */
  public static svgToImageUrl(svgString: string): string {
    const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
    return `data:image/svg+xml;base64,${svgBase64}`;
  }
} 