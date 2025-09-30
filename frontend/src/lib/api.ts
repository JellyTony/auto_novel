// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 通用 API 请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    // 检查响应是否为空
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0,
      error
    );
  }
}

// API 错误类
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 数据类型定义 - 基于后端实际返回格式

// 基础类型
export interface LLMOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  model?: string;
}

export interface ModelInfo {
  name: string;
  provider: string;
  model: string;
  description: string;
  available: boolean;
}

// 项目相关类型 - 根据后端实际返回格式调整
export interface Project {
  id: string;
  title: string;
  description?: string;
  genre: string;
  target_audience: string;
  tone: string;
  themes: string[];
  status: 'draft' | 'generating' | 'completed' | 'error';
  world_view?: WorldView;
  characters?: Character[];
  outline?: Outline;
  chapters?: Chapter[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
  genre: string;
  target_audience: string;
  tone: string;
  themes: string[];
}

// 根据后端实际返回格式调整
export interface CreateProjectResponse {
  project_id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface GetProjectResponse {
  project: Project;
}

export interface ListProjectsResponse {
  projects: Project[];
  total: number;
}

// 世界观相关类型
export interface WorldView {
  title: string;
  synopsis: string;
  setting: string;
  key_rules: string[];
  tone_examples: string[];
  themes: string[];
}

export interface GenerateWorldViewRequest {
  project_id: string;
  genre: string;
  setting: string;
  key_rules: string[];
  tone: string;
  target_audience: string;
  themes: string[];
  llm_options?: LLMOptions;
}

export interface GenerateWorldViewResponse {
  world_view: WorldView;
}

// 角色相关类型
export interface Character {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  personality: string;
  background: string;
  appearance: string;
  relationships: string[];
  goals: string[];
  conflicts: string[];
  arc: string;
}

export interface GenerateCharactersRequest {
  project_id: string;
  character_count: number;
  world_view: WorldView;
  llm_options?: LLMOptions;
}

export interface GenerateCharactersResponse {
  characters: Character[];
}

// 大纲相关类型
export interface ChapterOutline {
  chapter_number: number;
  title: string;
  summary: string;
  key_events: string[];
  characters_involved: string[];
  word_count_target: number;
}

export interface Outline {
  id: string;
  project_id: string;
  chapters: ChapterOutline[];
}

export interface GenerateOutlineRequest {
  project_id: string;
  chapter_count: number;
  world_view: WorldView;
  characters: Character[];
  llm_options?: LLMOptions;
}

export interface GenerateOutlineResponse {
  outline: Outline;
}

// 章节相关类型
export interface Chapter {
  id: string;
  project_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  status: 'draft' | 'generating' | 'completed' | 'polished';
  created_at: string;
  updated_at: string;
}

export interface GenerationContext {
  previous_chapters?: string[];
  character_states?: { [key: string]: any };
  plot_threads?: string[];
}

export interface GenerateChapterRequest {
  project_id: string;
  chapter_number: number;
  outline: ChapterOutline;
  context?: GenerationContext;
  llm_options?: LLMOptions;
}

export interface GenerateChapterResponse {
  chapter: Chapter;
}

export interface PolishChapterRequest {
  project_id: string;
  chapter_id: string;
  style: string;
  focus: string[];
  llm_options?: LLMOptions;
}

export interface PolishChapterResponse {
  chapter: Chapter;
}

// 质量检测相关类型
export interface QualityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  line_number?: number;
  context?: string;
}

export interface CheckQualityRequest {
  project_id: string;
  chapter_id: string;
  check_type: 'polish' | 'proofread' | 'critique' | 'consistency' | 'all';
  llm_options?: LLMOptions;
}

export interface CheckQualityResponse {
  issues: QualityIssue[];
  overall_score: number;
  recommendations: string[];
  summary: string;
}

export interface BatchCheckQualityRequest {
  project_id: string;
  chapter_ids: string[];
  check_type: 'polish' | 'proofread' | 'critique' | 'consistency' | 'all';
  llm_options?: LLMOptions;
}

export interface BatchCheckQualityResponse {
  results: { [key: string]: CheckQualityResponse };
  overall_summary: QualitySummary;
}

export interface QualitySummary {
  total_issues: number;
  issues_by_type: { [key: string]: number };
  issues_by_severity: { [key: string]: number };
  recommendations: string[];
  quality_trends: number[];
}

// 一致性检查相关类型
export interface CheckConsistencyRequest {
  project_id: string;
  llm_options?: LLMOptions;
}

export interface CheckConsistencyResponse {
  consistency_issues: QualityIssue[];
  character_consistency: { [key: string]: any };
  plot_consistency: { [key: string]: any };
  world_consistency: { [key: string]: any };
  overall_score: number;
  summary: string;
}

// 导出相关类型
export interface ExportNovelRequest {
  project_id: string;
  format: 'txt' | 'epub' | 'pdf' | 'docx';
  include_metadata: boolean;
  chapter_range?: {
    start: number;
    end: number;
  };
}

export interface ExportNovelResponse {
  download_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}

// 视频脚本相关类型 - 根据OpenAPI规范更新
export interface VideoScene {
  index: number;
  duration: number;
  shot_type: string;
  visual_description: string;
  narration: string;
  subtitle: string;
  sound_effects: string[];
  transition: string;
  key_elements: string[];
}

export interface VideoHooks {
  opening: string;
  climax: string;
  ending: string;
}

export interface VideoScript {
  id: string;
  project_id: string;
  chapter_id: string;
  title: string;
  duration: number;
  platform: string;
  style: string;
  scenes: VideoScene[];
  hooks: VideoHooks;
  hashtags: string[];
  description: string;
  status: 'draft' | 'optimized' | 'variant' | 'published';
  created_at: string;
  updated_at: string;
}

export interface GenerateVideoScriptRequest {
  project_id: string;
  chapter_id: string;
  chapter_title: string;
  chapter_content: string;
  platform: 'douyin' | 'kuaishou' | 'bilibili' | 'xiaohongshu' | 'weibo';
  duration: number;
  style: 'dramatic' | 'humorous' | 'suspenseful' | 'romantic' | 'action';
  requirements?: string;
}

export interface GenerateVideoScriptResponse {
  video_script: VideoScript;
}

export interface ListVideoScriptsResponse {
  scripts: VideoScript[];
  total: number;
}

export interface GetVideoScriptResponse {
  video_script: VideoScript;
}

export interface OptimizeVideoScriptRequest {
  project_id: string;
  script_id: string;
  requirements: string;
}

export interface OptimizeVideoScriptResponse {
  video_script: VideoScript;
}

export interface GeneratePlatformVariantsRequest {
  base_script_id: string;
  target_platforms: string[];
}

export interface GeneratePlatformVariantsResponse {
  variants: VideoScript[];
}

export interface DeleteVideoScriptResponse {
  success: boolean;
}

// 模型管理相关类型
export interface ListModelsResponse {
  models: ModelInfo[];
  current_model: string;
}

export interface SwitchModelRequest {
  model_name: string;
}

export interface SwitchModelResponse {
  success: boolean;
  message: string;
  current_model: string;
}

// 小说 API 类
export class NovelAPI {
  // 项目管理
  static async listProjects(params?: { page?: number; pageSize?: number }): Promise<ListProjectsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString());
    
