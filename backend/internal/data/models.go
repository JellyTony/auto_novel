package data

import (
	"time"

	"gorm.io/gorm"
)

// NovelProject 小说项目数据库模型
type NovelProject struct {
	ID          string    `gorm:"primaryKey;size:255" json:"id"`
	Title       string    `gorm:"size:500;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Genre       string    `gorm:"size:100" json:"genre"`
	Status      string    `gorm:"size:50;default:'draft'" json:"status"`
	
	// 项目内容
	WorldView   string `gorm:"type:text" json:"world_view"`
	
	// 人物设定
	Characters  string `gorm:"type:text" json:"characters"`
	
	// 大纲
	Outline     string `gorm:"type:text" json:"outline"`
	
	// 项目配置
	Config      string `gorm:"type:text" json:"config"`
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName 指定表名
func (NovelProject) TableName() string {
	return "novel_projects"
}

// Chapter 章节数据库模型
type Chapter struct {
	ID        string    `gorm:"primaryKey;size:255" json:"id"`
	ProjectID string    `gorm:"size:255;not null" json:"project_id"`
	Title     string    `gorm:"size:500;not null" json:"title"`
	Content   string    `gorm:"type:text" json:"content"`
	Summary   string    `gorm:"type:text" json:"summary"`
	Order     int       `gorm:"not null;default:0" json:"order"`
	Status    string    `gorm:"size:50;default:'draft'" json:"status"`
	
	// 章节配置
	Config    string `gorm:"type:text" json:"config"`
	
	// 时间戳
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	
	// 关联关系
	Project   NovelProject `gorm:"foreignKey:ProjectID;references:ID" json:"-"`
}

// TableName 指定表名
func (Chapter) TableName() string {
	return "chapters"
}

// VideoScript 视频脚本数据库模型
type VideoScript struct {
	ID          string    `gorm:"primaryKey;size:255" json:"id"`
	ProjectID   string    `gorm:"size:255" json:"project_id"`
	ChapterID   string    `gorm:"size:255" json:"chapter_id"`
	Title       string    `gorm:"size:500;not null" json:"title"`
	Platform    string    `gorm:"size:50" json:"platform"`
	Duration    int       `gorm:"default:0" json:"duration"`
	Status      string    `gorm:"size:50;default:'draft'" json:"status"`
	Description string    `gorm:"type:text" json:"description"`
	
	// JSON 字段存储复杂数据
	Scenes      string `gorm:"type:text" json:"scenes"`      // 存储场景数据的JSON
	Hooks       string `gorm:"type:text" json:"hooks"`       // 存储钩子数据的JSON
	Hashtags    string `gorm:"type:text" json:"hashtags"`    // 存储标签数据的JSON
	
	// 时间戳
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	
	// 关联关系
	Project     NovelProject `gorm:"foreignKey:ProjectID;references:ID" json:"-"`
	Chapter     Chapter      `gorm:"foreignKey:ChapterID;references:ID" json:"-"`
}

// TableName 指定表名
func (VideoScript) TableName() string {
	return "video_scripts"
}

// CreateIndexes 创建复合索引
func (np *NovelProject) CreateIndexes(db *gorm.DB) error {
	// 检查并创建复合索引：状态+创建时间
	var count int64
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_novel_projects_status_created_at'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_novel_projects_status_created_at ON novel_projects(status, created_at)").Error; err != nil {
			return err
		}
	}
	
	// 检查并创建复合索引：类型+更新时间
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_novel_projects_genre_updated_at'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_novel_projects_genre_updated_at ON novel_projects(genre, updated_at)").Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateIndexes 创建复合索引
func (c *Chapter) CreateIndexes(db *gorm.DB) error {
	// 检查并创建复合索引：项目ID+顺序
	var count int64
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_chapters_project_id_order'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_chapters_project_id_order ON chapters(project_id, `order`)").Error; err != nil {
			return err
		}
	}
	
	// 检查并创建复合索引：状态+更新时间
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_chapters_status_updated_at'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_chapters_status_updated_at ON chapters(status, updated_at)").Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateIndexes 创建复合索引
func (vs *VideoScript) CreateIndexes(db *gorm.DB) error {
	// 检查并创建复合索引：项目ID+章节ID
	var count int64
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_video_scripts_project_chapter'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_video_scripts_project_chapter ON video_scripts(project_id, chapter_id)").Error; err != nil {
			return err
		}
	}
	
	// 检查并创建复合索引：平台+时长
	db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name='idx_video_scripts_platform_duration'").Scan(&count)
	if count == 0 {
		if err := db.Exec("CREATE INDEX idx_video_scripts_platform_duration ON video_scripts(platform, duration)").Error; err != nil {
			return err
		}
	}
	
	return nil
}