package video_script

import "backend/internal/pkg/models"

// GenerateVideoScriptRequest 生成短视频脚本请求
type GenerateVideoScriptRequest struct {
	ProjectID      string `json:"project_id"`
	ChapterID      string `json:"chapter_id"`
	ChapterTitle   string `json:"chapter_title"`
	ChapterContent string `json:"chapter_content"`
	Platform       string `json:"platform"`       // 目标平台：douyin/kuaishou/bilibili/xiaohongshu/weibo
	Duration       int    `json:"duration"`       // 视频时长（秒）
	Style          string `json:"style"`          // 风格：dramatic/humorous/suspenseful/romantic/action
	Requirements   string `json:"requirements"`   // 特殊要求
}

// GenerateVideoScriptResponse 生成短视频脚本响应
type GenerateVideoScriptResponse struct {
	VideoScript *models.VideoScript `json:"video_script"`
}

// OptimizeVideoScriptRequest 优化短视频脚本请求
type OptimizeVideoScriptRequest struct {
	VideoScript              *models.VideoScript `json:"video_script"`
	OptimizationRequirements string              `json:"optimization_requirements"`
}

// OptimizeVideoScriptResponse 优化短视频脚本响应
type OptimizeVideoScriptResponse struct {
	VideoScript *models.VideoScript `json:"video_script"`
}

// GeneratePlatformVariantsRequest 生成平台变体请求
type GeneratePlatformVariantsRequest struct {
	BaseScript      *models.VideoScript `json:"base_script"`
	TargetPlatforms []string            `json:"target_platforms"`
}

// GeneratePlatformVariantsResponse 生成平台变体响应
type GeneratePlatformVariantsResponse struct {
	Variants []*models.VideoScript `json:"variants"`
}

// VideoScriptAgent 短视频脚本生成Agent接口
type VideoScriptAgent interface {
	// GenerateVideoScript 生成短视频脚本
	GenerateVideoScript(req *GenerateVideoScriptRequest) (*GenerateVideoScriptResponse, error)
	
	// OptimizeVideoScript 优化短视频脚本
	OptimizeVideoScript(req *OptimizeVideoScriptRequest) (*OptimizeVideoScriptResponse, error)
	
	// GeneratePlatformVariants 生成不同平台的脚本变体
	GeneratePlatformVariants(req *GeneratePlatformVariantsRequest) (*GeneratePlatformVariantsResponse, error)
	
	// GetCapabilities 获取Agent能力描述
	GetCapabilities() map[string]interface{}
}