'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { StreamingContent } from '@/components/ui/typewriter';
import { 
  Loader2, 
  Square, 
  RotateCcw,
  AlertCircle 
} from 'lucide-react';

export interface StreamingStatusProps {
  isStreaming: boolean;
  content: string;
  progress: number;
  stage?: string;
  error?: string;
  finalResult?: any;
  onCancel: () => void;
  onReset: () => void;
  title?: string;
  className?: string;
}

export function StreamingStatus({
  isStreaming,
  content,
  progress,
  stage,
  error,
  finalResult,
  onCancel,
  onReset,
  title = "生成状态",
  className,
}: StreamingStatusProps) {
  const getStatusColor = () => {
    if (error) return 'destructive';
    if (isStreaming) return 'default';
    if (finalResult) return 'success';
    return 'secondary';
  };

  const getStatusText = () => {
    if (error) return '错误';
    if (isStreaming) return '生成中';
    if (finalResult) return '完成';
    return '待机';
  };

  if (!isStreaming && !content && !error) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isStreaming && <Loader2 className="w-4 h-4 animate-spin" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()}>
              {getStatusText()}
            </Badge>
            {isStreaming && (
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
              >
                <Square className="w-4 h-4 mr-2" />
                取消
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 进度条 */}
        {isStreaming && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>进度</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <Progress value={progress * 100} />
          </div>
        )}

        {/* 当前阶段 */}
        {stage && isStreaming && (
          <div>
            <Label>当前阶段</Label>
            <p className="text-sm text-muted-foreground">{stage}</p>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">生成失败</span>
            </div>
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="mt-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </div>
        )}

        {/* 生成内容 */}
        {(content || finalResult) && !error && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>生成内容</Label>
              {!isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重置
                </Button>
              )}
            </div>
            <div className="p-4 bg-muted/50 rounded-md max-h-96 overflow-y-auto">
              <StreamingContent
                content={finalResult || content}
                isStreaming={isStreaming}
                typewriterSpeed={20}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StreamingStatus;