'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StreamingContent } from '@/components/ui/typewriter';
import { useStreamingGeneration } from '@/lib/hooks/useStreamingGeneration';
import { 
  Sparkles, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChapterGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  chapterIndex: number;
  initialTitle?: string;
  initialSummary?: string;
  onSuccess?: (chapter: any) => void;
}

export function ChapterGenerationDialog({
  open,
  onOpenChange,
  projectId,
  chapterIndex,
  initialTitle = '',
  initialSummary = '',
  onSuccess,
}: ChapterGenerationDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [showContent, setShowContent] = useState(false);

  const {
    state: {
      isStreaming,
      content,
      progress,
      stage,
      error,
      finalChapter: chapter,
    },
    generateChapter: startGeneration,
    cancelGeneration,
    resetState: resetGeneration,
  } = useStreamingGeneration();

  // 重置表单状态
  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSummary(initialSummary);
      setShowContent(false);
      resetGeneration();
    }
  }, [open, initialTitle, initialSummary, resetGeneration]);

  // 生成完成后的处理
  useEffect(() => {
    if (chapter && !isStreaming) {
      onSuccess?.(chapter);
    }
  }, [chapter, isStreaming, onSuccess]);

  const handleStartGeneration = async () => {
    if (!title.trim()) return;

    setShowContent(true);
    
    const request = {
      project_id: projectId,
      chapter_number: chapterIndex,
      outline: {
        index: chapterIndex,
        title: title.trim(),
        summary: summary.trim(),
        goal: '',
        twist_hint: '',
        important_items: []
      }
    };

    await startGeneration(request);
  };

  const handleClose = () => {
    if (isStreaming) {
      cancelGeneration();
    }
    onOpenChange(false);
  };

  const handleRetry = () => {
    resetGeneration();
    setShowContent(false);
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'preparing': return '准备生成';
      case 'analyzing': return '分析大纲';
      case 'generating': return '生成内容';
      case 'polishing': return '润色优化';
      case 'finalizing': return '完成生成';
      default: return '处理中';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'analyzing': return <FileText className="w-4 h-4" />;
      case 'generating': return <Zap className="w-4 h-4" />;
      case 'polishing': return <Sparkles className="w-4 h-4" />;
      case 'finalizing': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-hidden",
        showContent && "w-full"
      )}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-bold">
              {showContent ? '章节生成中' : '生成章节'}
            </DialogTitle>
            <DialogDescription>
              {showContent 
                ? `正在为您生成第${chapterIndex}章：${title}`
                : '设置章节生成参数，AI将为您创建精彩的章节内容'
              }
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {!showContent ? (
          // 参数设置界面
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="chapter_index">章节序号</Label>
              <Input
                id="chapter_index"
                type="number"
                value={chapterIndex}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter_title">章节标题 *</Label>
              <Input
                id="chapter_title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`第${chapterIndex}章：开始的故事`}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapter_summary">章节摘要</Label>
              <Input
                id="chapter_summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="简要描述本章节的主要内容（可选）"
                className="text-base"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button 
                onClick={handleStartGeneration}
                disabled={!title.trim()}
                className="min-w-[120px]"
              >
                <Play className="w-4 h-4 mr-2" />
                开始生成
              </Button>
            </div>
          </div>
        ) : (
          // 生成进度界面
          <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
            {/* 进度状态 */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStageIcon(stage)}
                      <span className="font-medium">{getStageText(stage)}</span>
                      {isStreaming && (
                        <Badge variant="secondary" className="animate-pulse">
                          生成中
                        </Badge>
                      )}
                      {error && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          错误
                        </Badge>
                      )}
                      {chapter && !isStreaming && (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          完成
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Math.round(progress)}%
                    </div>
                  </div>
                  
                  <Progress value={progress} className="h-2" />
                  
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">生成失败</span>
                      </div>
                      <p className="mt-1">{error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 生成内容 */}
            {content && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">章节内容</h3>
                      <div className="text-sm text-gray-500">
                        {content.length} 字符
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <StreamingContent
                        content={content}
                        isStreaming={isStreaming}
                        typewriterSpeed={20}
                        className="text-gray-800 leading-relaxed"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex space-x-2">
                {error && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    重试
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {isStreaming ? (
                  <Button
                    variant="outline"
                    onClick={cancelGeneration}
                    size="sm"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    取消生成
                  </Button>
                ) : chapter ? (
                  <Button
                    onClick={() => onOpenChange(false)}
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    完成
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    size="sm"
                  >
                    关闭
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}