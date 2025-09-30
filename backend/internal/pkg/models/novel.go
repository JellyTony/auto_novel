package models

import (
	"time"
)

// NovelProject 小说项目
type NovelProject struct {
	ID             string       `json:"id"`                   // 项目ID
	Title          string       `json:"title"`                // 项目标题
	Description    string       `json:"description"`          // 项目描述
	Genre          string       `json:"genre"`                // 体裁：现代都市/悬疑/玄幻/科幻/古代言情
	TargetAudience string       `json:"target_audience"`      // 目标读者：青年/女性向/男性向/泛读者
	Tone           string       `json:"tone"`                 // 调性：温情/冷峻/快节奏/慢热
	Themes         []string     `json:"themes"`               // 主题
	Status         string       `json:"status"`               // 状态：draft/generating/completed
	CreatedAt      time.Time    `json:"created_at"`           // 创建时间
	UpdatedAt      time.Time    `json:"updated_at"`           // 更新时间
	WorldView      *WorldView   `json:"world_view,omitempty"` // 世界观设定
	Characters     []*Character `json:"characters,omitempty"` // 人物卡
	Outline        *Outline     `json:"outline,omitempty"`    // 章节大纲
	Chapters       []*Chapter   `json:"chapters,omitempty"`   // 章节
}

// WorldView 世界观设定
type WorldView struct {
	ID           string    `json:"id"`            // 世界观设定ID
	ProjectID    string    `json:"project_id"`    // 项目ID
	Title        string    `json:"title"`         // 世界观设定标题
	Synopsis     string    `json:"synopsis"`      // 200字以内简介
	Setting      string    `json:"setting"`       // 时代与地点
	KeyRules     []string  `json:"key_rules"`     // 基本规则/设定
	ToneExamples []string  `json:"tone_examples"` // 风格示例片段
	Themes       []string  `json:"themes"`        // 关键主题
	CreatedAt    time.Time `json:"created_at"`    // 创建时间
}

// Character 人物卡
type Character struct {
	ID              string            `json:"id"`               // 人物卡ID
	ProjectID       string            `json:"project_id"`       // 项目ID
	Name            string            `json:"name"`             // 人物姓名
	Role            string            `json:"role"`             // 男主/女主/配角
	Age             int               `json:"age"`              // 人物年龄
	Appearance      string            `json:"appearance"`       // 外貌描述
	Background      string            `json:"background"`       // 背景故事
	Motivation      string            `json:"motivation"`       // 动机
	Flaws           []string          `json:"flaws"`            // 缺点
	SpeechTone      string            `json:"speech_tone"`      // 说话风格
	Secrets         []string          `json:"secrets"`          // 秘密
	RelationshipMap map[string]string `json:"relationship_map"` // 人物关系
	CreatedAt       time.Time         `json:"created_at"`       // 创建时间
}

// Outline 章节大纲
type Outline struct {
	ID        string            `json:"id"`         // 章节大纲ID
	ProjectID string            `json:"project_id"` // 项目ID
	Chapters  []*ChapterOutline `json:"chapters"`   // 章节大纲
	CreatedAt time.Time         `json:"created_at"` // 创建时间
}

// ChapterOutline 章节大纲
type ChapterOutline struct {
	Index          int      `json:"index"`           // 章节索引
	Title          string   `json:"title"`           // 章节标题
	Summary        string   `json:"summary"`         // 1-3句概要
	Goal           string   `json:"goal"`            // 剧情目标
	TwistHint      string   `json:"twist_hint"`      // 小冲突/反转点
	ImportantItems []string `json:"important_items"` // 关键道具/线索
}

// Chapter 章节内容
type Chapter struct {
	ID              string    `json:"id"`               // 章节ID
	ProjectID       string    `json:"project_id"`       // 项目ID
	Index           int       `json:"index"`            // 章节索引
	Title           string    `json:"title"`            // 章节标题
	RawContent      string    `json:"raw_content"`      // 原始生成内容
	PolishedContent string    `json:"polished_content"` // 润色后内容
	Summary         string    `json:"summary"`          // 章节摘要
	WordCount       int       `json:"word_count"`       // 章节字数
	Status          string    `json:"status"`           // draft/polished/completed
	CreatedAt       time.Time `json:"created_at"`       // 创建时间
	UpdatedAt       time.Time `json:"updated_at"`       // 更新时间
}

// GenerationContext 生成上下文
type GenerationContext struct {
	ProjectID       string           `json:"project_id"`       // 项目ID
	WorldView       *WorldView       `json:"world_view"`       // 世界观设定
	Characters      []*Character     `json:"characters"`       // 人物卡
	PreviousSummary string           `json:"previous_summary"` // 前情摘要
	ChapterGoal     string           `json:"chapter_goal"`     // 本章目标
	StyleExamples   []string         `json:"style_examples"`   // 风格示例
	Timeline        []*TimelineEvent `json:"timeline"`         // 时间线
	Props           []*PropItem      `json:"props"`            // 道具
}

// TimelineEvent 时间线事件
type TimelineEvent struct {
	Timestamp   string `json:"timestamp"`   // 时间戳
	Event       string `json:"event"`       // 事件名称
	Description string `json:"description"` // 事件描述
}

// PropItem 道具物品
type PropItem struct {
	Name        string `json:"name"`        // 道具名称
	Description string `json:"description"` // 道具描述
	Location    string `json:"location"`    // 当前位置
}

// CritiqueResult 质量审查结果
type CritiqueResult struct {
	LogicalIssues   []string `json:"logical_issues"`   // 逻辑矛盾
	CharacterIssues []string `json:"character_issues"` // 人物不一致
	PacingIssues    []string `json:"pacing_issues"`    // 节奏问题
	Improvements    []string `json:"improvements"`     // 改进建议
	FixedExample    string   `json:"fixed_example"`    // 修订示例
	OverallScore    int      `json:"overall_score"`    // 总体评分 1-10
}

// ExportOptions 导出选项
type ExportOptions struct {
	IncludeMetadata bool   `json:"include_metadata"` // 包含元数据
	IncludeOutline  bool   `json:"include_outline"`  // 包含大纲
	FontFamily      string `json:"font_family"`      // 字体
	FontSize        int    `json:"font_size"`        // 字号
}

// ExportResult 导出结果
type ExportResult struct {
	DownloadURL string `json:"download_url"` // 下载链接
	FileName    string `json:"file_name"`    // 文件名
	FileSize    int64  `json:"file_size"`    // 文件大小
}

// VideoScriptOptions 视频脚本选项
type VideoScriptOptions struct {
	ScenesPerChapter int    `json:"scenes_per_chapter"` // 每章分镜数
	Platform         string `json:"platform"`           // 平台：tiktok/youtube/bilibili
	VoiceType        string `json:"voice_type"`         // 语音类型：auto/male/female
}

// VideoScene 视频分镜
type VideoScene struct {
	ScreenIndex       int    `json:"screen_index"`        // 分镜序号
	Text              string `json:"text"`                // 文本内容
	SuggestedBGMTag   string `json:"suggested_bgm_tag"`   // 建议BGM标签
	SuggestedImageTag string `json:"suggested_image_tag"` // 建议图片标签
	TTSVoice          string `json:"tts_voice"`           // TTS语音
	Notes             string `json:"notes"`               // 备注
}