    const url = `/api/v1/novel/projects${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiRequest<ListProjectsResponse>(url);
  }

  static async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    return apiRequest<CreateProjectResponse>('/api/v1/novel/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getProject(id: string): Promise<GetProjectResponse> {
    return apiRequest<GetProjectResponse>(`/api/v1/novel/projects/${id}`);
  }

  static async deleteProject(id: string): Promise<void> {
    return apiRequest<void>(`/api/v1/novel/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // 世界观生成
  static async generateWorldView(data: GenerateWorldViewRequest): Promise<GenerateWorldViewResponse> {
    return apiRequest<GenerateWorldViewResponse>(`/api/v1/novel/projects/${data.project_id}/worldview`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 角色生成
  static async generateCharacters(data: GenerateCharactersRequest): Promise<GenerateCharactersResponse> {
    return apiRequest<GenerateCharactersResponse>(`/api/v1/novel/projects/${data.project_id}/characters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 大纲生成
  static async generateOutline(data: GenerateOutlineRequest): Promise<GenerateOutlineResponse> {
    return apiRequest<GenerateOutlineResponse>(`/api/v1/novel/projects/${data.project_id}/outline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 章节生成
  static async generateChapter(data: GenerateChapterRequest): Promise<GenerateChapterResponse> {
    return apiRequest<GenerateChapterResponse>(`/api/v1/novel/projects/${data.project_id}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 章节润色
  static async polishChapter(data: PolishChapterRequest): Promise<PolishChapterResponse> {
    return apiRequest<PolishChapterResponse>(`/api/v1/novel/projects/${data.project_id}/chapters/${data.chapter_id}/polish`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 质量检查
  static async checkQuality(data: CheckQualityRequest): Promise<CheckQualityResponse> {
    return apiRequest<CheckQualityResponse>(`/api/v1/novel/projects/${data.project_id}/chapters/${data.chapter_id}/quality`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async batchCheckQuality(data: BatchCheckQualityRequest): Promise<BatchCheckQualityResponse> {
    return apiRequest<BatchCheckQualityResponse>(`/api/v1/novel/projects/${data.project_id}/quality/batch`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async checkConsistency(data: CheckConsistencyRequest): Promise<CheckConsistencyResponse> {
    return apiRequest<CheckConsistencyResponse>(`/api/v1/novel/projects/${data.project_id}/consistency`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 导出功能
  static async exportNovel(data: ExportNovelRequest): Promise<ExportNovelResponse> {
    return apiRequest<ExportNovelResponse>(`/api/v1/novel/projects/${data.project_id}/export`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 模型管理
  static async listModels(): Promise<ListModelsResponse> {
    return apiRequest<ListModelsResponse>('/api/v1/novel/models');
  }

  static async switchModel(data: SwitchModelRequest): Promise<SwitchModelResponse> {
    return apiRequest<SwitchModelResponse>('/api/v1/novel/switch-model', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 视频脚本生成 - 根据 openapi.yaml 修正路径
  static async generateVideoScript(data: GenerateVideoScriptRequest): Promise<GenerateVideoScriptResponse> {
    return apiRequest<GenerateVideoScriptResponse>(`/api/v1/novel/projects/${data.project_id}/video-script`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取统计信息
  static async getStats(): Promise<GetStatsResponse> {
    return apiRequest<GetStatsResponse>('/api/v1/novel/stats');
  }
}

// 项目统计信息接口
export interface ProjectStats {
  totalProjects: number;
  completedProjects: number;
  totalWords: number;
  monthlyWords: number;
}

export interface GetStatsResponse {
  stats: ProjectStats;
}

// 视频脚本 API 类 - 独立的视频脚本服务
export class VideoScriptAPI {
  static async generateVideoScript(data: GenerateVideoScriptRequest): Promise<GenerateVideoScriptResponse> {
    return apiRequest<GenerateVideoScriptResponse>('/api/v1/video-scripts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async listVideoScripts(params?: { page?: number; pageSize?: number }): Promise<ListVideoScriptsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.pageSize) searchParams.append('page_size', params.pageSize.toString());
    
    const url = `/api/v1/video-scripts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiRequest<ListVideoScriptsResponse>(url);
  }

  static async getVideoScript(id: string): Promise<GetVideoScriptResponse> {
    return apiRequest<GetVideoScriptResponse>(`/api/v1/video-scripts/${id}`);
  }

  static async optimizeVideoScript(data: OptimizeVideoScriptRequest): Promise<OptimizeVideoScriptResponse> {
    return apiRequest<OptimizeVideoScriptResponse>(`/api/v1/video-scripts/${data.script_id}/optimize`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async generatePlatformVariants(data: GeneratePlatformVariantsRequest): Promise<GeneratePlatformVariantsResponse> {
    return apiRequest<GeneratePlatformVariantsResponse>(`/api/v1/video-scripts/${data.base_script_id}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteVideoScript(id: string): Promise<DeleteVideoScriptResponse> {
    return apiRequest<DeleteVideoScriptResponse>(`/api/v1/video-scripts/${id}`, {
      method: 'DELETE',
    });
  }
}

// 导出主要类和函数
export { apiRequest };
export default { NovelAPI, VideoScriptAPI };