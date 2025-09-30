package biz

import (
	"context"
	"fmt"
	"time"

	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
)

// NovelRepo 小说数据仓库接口
type NovelRepo interface {
	// 项目管理
	CreateProject(context.Context, *models.NovelProject) (*models.NovelProject, error)
	UpdateProject(context.Context, *models.NovelProject) (*models.NovelProject, error)
	GetProject(context.Context, string) (*models.NovelProject, error)
	ListProjects(context.Context, int, int) ([]*models.NovelProject, int, error)
	DeleteProject(context.Context, string) error

	// 章节管理
	SaveChapter(context.Context, *models.Chapter) (*models.Chapter, error)
	UpdateChapter(context.Context, *models.Chapter) (*models.Chapter, error)
	GetChapter(context.Context, string) (*models.Chapter, error)
	ListChapters(context.Context, string) ([]*models.Chapter, error)
	DeleteChapter(context.Context, string) error
}

// ExportService 导出服务接口
type ExportService interface {
	ExportNovel(context.Context, *models.NovelProject, string, *models.ExportOptions) (*models.ExportResult, error)
}

// VideoScriptService 视频脚本服务接口
type VideoScriptService interface {
	GenerateVideoScript(context.Context, []*models.Chapter, *models.VideoScriptOptions) ([]*models.VideoScene, error)
}

// NovelUsecase 小说业务用例
type NovelUsecase struct {
	repo              NovelRepo
	exportService     ExportService
	videoScriptService VideoScriptService
	log               *log.Helper
}

// NewNovelUsecase 创建小说业务用例
func NewNovelUsecase(
	repo NovelRepo,
	exportService ExportService,
	videoScriptService VideoScriptService,
	logger log.Logger,
) *NovelUsecase {
	return &NovelUsecase{
		repo:               repo,
		exportService:      exportService,
		videoScriptService: videoScriptService,
		log:                log.NewHelper(logger),
	}
}

// CreateProject 创建项目
func (uc *NovelUsecase) CreateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	uc.log.WithContext(ctx).Infof("Creating novel project: %s", project.Title)

	// 生成项目ID
	if project.ID == "" {
		project.ID = generateProjectID()
	}

	// 设置默认状态
	if project.Status == "" {
		project.Status = "draft"
	}

	return uc.repo.CreateProject(ctx, project)
}

// UpdateProject 更新项目
func (uc *NovelUsecase) UpdateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	uc.log.WithContext(ctx).Infof("Updating novel project: %s", project.ID)

	// 更新时间
	project.UpdatedAt = time.Now()

	return uc.repo.UpdateProject(ctx, project)
}

// GetProject 获取项目
func (uc *NovelUsecase) GetProject(ctx context.Context, projectID string) (*models.NovelProject, error) {
	uc.log.WithContext(ctx).Infof("Getting novel project: %s", projectID)

	project, err := uc.repo.GetProject(ctx, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	// 加载章节列表
	chapters, err := uc.repo.ListChapters(ctx, projectID)
	if err != nil {
		uc.log.WithContext(ctx).Warnf("Failed to load chapters for project %s: %v", projectID, err)
	} else {
		project.Chapters = chapters
	}

	return project, nil
}

// ListProjects 列出项目
func (uc *NovelUsecase) ListProjects(ctx context.Context, page, pageSize int) ([]*models.NovelProject, int, error) {
	uc.log.WithContext(ctx).Infof("Listing novel projects: page=%d, pageSize=%d", page, pageSize)

	return uc.repo.ListProjects(ctx, page, pageSize)
}

// DeleteProject 删除项目
func (uc *NovelUsecase) DeleteProject(ctx context.Context, projectID string) error {
	uc.log.WithContext(ctx).Infof("Deleting novel project: %s", projectID)

	// 删除所有章节
	chapters, err := uc.repo.ListChapters(ctx, projectID)
	if err != nil {
		return fmt.Errorf("failed to list chapters: %w", err)
	}

	for _, chapter := range chapters {
		if err := uc.repo.DeleteChapter(ctx, chapter.ID); err != nil {
			uc.log.WithContext(ctx).Warnf("Failed to delete chapter %s: %v", chapter.ID, err)
		}
	}

	// 删除项目
	return uc.repo.DeleteProject(ctx, projectID)
}

// SaveChapter 保存章节
func (uc *NovelUsecase) SaveChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	uc.log.WithContext(ctx).Infof("Saving chapter: %s", chapter.Title)

	// 生成章节ID
	if chapter.ID == "" {
		chapter.ID = generateChapterID()
	}

	// 设置创建时间
	now := time.Now()
	chapter.CreatedAt = now
	chapter.UpdatedAt = now

	// 设置默认状态
	if chapter.Status == "" {
		chapter.Status = "draft"
	}

	return uc.repo.SaveChapter(ctx, chapter)
}

// UpdateChapter 更新章节
func (uc *NovelUsecase) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	uc.log.WithContext(ctx).Infof("Updating chapter: %s", chapter.ID)

	// 更新时间
	chapter.UpdatedAt = time.Now()

	return uc.repo.UpdateChapter(ctx, chapter)
}

// GetChapter 获取章节
func (uc *NovelUsecase) GetChapter(ctx context.Context, chapterID string) (*models.Chapter, error) {
	uc.log.WithContext(ctx).Infof("Getting chapter: %s", chapterID)

	return uc.repo.GetChapter(ctx, chapterID)
}

// ListChapters 列出章节
func (uc *NovelUsecase) ListChapters(ctx context.Context, projectID string) ([]*models.Chapter, error) {
	uc.log.WithContext(ctx).Infof("Listing chapters for project: %s", projectID)

	return uc.repo.ListChapters(ctx, projectID)
}

// DeleteChapter 删除章节
func (uc *NovelUsecase) DeleteChapter(ctx context.Context, chapterID string) error {
	uc.log.WithContext(ctx).Infof("Deleting chapter: %s", chapterID)

	return uc.repo.DeleteChapter(ctx, chapterID)
}

// ExportNovel 导出小说
func (uc *NovelUsecase) ExportNovel(ctx context.Context, project *models.NovelProject, format string, options *models.ExportOptions) (*models.ExportResult, error) {
	uc.log.WithContext(ctx).Infof("Exporting novel: %s, format: %s", project.ID, format)

	if uc.exportService == nil {
		return nil, fmt.Errorf("export service not available")
	}

	return uc.exportService.ExportNovel(ctx, project, format, options)
}

// GenerateVideoScript 生成视频脚本
func (uc *NovelUsecase) GenerateVideoScript(ctx context.Context, chapters []*models.Chapter, options *models.VideoScriptOptions) ([]*models.VideoScene, error) {
	uc.log.WithContext(ctx).Infof("Generating video script for %d chapters", len(chapters))

	if uc.videoScriptService == nil {
		return nil, fmt.Errorf("video script service not available")
	}

	return uc.videoScriptService.GenerateVideoScript(ctx, chapters, options)
}

// 辅助函数
func generateProjectID() string {
	return fmt.Sprintf("proj_%d", time.Now().UnixNano())
}

func generateChapterID() string {
	return fmt.Sprintf("chap_%d", time.Now().UnixNano())
}