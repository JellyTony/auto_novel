// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// 请求配置
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 短视频脚本相关的类型定义
export interface VideoScene {
  index: number;
  duration: number;
  shotType: string;
  visualDescription: string;
  narration: string;
  subtitle: string;
  soundEffects?: string[];
  transition?: string;
  keyElements?: string[];
}

export interface VideoHooks {
  opening: string;
  climax: string;
  ending: string;
}

export interface VideoScript {
  id: string;
  projectId: string;
  chapterId: string;
  title: string;
  duration: number;
  platform: string;
  style: string;
  scenes: VideoScene[];
  hooks?: VideoHooks;
  hashtags?: string[];
  description: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// 生成视频脚本请求参数
export interface GenerateVideoScriptRequest {
  projectId: string;
  chapterId: string;
  chapterTitle: string;
  chapterContent: string;
  platform: string;
  duration: number;
  style: string;
  requirements?: string;
}

// 生成视频脚本响应
export interface GenerateVideoScriptResponse {
  videoScript: VideoScript;
}

// 优化视频脚本请求参数
export interface OptimizeVideoScriptRequest {
  scriptId: string;
  requirements: string;
  optimizeType?: string;
}

// 优化视频脚本响应
export interface OptimizeVideoScriptResponse {
  videoScript: VideoScript;
}

// 生成平台变体请求参数
export interface GeneratePlatformVariantsRequest {
  baseScriptId: string;
  targetPlatforms: string[];
}

// 生成平台变体响应
export interface GeneratePlatformVariantsResponse {
  variants: VideoScript[];
}

// 获取视频脚本列表请求参数
export interface ListVideoScriptsRequest {
  projectId: string;
  page?: number;
  pageSize?: number;
}

// 获取视频脚本列表响应
export interface ListVideoScriptsResponse {
  scripts: VideoScript[];
  total: number;
}

// 获取视频脚本详情响应
export interface GetVideoScriptResponse {
  videoScript: VideoScript;
}

// 删除视频脚本响应
export interface DeleteVideoScriptResponse {
  success: boolean;
}

// 短视频脚本 API 类
export class VideoScriptAPI {
  // 生成视频脚本
  static async generateVideoScript(
    request: GenerateVideoScriptRequest
  ): Promise<GenerateVideoScriptResponse> {
    return apiRequest<GenerateVideoScriptResponse>('/v1/video-scripts/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 优化视频脚本
  static async optimizeVideoScript(
    request: OptimizeVideoScriptRequest
  ): Promise<OptimizeVideoScriptResponse> {
    return apiRequest<OptimizeVideoScriptResponse>(`/v1/video-scripts/${request.scriptId}/optimize`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // 生成平台变体
  static async generatePlatformVariants(
    request: GeneratePlatformVariantsRequest
  ): Promise<GeneratePlatformVariantsResponse> {
    return apiRequest<GeneratePlatformVariantsResponse>(`/v1/video-scripts/${request.baseScriptId}/variants`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 获取视频脚本列表
  static async listVideoScripts(
    request: ListVideoScriptsRequest
  ): Promise<ListVideoScriptsResponse> {
    return apiRequest<ListVideoScriptsResponse>(`/v1/projects/${request.projectId}/video-scripts`);
  }

  // 获取视频脚本详情
  static async getVideoScript(scriptId: string): Promise<GetVideoScriptResponse> {
    return apiRequest<GetVideoScriptResponse>(`/v1/video-scripts/${scriptId}`);
  }

  // 删除视频脚本
  static async deleteVideoScript(scriptId: string): Promise<DeleteVideoScriptResponse> {
    return apiRequest<DeleteVideoScriptResponse>(`/v1/video-scripts/${scriptId}`, {
      method: 'DELETE',
    });
  }
}

// 导出默认实例
export default VideoScriptAPI;