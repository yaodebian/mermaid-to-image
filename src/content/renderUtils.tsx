import React from 'react';
import MermaidPreview from '../components/MermaidPreview';
import MermaidExtractor from '../components/MermaidExtractor';

// 预览层组件
export const renderPreviewLayer: React.FC<{onClose: () => void}> = ({ onClose }) => {
  return (
    <div className="w-full h-full">
      <MermaidPreview />
    </div>
  );
};

// 提取层组件
export const renderExtractLayer: React.FC<{onClose: () => void}> = ({ onClose }) => {
  return (
    <div className="w-full h-full">
      <MermaidExtractor onClose={onClose} />
    </div>
  );
}; 