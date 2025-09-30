package biz

import (
	"context"
	"fmt"

	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
)

// VideoScriptRepo 短视频脚本数据仓库接口
type VideoScriptRepo interface {
	// SaveVideoScript 保存视频脚本
	SaveVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error)
	
	// GetVideoScript 获取视频脚本
	GetVideoScript(ctx context.Context, id string) (*models.VideoScript, error)
	
	// UpdateVideoScript 更新视频脚本
	UpdateVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error)
	
	// DeleteVideoScript 删除视频脚本
	DeleteVideoScript(ctx context.Context, id string) error
	
	// ListVideoScripts 获取视频脚本列表
	ListVideoScripts(ctx context.Context, projectID string, page, pageSize int) ([]*models.VideoScript, int, error)
	
	// ListVideoScriptsByChapter 根据章节获取视频脚本列表
	ListVideoScriptsByChapter(ctx context.Context, chapterID string) ([]*models.VideoScript, error)
}

// VideoScriptUseCase 短视频脚本业务用例
type VideoScriptUseCase struct {
	repo   VideoScriptRepo
	logger *log.Helper
}

// NewVideoScriptUseCase 创建短视频脚本业务用例
func NewVideoScriptUseCase(repo VideoScriptRepo, logger log.Logger) *VideoScriptUseCase {
	return &VideoScriptUseCase{
		repo:   repo,
		logger: log.NewHelper(logger),
	}
}

// SaveVideoScript 保存视频脚本
func (uc *VideoScriptUseCase) SaveVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error) {
	uc.logger.WithContext(ctx).Infof("Saving video script for project: %s", script.ProjectID)
	
	return uc.repo.SaveVideoScript(ctx, script)
}

// GetVideoScript 获取视频脚本
func (uc *VideoScriptUseCase) GetVideoScript(ctx context.Context, id string) (*models.VideoScript, error) {
	uc.logger.WithContext(ctx).Infof("Getting video script: %s", id)
	
	return uc.repo.GetVideoScript(ctx, id)
}

// UpdateVideoScript 更新视频脚本
func (uc *VideoScriptUseCase) UpdateVideoScript(ctx context.Context, script *models.VideoScript) (*models.VideoScript, error) {
	uc.logger.WithContext(ctx).Infof("Updating video script: %s", script.ID)
	
	return uc.repo.UpdateVideoScript(ctx, script)
}

// DeleteVideoScript 删除视频脚本
func (uc *VideoScriptUseCase) DeleteVideoScript(ctx context.Context, id string) error {
	uc.logger.WithContext(ctx).Infof("Deleting video script: %s", id)
	
	return uc.repo.DeleteVideoScript(ctx, id)
}

// ListVideoScripts 获取视频脚本列表
func (uc *VideoScriptUseCase) ListVideoScripts(ctx context.Context, projectID string, page, pageSize int) ([]*models.VideoScript, int, error) {
	uc.logger.WithContext(ctx).Infof("Listing video scripts for project: %s", projectID)
	
	return uc.repo.ListVideoScripts(ctx, projectID, page, pageSize)
}

// ListVideoScriptsByChapter 根据章节获取视频脚本列表
func (uc *VideoScriptUseCase) ListVideoScriptsByChapter(ctx context.Context, chapterID string) ([]*models.VideoScript, error) {
	uc.logger.WithContext(ctx).Infof("Listing video scripts for chapter: %s", chapterID)
	
	return uc.repo.ListVideoScriptsByChapter(ctx, chapterID)
}

// ValidateVideoScript 验证视频脚本
func (uc *VideoScriptUseCase) ValidateVideoScript(ctx context.Context, script *models.VideoScript) error {
	uc.logger.WithContext(ctx).Infof("Validating video script: %s", script.ID)
	
	// 基本验证
	if script.Title == "" {
		return ErrVideoScriptTitleRequired
	}
	
	if script.Duration <= 0 {
		return ErrVideoScriptDurationInvalid
	}
	
	if len(script.Scenes) == 0 {
		return ErrVideoScriptScenesRequired
	}
	
	// 验证场景
	totalDuration := 0
	for _, scene := range script.Scenes {
		if scene.Duration <= 0 {
			return ErrVideoScriptSceneDurationInvalid
		}
		totalDuration += scene.Duration
	}
	
	// 检查总时长是否匹配
	if totalDuration != script.Duration {
		uc.logger.WithContext(ctx).Warnf("Total scene duration (%d) doesn't match script duration (%d)", totalDuration, script.Duration)
	}
	
	return nil
}

// 错误定义
var (
	ErrVideoScriptNotFound            = fmt.Errorf("视频脚本不存在")
	ErrVideoScriptTitleRequired       = fmt.Errorf("视频脚本标题不能为空")
	ErrVideoScriptDurationInvalid     = fmt.Errorf("视频脚本时长无效")
	ErrVideoScriptScenesRequired      = fmt.Errorf("视频脚本必须包含场景")
	ErrVideoScriptSceneDurationInvalid = fmt.Errorf("场景时长无效")
)