/**
 * 图像导出服务
 * 提供将SVG导出为不同格式图片的功能
 */
import * as htmlToImage from 'html-to-image';

export type ExportFormat = 'svg' | 'png' | 'jpeg';
export type ScaleFactor = 1 | 2 | 3;

export interface ExportOptions {
  format: ExportFormat;
  scale?: ScaleFactor;
  quality?: number; // 0-1，仅用于JPEG
  fileName?: string;
}

export interface ExportResult {
  blob?: Blob;
  dataUrl?: string;
  fileName: string;
}

/**
 * 导出SVG为指定格式的图片
 * @param svgElement SVG元素
 * @param options 导出选项
 * @returns Promise<ExportResult>
 */
export const exportImage = async (
  svgElement: SVGElement,
  options: ExportOptions
): Promise<ExportResult> => {
  try {
    // 应用缩放比例
    const scale = options.scale || 1;
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    
    if (scale !== 1) {
      const width = svgElement.clientWidth * scale;
      const height = svgElement.clientHeight * scale;
      clonedSvg.setAttribute('width', width.toString());
      clonedSvg.setAttribute('height', height.toString());
    }
    
    // 设置文件名
    const fileName = options.fileName || `mermaid-diagram.${options.format}`;
    
    // 根据格式导出
    switch (options.format) {
      case 'svg': {
        // 导出SVG
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        return { blob, fileName };
      }
      
      case 'png': {
        // 导出PNG
        const dataUrl = await htmlToImage.toPng(clonedSvg, { pixelRatio: scale });
        return { 
          dataUrl, 
          fileName
        };
      }
      
      case 'jpeg': {
        // 导出JPEG
        const jpegUrl = await htmlToImage.toJpeg(clonedSvg, { 
          quality: options.quality || 0.95,
          pixelRatio: scale
        });
        return { 
          dataUrl: jpegUrl, 
          fileName
        };
      }
      
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }
  } catch (error) {
    throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

/**
 * 触发下载图片
 * @param result 导出结果
 */
export const downloadImage = (result: ExportResult): void => {
  const link = document.createElement('a');
  link.download = result.fileName;
  
  if (result.dataUrl) {
    link.href = result.dataUrl;
  } else if (result.blob) {
    link.href = URL.createObjectURL(result.blob);
  } else {
    throw new Error('导出结果中缺少数据');
  }
  
  // 触发下载
  link.click();
  
  // 释放对象URL资源
  if (result.blob) {
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 100);
  }
}; 