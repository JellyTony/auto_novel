// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

    return await response.json();
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

// 数据类型定义 - 基于 OpenAPI 规范

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

// 项目相关类型
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
  characters: Character[];
  outline?: Outline;
  chapters: Chapter[];
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

export interface CreateProjectResponse {
  project: Project;
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
  polished_chapter: Chapter;
}

// 生成上下文
export interface GenerationContext {
  previous_summary: string;
  characters: Character[];
  timeline: TimelineEvent[];
  props: PropItem[];
  style_examples: string[];
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  description: string;
}

export interface PropItem {
  name: string;
  description: string;
  location: string;
}

// 质量检查相关类型
export interface QualityIssue {
  type: 'grammar' | 'punctuation' | 'spelling' | 'style';
  severity: 'high' | 'medium' | 'low';
  description: string;
  position: string;
  original: string;
  corrected: string;
}

export interface CheckQualityRequest {
  project_id: string;
  chapter_id: string;
  check_types: string[];
  llm_options?: LLMOptions;
}

export interface CheckQualityResponse {
  issues: QualityIssue[];
  summary: QualitySummary;
}

export interface BatchCheckQualityRequest {
  project_id: string;
  chapter_ids: string[];
  check_types: string[];
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
export interface ConsistencyIssue {
  type: 'character' | 'plot' | 'setting' | 'timeline';
  severity: 'high' | 'medium' | 'low';
  description: string;
  chapters_involved: string[];
  suggestions: string[];
}

export interface CheckConsistencyRequest {
  project_id: string;
  chapter_ids: string[];
  check_types: string[];
  llm_options?: LLMOptions;
}

export interface CheckConsistencyResponse {
  issues: ConsistencyIssue[];
  summary: string;
}

// 视频脚本相关类型
export interface VideoScene {
  screen_index: number;
  text: string;
  suggested_bgm_tag: string;
  suggested_image_tag: string;
  tts_voice: 'male' | 'female';
  notes: string;
}

export interface VideoScriptOptions {
  scenes_per_chapter?: number;
  platform: 'tiktok' | 'youtube' | 'bilibili';
  voice_type: 'male' | 'female' | 'auto';
}

export interface GenerateVideoScriptRequest {
  project_id: string;
  chapter_ids: string[];
  options: VideoScriptOptions;
}

export interface GenerateVideoScriptResponse {
  scenes: VideoScene[];
}

export interface VideoScript {
  id: string;
  project_id: string;
  title: string;
  scenes: VideoScene[];
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface ListVideoScriptsResponse {
  scripts: VideoScript[];
  total: number;
}

export interface GetVideoScriptResponse {
  script: VideoScript;
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

  // 一致性检查
  static async checkConsistency(data: CheckConsistencyRequest): Promise<CheckConsistencyResponse> {
    return apiRequest<CheckConsistencyResponse>(`/api/v1/novel/projects/${data.project_id}/consistency`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 模型管理
  static async listModels(): Promise<ListModelsResponse> {
    return apiRequest<ListModelsResponse>('/api/v1/novel/models');
  }

  static async switchModel(data: SwitchModelRequest): Promise<SwitchModelResponse> {
    return apiRequest<SwitchModelResponse>('/api/v1/novel/models/switch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// 视频脚本 API 类
export class VideoScriptAPI {
  static async generateVideoScript(data: GenerateVideoScriptRequest): Promise<GenerateVideoScriptResponse> {
    return apiRequest<GenerateVideoScriptResponse>('/api/v1/novel/video-scripts/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async listVideoScripts(params?: { projectId?: string }): Promise<ListVideoScriptsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.projectId) searchParams.append('project_id', params.projectId);
    
    const url = `/api/v1/novel/video-scripts${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return apiRequest<ListVideoScriptsResponse>(url);
  }

  static async getVideoScript(id: string): Promise<GetVideoScriptResponse> {
    return apiRequest<GetVideoScriptResponse>(`/api/v1/novel/video-scripts/${id}`);
  }

  static async deleteVideoScript(id: string): Promise<void> {
    return apiRequest<void>(`/api/v1/novel/video-scripts/${id}`, {
      method: 'DELETE',
    });
  }
}

// 导出主要类和函数
export { apiRequest };
export default { NovelAPI, VideoScriptAPI };