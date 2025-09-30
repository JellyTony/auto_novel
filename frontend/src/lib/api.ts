// API 基础配置
// 使用相对路径，通过 Next.js 的 rewrites 代理访问后端 API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

// ==================== 小说服务相关类型定义 ====================

// 项目相关类型
export interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  targetAudience: string;
  tone: string;
  themes: string[];
  status: string;
  worldView?: WorldView;
  characters?: Character[];
  outline?: Outline;
  chapters?: Chapter[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  genre: string;
  targetAudience: string;
  tone: string;
  themes: string[];
}

export interface CreateProjectResponse {
  project: Project;
}

export interface GetProjectRequest {
  projectId: string;
}

export interface GetProjectResponse {
  project: Project;
}

export interface ListProjectsRequest {
  page?: number;
  pageSize?: number;
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
}

// 世界观相关类型
export interface WorldView {
  id: string;
  projectId: string;
  genre: string;
  setting: string;
  keyRules: string[];
  tone: string;
  targetAudience: string;
  themes: string[];
  description: string;
  createdAt?: string;
}

export interface GenerateWorldViewRequest {
  projectId: string;
  genre: string;
  setting: string;
  keyRules: string[];
  tone: string;
  targetAudience: string;
  themes: string[];
  llmOptions?: LLMOptions;
}

export interface GenerateWorldViewResponse {
  worldView: WorldView;
}

// 角色相关类型
export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  age: number;
  gender: string;
  occupation: string;
  personality: string[];
  background: string;
  abilities: string[];
  goals: string[];
  conflicts: string[];
  relationshipMap: { [key: string]: string };
}

export interface GenerateCharactersRequest {
  projectId: string;
  characterNames: string[];
  worldView: WorldView;
  llmOptions?: LLMOptions;
}

export interface GenerateCharactersResponse {
  characters: Character[];
}

// 大纲相关类型
export interface ChapterOutline {
  index: number;
  title: string;
  summary: string;
  goal: string;
  twistHint: string;
  importantItems: string[];
}

export interface Outline {
  id: string;
  projectId: string;
  chapters: ChapterOutline[];
}

export interface GenerateOutlineRequest {
  projectId: string;
  chapterCount: number;
  worldView: WorldView;
  characters: Character[];
  llmOptions?: LLMOptions;
}

export interface GenerateOutlineResponse {
  outline: Outline;
}

// 章节相关类型
export interface Chapter {
  id: string;
  projectId: string;
  index: number;
  title: string;
  summary: string;
  rawContent: string;
  wordCount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenerateChapterRequest {
  projectId: string;
  chapterIndex: number;
  chapterOutline: ChapterOutline;
  generationContext: GenerationContext;
  llmOptions?: LLMOptions;
}

export interface GenerateChapterResponse {
  chapter: Chapter;
}

export interface PolishChapterRequest {
  projectId: string;
  chapterId: string;
  requirements: string;
  llmOptions?: LLMOptions;
}

export interface PolishChapterResponse {
  chapter: Chapter;
}

// 质量检查相关类型
export interface QualityIssue {
  type: string;
  severity: string;
  description: string;
  suggestions: string[];
  location: string;
}

export interface QualityReport {
  chapterId: string;
  overallScore: number;
  issues: QualityIssue[];
  suggestions: string[];
}

export interface CheckQualityRequest {
  projectId: string;
  chapterId: string;
}

export interface CheckQualityResponse {
  report: QualityReport;
}

export interface BatchCheckQualityRequest {
  projectId: string;
  chapterIds: string[];
}

export interface BatchCheckQualityResponse {
  reports: QualityReport[];
}

// 一致性检查相关类型
export interface ConsistencyIssue {
  type: string;
  description: string;
  affectedChapters: string[];
  suggestions: string[];
}

export interface ConsistencyReport {
  projectId: string;
  issues: ConsistencyIssue[];
  overallScore: number;
}

export interface CheckConsistencyRequest {
  projectId: string;
}

export interface CheckConsistencyResponse {
  report: ConsistencyReport;
}

// 生成上下文类型
export interface TimelineEvent {
  timestamp: string;
  event: string;
  characters: string[];
  location: string;
}

export interface PropItem {
  name: string;
  description: string;
  owner: string;
  importance: string;
}

export interface GenerationContext {
  previousSummary: string;
  characters: Character[];
  timeline: TimelineEvent[];
  props: PropItem[];
  styleExamples: string[];
}

// LLM选项类型
export interface LLMOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

// ==================== 小说服务API类 ====================

export class NovelAPI {
  // 项目管理
  static async createProject(request: CreateProjectRequest): Promise<CreateProjectResponse> {
    return apiRequest<CreateProjectResponse>('/api/v1/novel/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async getProject(projectId: string): Promise<GetProjectResponse> {
    return apiRequest<GetProjectResponse>(`/api/v1/novel/projects/${projectId}`);
  }

  static async listProjects(request: ListProjectsRequest = {}): Promise<ListProjectsResponse> {
    const params = new URLSearchParams();
    if (request.page) params.append('page', request.page.toString());
    if (request.pageSize) params.append('page_size', request.pageSize.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/v1/novel/projects?${queryString}` : '/api/v1/novel/projects';
    
    return apiRequest<ListProjectsResponse>(url);
  }

  // 世界观生成
  static async generateWorldView(request: GenerateWorldViewRequest): Promise<GenerateWorldViewResponse> {
    return apiRequest<GenerateWorldViewResponse>(`/api/v1/novel/projects/${request.projectId}/worldview`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 角色生成
  static async generateCharacters(request: GenerateCharactersRequest): Promise<GenerateCharactersResponse> {
    return apiRequest<GenerateCharactersResponse>(`/api/v1/novel/projects/${request.projectId}/characters`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 大纲生成
  static async generateOutline(request: GenerateOutlineRequest): Promise<GenerateOutlineResponse> {
    return apiRequest<GenerateOutlineResponse>(`/api/v1/novel/projects/${request.projectId}/outline`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 章节生成
  static async generateChapter(request: GenerateChapterRequest): Promise<GenerateChapterResponse> {
    return apiRequest<GenerateChapterResponse>(`/api/v1/novel/projects/${request.projectId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 章节润色
  static async polishChapter(request: PolishChapterRequest): Promise<PolishChapterResponse> {
    return apiRequest<PolishChapterResponse>(`/api/v1/novel/projects/${request.projectId}/chapters/${request.chapterId}/polish`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 质量检查
  static async checkQuality(request: CheckQualityRequest): Promise<CheckQualityResponse> {
    return apiRequest<CheckQualityResponse>(`/api/v1/novel/projects/${request.projectId}/chapters/${request.chapterId}/quality`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 批量质量检查
  static async batchCheckQuality(request: BatchCheckQualityRequest): Promise<BatchCheckQualityResponse> {
    return apiRequest<BatchCheckQualityResponse>(`/api/v1/novel/projects/${request.projectId}/quality/batch`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // 一致性检查
  static async checkConsistency(request: CheckConsistencyRequest): Promise<CheckConsistencyResponse> {
    return apiRequest<CheckConsistencyResponse>(`/api/v1/novel/projects/${request.projectId}/consistency`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}

// ==================== 视频脚本服务相关类型定义 ====================
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