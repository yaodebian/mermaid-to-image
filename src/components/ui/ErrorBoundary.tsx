import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 错误边界组件
 * 用于捕获子组件渲染过程中的错误，并显示友好的错误提示
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("组件渲染错误:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  resetError = (): void => {
    this.setState({ 
      hasError: false, 
      error: null 
    });
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">
          <h3 className="font-bold mb-2">组件渲染错误</h3>
          <p>{this.state.error?.toString() || '未知错误'}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded"
            onClick={this.resetError}
          >
            重试
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default ErrorBoundary; 