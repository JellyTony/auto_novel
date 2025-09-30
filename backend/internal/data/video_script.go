package data

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"backend/internal/biz"
	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
	"gorm.io/gorm"
)

type videoScriptRepo struct {
	data *Data
	log  *log.Helper
}

// NewVideoScriptRepo 创建视频脚本仓库
func NewVideoScriptRepo(data *Data, logger log.Logger) biz.VideoScriptRepo {
	return &videoScriptRepo{
		data: data,
		log:  log.NewHelper(logger),
	}
}

// modelToEntity 将数据库模型转换为业务实体
func (r *videoScriptRepo) modelToEntity(dbScript *VideoScript) (*models.VideoScript, error) {
	script := &models.VideoScript{
		ID:          dbScript.ID,
		ProjectID:   dbScript.ProjectID,
		ChapterID:   dbScript.ChapterID,
		Title:       dbScript.Title,
		Duration:    dbScript.Duration,
		Platform:    dbScript.Platform,
		Status:      dbScript.Status,
		Description: dbScript.Description,
		CreatedAt:   dbScript.CreatedAt,
		UpdatedAt:   dbScript.UpdatedAt,
	}

	// 解析场景信息
	if dbScript.Scenes != "" {
		var scenes []*models.VideoScriptScene
		if err := json.Unmarshal([]byte(dbScript.Scenes), &scenes); err == nil {
			script.Scenes = scenes
		}
	}

	// 解析钩子信息
	if dbScript.Hooks != "" {
		var hooks *models.VideoHooks
		if err := json.Unmarshal([]byte(dbScript.Hooks), &hooks); err == nil {
			script.Hooks = hooks
		}
	}

	// 解析标签信息
	if dbScript.Hashtags != "" {
		var hashtags []string
		if err := json.Unmarshal([]byte(dbScript.Hashtags), &hashtags); err == nil {
			script.Hashtags = hashtags
		}
	}

	return script, nil
}

// entityToModel 将业务实体转换为数据库模型
func (r *videoScriptRepo) entityToModel(script *models.VideoScript) (*VideoScript, error) {
	dbScript := &VideoScript{
		ID:          script.ID,
		ProjectID:   script.ProjectID,
		ChapterID:   script.ChapterID,
		Title:       script.Title,
		Duration:    script.Duration,
		Platform:    script.Platform,
		Status:      script.Status,
		Description: script.Description,
		CreatedAt:   script.CreatedAt,
		UpdatedAt:   script.UpdatedAt,
	}

	// 序列化场景信息
	if script.Scenes != nil {
		if data, err := json.Marshal(script.Scenes); err == nil {
			dbScript.Scenes = string(data)
		}
	}

	// 序列化钩子信息
	if script.Hooks != nil {
		if data, err := json.Marshal(script.Hooks); err == nil {
			dbScript.Hooks = string(data)
		}
	}

	// 序列化标签信息
	if script.Hashtags != nil {
		if data, err := json.Marshal(script.Hashtags); err == nil {
			dbScript.Hashtags = string(data)
		}
	}

	return dbScript, nil
}

// SaveVideoScript 保存视频脚本
func (r *videoScriptRepo) SaveVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error) {
	r.log.WithContext(ctx).Infof("Saving video script: %s", script.Title)

	dbScript, err := r.entityToModel(script)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 设置时间戳
	now := time.Now()
	if dbScript.CreatedAt.IsZero() {
		dbScript.CreatedAt = now
	}
	dbScript.UpdatedAt = now

	// 如果没有ID，生成一个
	if dbScript.ID == "" {
		dbScript.ID = fmt.Sprintf("script-%d", now.Unix())
	}

	if err := r.data.db.WithContext(ctx).Create(dbScript).Error; err != nil {
		return nil, fmt.Errorf("failed to save video script: %w", err)
	}

	return r.modelToEntity(dbScript)
}

// UpdateVideoScript 更新视频脚本
func (r *videoScriptRepo) UpdateVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error) {
	r.log.WithContext(ctx).Infof("Updating video script: %s", script.ID)

	dbScript, err := r.entityToModel(script)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 更新时间戳
	dbScript.UpdatedAt = time.Now()

	if err := r.data.db.WithContext(ctx).Where("id = ?", script.ID).Updates(dbScript).Error; err != nil {
		return nil, fmt.Errorf("failed to update video script: %w", err)
	}

	return r.modelToEntity(dbScript)
}

// GetVideoScript 根据ID查找视频脚本
func (r *videoScriptRepo) GetVideoScript(ctx context.Context, id string) (*models.VideoScript, error) {
	r.log.WithContext(ctx).Infof("Finding video script by ID: %s", id)

	var dbScript VideoScript
	if err := r.data.db.WithContext(ctx).Where("id = ?", id).First(&dbScript).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("video script with ID %s not found", id)
		}
		return nil, fmt.Errorf("failed to get video script: %w", err)
	}

	return r.modelToEntity(&dbScript)
}

// ListVideoScripts 根据项目ID查找视频脚本列表
func (r *videoScriptRepo) ListVideoScripts(ctx context.Context, projectID string, page, pageSize int) ([]*models.VideoScript, int, error) {
	r.log.WithContext(ctx).Infof("Finding video scripts by project ID: %s", projectID)

	var dbScripts []VideoScript
	var total int64

	// 获取总数
	query := r.data.db.WithContext(ctx).Model(&VideoScript{})
	if projectID != "" {
		query = query.Where("project_id = ?", projectID)
	}
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count video scripts: %w", err)
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&dbScripts).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list video scripts: %w", err)
	}

	// 转换为业务实体
	scripts := make([]*models.VideoScript, 0, len(dbScripts))
	for _, dbScript := range dbScripts {
		script, err := r.modelToEntity(&dbScript)
		if err != nil {
			r.log.Errorf("failed to convert video script %s: %v", dbScript.ID, err)
			continue
		}
		scripts = append(scripts, script)
	}

	return scripts, int(total), nil
}

// ListVideoScriptsByChapter 根据章节获取视频脚本列表
func (r *videoScriptRepo) ListVideoScriptsByChapter(ctx context.Context, chapterID string) ([]*models.VideoScript, error) {
	r.log.WithContext(ctx).Infof("Finding video scripts by chapter ID: %s", chapterID)

	var dbScripts []VideoScript
	if err := r.data.db.WithContext(ctx).Where("chapter_id = ?", chapterID).Order("created_at DESC").Find(&dbScripts).Error; err != nil {
		return nil, fmt.Errorf("failed to list video scripts by chapter: %w", err)
	}

	// 转换为业务实体
	scripts := make([]*models.VideoScript, 0, len(dbScripts))
	for _, dbScript := range dbScripts {
		script, err := r.modelToEntity(&dbScript)
		if err != nil {
			r.log.Errorf("failed to convert video script %s: %v", dbScript.ID, err)
			continue
		}
		scripts = append(scripts, script)
	}

	return scripts, nil
}

// DeleteVideoScript 删除视频脚本
func (r *videoScriptRepo) DeleteVideoScript(ctx context.Context, id string) error {
	r.log.WithContext(ctx).Infof("Deleting video script: %s", id)

	if err := r.data.db.WithContext(ctx).Where("id = ?", id).Delete(&VideoScript{}).Error; err != nil {
		return fmt.Errorf("failed to delete video script: %w", err)
	}

	return nil
}