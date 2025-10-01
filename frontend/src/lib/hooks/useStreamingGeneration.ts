import { useState, useCallback, useRef } from 'react';
import { streamingAPI, GenerateChapterRequest, GenerateChapterStreamResponse, Chapter } from '../api';

export interface StreamingState {
  isStreaming: boolean;
  content: string;
  progress: number;
  stage: string;
  error: string | null;
  finalChapter: Chapter | null;
}

export interface UseStreamingGenerationReturn {
  state: StreamingState;
  generateChapter: (request: GenerateChapterRequest) => Promise<void>;
  cancelGeneration: () => void;
  resetState: () => void;
}

export function useStreamingGeneration(): UseStreamingGenerationReturn {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    progress: 0,
    stage: '',
    error: null,
    finalChapter: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetState = useCallback(() => {
    setState({
      isStreaming: false,
      content: '',
      progress: 0,
      stage: '',
      error: null,
      finalChapter: null,
    });
  }, []);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isStreaming: false,
      stage: '生成已取消',
    }));
  }, []);

  const generateChapter = useCallback(async (request: GenerateChapterRequest) => {
    // 重置状态
    resetState();
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({
      ...prev,
      isStreaming: true,
      stage: '开始生成...',
    }));

    try {
      await streamingAPI.generateChapterStream(
        request,
        (response: GenerateChapterStreamResponse) => {
          setState(prev => {
            const newState = { ...prev };

            switch (response.type) {
              case 'CONTENT':
                if (response.content_chunk) {
                  newState.content += response.content_chunk;
                }
                break;

              case 'PROGRESS':
                if (response.progress !== undefined) {
                  newState.progress = response.progress;
                }
                if (response.stage) {
                  newState.stage = response.stage;
                }
                break;

              case 'METADATA':
                // 处理元数据，如章节ID、标题、字数等
                break;

              case 'ERROR':
                newState.error = response.error_message || '生成过程中发生错误';
                newState.isStreaming = false;
                break;

              case 'COMPLETE':
                newState.isStreaming = false;
                newState.progress = 1.0;
                newState.stage = '生成完成';
                if (response.final_chapter) {
                  newState.finalChapter = response.final_chapter;
                }
                break;
            }

            return newState;
          });
        },
        (error: Error) => {
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: error.message,
            stage: '生成失败',
          }));
        },
        () => {
          setState(prev => ({
            ...prev,
            isStreaming: false,
          }));
        }
      );
    } catch (error) {
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : '未知错误',
        stage: '生成失败',
      }));
    } finally {
      abortControllerRef.current = null;
    }
  }, [resetState]);

  return {
    state,
    generateChapter,
    cancelGeneration,
    resetState,
  };
}