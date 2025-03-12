import React, { useState, useRef, useEffect } from 'react';

interface FloatingContainerProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const FloatingContainer: React.FC<FloatingContainerProps> = ({ title, onClose, children }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const resizeStartSize = useRef({ width: 0, height: 0 });
  const resizeStartPos = useRef({ x: 0, y: 0 });

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  // 处理调整大小开始
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartSize.current = { ...size };
    resizeStartPos.current = { x: e.clientX, y: e.clientY };
  };

  // 处理双击折叠/展开
  const handleTitleDoubleClick = () => {
    setIsCollapsed(!isCollapsed);
  };

  // 拖拽和调整大小的全局鼠标移动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      } else if (isResizing) {
        const newWidth = resizeStartSize.current.width + (e.clientX - resizeStartPos.current.x);
        const newHeight = resizeStartSize.current.height + (e.clientY - resizeStartPos.current.y);
        setSize({
          width: Math.max(300, newWidth),
          height: Math.max(200, newHeight)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  // 防止浮层超出浏览器窗口
  useEffect(() => {
    const checkBounds = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      
      if (rect.right > viewportWidth) {
        newX = viewportWidth - rect.width;
      }
      if (rect.left < 0) {
        newX = 0;
      }
      if (rect.bottom > viewportHeight) {
        newY = viewportHeight - rect.height;
      }
      if (rect.top < 0) {
        newY = 0;
      }
      
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    };
    
    checkBounds();
    window.addEventListener('resize', checkBounds);
    
    return () => {
      window.removeEventListener('resize', checkBounds);
    };
  }, [position, size]);

  return (
    <div 
      ref={containerRef}
      className="floating-container"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: isCollapsed ? 'auto' : `${size.height}px`,
      }}
    >
      <div 
        className="drag-handle"
        onMouseDown={handleDragStart}
        onDoubleClick={handleTitleDoubleClick}
      >
        <div className="font-medium">{title}</div>
        <button
          className="text-gray-600 hover:text-gray-900"
          onClick={onClose}
          aria-label="关闭"
          tabIndex={0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
          
          <div 
            className="resize-handle"
            onMouseDown={handleResizeStart}
          >
            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 22H17V19H22V22ZM22 13H13V17H22V13ZM22 7H7V11H22V7ZM22 2H2V5H22V2Z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingContainer; 