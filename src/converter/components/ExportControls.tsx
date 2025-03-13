import React from 'react';
import { ExportFormat, ScaleFactor } from '../../services/image-export';

interface ExportControlsProps {
  format: ExportFormat;
  scale: ScaleFactor;
  onFormatChange: (format: ExportFormat) => void;
  onScaleChange: (scale: ScaleFactor) => void;
  onExport: () => void;
  disabled?: boolean;
}

/**
 * 导出控制组件
 * 提供格式选择、尺寸倍数选择和导出按钮
 */
const ExportControls: React.FC<ExportControlsProps> = ({
  format,
  scale,
  onFormatChange,
  onScaleChange,
  onExport,
  disabled = false
}) => {
  return (
    <div className="export-controls flex items-center space-x-3">
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">导出格式</label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value as ExportFormat)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="svg">SVG (矢量图)</option>
          <option value="png">PNG (透明背景)</option>
          <option value="jpeg">JPEG (不透明)</option>
        </select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">尺寸倍数</label>
        <select
          value={scale}
          onChange={(e) => onScaleChange(Number(e.target.value) as ScaleFactor)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="1">1x (标准)</option>
          <option value="2">2x (高清)</option>
          <option value="3">3x (超高清)</option>
        </select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm text-gray-600 mb-1">&nbsp;</label>
        <button
          onClick={onExport}
          disabled={disabled}
          className={`w-full px-4 py-2 rounded text-sm font-medium ${
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          导出图片
        </button>
      </div>
    </div>
  );
};

export default ExportControls; 