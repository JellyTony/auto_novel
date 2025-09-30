import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// 错误边界组件
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">出现了一些问题</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            {this.state.error?.message || '应用程序遇到了意外错误，请尝试刷新页面。'}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// API 错误显示组件
export interface ApiErrorProps {
  error: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className }: ApiErrorProps) {
  if (!error) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className || ''}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">请求失败</h3>
          <p className="text-sm text-red-700">{error}</p>
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 空状态组件
export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon,
  className 
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ''}`}>
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

// 网络错误组件
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">网络连接失败</h3>
      <p className="text-gray-600 mb-6 max-w-md">
        无法连接到服务器，请检查您的网络连接后重试。
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          重新连接
        </Button>
      )}
    </div>
  );
}