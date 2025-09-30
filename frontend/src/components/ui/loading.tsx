import React from 'react';
import { cn } from '@/lib/utils';

// 加载动画组件
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
      />
    </div>
  );
}

// 加载状态的骨架屏组件
export interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'bg-gray-200 rounded',
            index === 0 ? 'h-4' : 'h-3 mt-2',
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// 页面级加载组件
export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

// 按钮加载状态组件
export interface ButtonLoadingProps {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ButtonLoading({ loading, children, className }: ButtonLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {loading && <Loading size="sm" />}
      {children}
    </div>
  );
}

// 卡片加载骨架
export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

// 表格加载骨架
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {/* 表头 */}
      <div className="flex space-x-4 mb-4">
        {Array.from({ length: cols }).map((_, index) => (
          <div key={index} className="flex-1 h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 mb-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 列表加载骨架
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}