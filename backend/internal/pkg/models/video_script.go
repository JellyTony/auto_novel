package models

import "time"

// VideoScript 短视频脚本
type VideoScript struct {
	ID          string              `json:"id"`          // 视频脚本ID
	ProjectID   string              `json:"project_id"`  // 项目ID
	ChapterID   string              `json:"chapter_id"`  // 章节ID
	Title       string              `json:"title"`       // 视频标题
	Duration    int                 `json:"duration"`    // 视频时长（秒）
	Platform    string              `json:"platform"`    // 目标平台
	Style       string              `json:"style"`       // 风格
	Scenes      []*VideoScriptScene `json:"scenes"`      // 分镜场景
	Hooks       *VideoHooks         `json:"hooks"`       // 钩子点
	Hashtags    []string            `json:"hashtags"`    // 标签
	Description string              `json:"description"` // 视频描述
	Status      string              `json:"status"`      // 状态：draft/optimized/variant/published
	CreatedAt   time.Time           `json:"created_at"`  // 创建时间
	UpdatedAt   time.Time           `json:"updated_at"`  // 更新时间
}

// VideoScriptScene 视频脚本分镜场景
type VideoScriptScene struct {
	Index             int      `json:"index"`              // 场景序号
	Duration          int      `json:"duration"`           // 场景时长（秒）
	ShotType          string   `json:"shot_type"`          // 镜头类型
	VisualDescription string   `json:"visual_description"` // 画面描述
	Narration         string   `json:"narration"`          // 旁白内容
	Subtitle          string   `json:"subtitle"`           // 字幕内容
	SoundEffects      []string `json:"sound_effects"`      // 音效
	Transition        string   `json:"transition"`         // 转场效果
	KeyElements       []string `json:"key_elements"`       // 关键元素
}

// VideoHooks 视频钩子点
type VideoHooks struct {
	Opening string `json:"opening"` // 开头吸引点
	Climax  string `json:"climax"`  // 高潮点
	Ending  string `json:"ending"`  // 结尾钩子
}

// VideoScriptTemplate 视频脚本模板
type VideoScriptTemplate struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Platform    string            `json:"platform"`
	Duration    int               `json:"duration"`
	Style       string            `json:"style"`
	SceneCount  int               `json:"scene_count"`
	Template    map[string]string `json:"template"`    // 模板内容
	Description string            `json:"description"` // 模板描述
	CreatedAt   time.Time         `json:"created_at"`
}

// VideoScriptAnalytics 视频脚本分析数据
type VideoScriptAnalytics struct {
	ScriptID       string    `json:"script_id"`
	ViewCount      int64     `json:"view_count"`      // 观看次数
	LikeCount      int64     `json:"like_count"`      // 点赞数
	ShareCount     int64     `json:"share_count"`     // 分享数
	CommentCount   int64     `json:"comment_count"`   // 评论数
	CompletionRate float64   `json:"completion_rate"` // 完播率
	EngagementRate float64   `json:"engagement_rate"` // 互动率
	Platform       string    `json:"platform"`        // 平台
	PublishedAt    time.Time `json:"published_at"`
	LastUpdatedAt  time.Time `json:"last_updated_at"`
}
