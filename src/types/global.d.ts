declare module 'html-to-image' {
  type ElementType = HTMLElement | SVGElement;
  
  export function toPng(node: ElementType, options?: any): Promise<string>;
  export function toJpeg(node: ElementType, options?: any): Promise<string>;
  export function toBlob(node: ElementType, options?: any): Promise<Blob>;
  export function toPixelData(node: ElementType, options?: any): Promise<Uint8ClampedArray>;
  export function toCanvas(node: ElementType, options?: any): Promise<HTMLCanvasElement>;
  export function toSvg(node: ElementType, options?: any): Promise<string>;
} 