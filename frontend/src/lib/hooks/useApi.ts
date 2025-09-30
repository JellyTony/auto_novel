import { useState, useCallback } from 'react';
import { APIError } from '../api';

// 通用 API 状态管理 Hook
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: APIError) => void;
  showErrorToast?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : '网络请求失败，请稍后重试';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      if (options.onError && error instanceof APIError) {
        options.onError(error);
      }
      
      // 可选的错误提示
      if (options.showErrorToast !== false) {
        console.error('API Error:', errorMessage);
        // 这里可以集成 toast 通知库
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// 专门用于列表数据的 Hook
export function useApiList<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<ApiState<T[]>>({
    data: [],
    loading: false,
    error: null,
  });

  const execute = useCallback(async (apiCall: () => Promise<T[]>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await apiCall();
      setState({ data, loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : '网络请求失败，请稍后重试';
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      
      if (options.onError && error instanceof APIError) {
        options.onError(error);
      }
      
      if (options.showErrorToast !== false) {
        console.error('API Error:', errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: [], loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// 用于表单提交的 Hook
export function useApiMutation<TData = any, TVariables = any>(
  options: UseApiOptions = {}
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (
    apiCall: (variables: TVariables) => Promise<TData>,
    variables: TVariables
  ) => {
    setState({ loading: true, error: null });
    
    try {
      const data = await apiCall(variables);
      setState({ loading: false, error: null });
      
      if (options.onSuccess) {
        options.onSuccess(data);
      }
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : '操作失败，请稍后重试';
      
      setState({ loading: false, error: errorMessage });
      
      if (options.onError && error instanceof APIError) {
        options.onError(error);
      }
      
      if (options.showErrorToast !== false) {
        console.error('API Error:', errorMessage);
      }
      
      throw error;
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// 错误处理工具函数
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '未知错误';
}

// 重试工具函数
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  
  throw lastError!;
}