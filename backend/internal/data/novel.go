package data

import (
	"context"
	"fmt"
	"sync"
	"time"

	"backend/internal/biz"
	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
)

// novelRepo 小说数据仓库实现
type novelRepo struct {
	data   *Data
	log    *log.Helper
	
	// 内存存储（生产环境应使用数据库）
	projects map[string]*models.NovelProject
	chapters map[string]*models.Chapter
	mu       sync.RWMutex
}

// NewNovelRepo 创建小说数据仓库
func NewNovelRepo(data *Data, logger log.Logger) biz.NovelRepo {
	return &novelRepo{
		data:     data,
		log:      log.NewHelper(logger),
		projects: make(map[string]*models.NovelProject),
		chapters: make(map[string]*models.Chapter),
	}
}

// CreateProject 创建项目
func (r *novelRepo) CreateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Creating project: %s", project.ID)
	
	// 检查项目是否已存在
	if _, exists := r.projects[project.ID]; exists {
		return nil, fmt.Errorf("project with ID %s already exists", project.ID)
	}
	
	// 设置时间戳
	now := time.Now()
	project.CreatedAt = now
	project.UpdatedAt = now
	
	// 存储项目
	r.projects[project.ID] = project
	
	return project, nil
}

// UpdateProject 更新项目
func (r *novelRepo) UpdateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Updating project: %s", project.ID)
	
	// 检查项目是否存在
	if _, exists := r.projects[project.ID]; !exists {
		return nil, fmt.Errorf("project with ID %s not found", project.ID)
	}
	
	// 更新时间戳
	project.UpdatedAt = time.Now()
	
	// 更新项目
	r.projects[project.ID] = project
	
	return project, nil
}

// GetProject 获取项目
func (r *novelRepo) GetProject(ctx context.Context, projectID string) (*models.NovelProject, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	r.log.WithContext(ctx).Infof("Getting project: %s", projectID)
	
	project, exists := r.projects[projectID]
	if !exists {
		return nil, fmt.Errorf("project with ID %s not found", projectID)
	}
	
	return project, nil
}

// ListProjects 列出项目
func (r *novelRepo) ListProjects(ctx context.Context, page, pageSize int) ([]*models.NovelProject, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	r.log.WithContext(ctx).Infof("Listing projects: page=%d, pageSize=%d", page, pageSize)
	
	// 转换为切片
	projects := make([]*models.NovelProject, 0, len(r.projects))
	for _, project := range r.projects {
		projects = append(projects, project)
	}
	
	total := len(projects)
	
	// 分页处理
	start := (page - 1) * pageSize
	if start >= total {
		return []*models.NovelProject{}, total, nil
	}
	
	end := start + pageSize
	if end > total {
		end = total
	}
	
	return projects[start:end], total, nil
}

// DeleteProject 删除项目
func (r *novelRepo) DeleteProject(ctx context.Context, projectID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Deleting project: %s", projectID)
	
	// 检查项目是否存在
	if _, exists := r.projects[projectID]; !exists {
		return fmt.Errorf("project with ID %s not found", projectID)
	}
	
	// 删除项目相关的章节
	for chapterID, chapter := range r.chapters {
		if chapter.ProjectID == projectID {
			delete(r.chapters, chapterID)
		}
	}
	
	// 删除项目
	delete(r.projects, projectID)
	
	return nil
}

// SaveChapter 保存章节
func (r *novelRepo) SaveChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Saving chapter: %s", chapter.ID)
	
	// 设置时间戳
	now := time.Now()
	if chapter.CreatedAt.IsZero() {
		chapter.CreatedAt = now
	}
	chapter.UpdatedAt = now
	
	// 存储章节
	r.chapters[chapter.ID] = chapter
	
	return chapter, nil
}

// UpdateChapter 更新章节
func (r *novelRepo) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Updating chapter: %s", chapter.ID)
	
	// 检查章节是否存在
	if _, exists := r.chapters[chapter.ID]; !exists {
		return nil, fmt.Errorf("chapter with ID %s not found", chapter.ID)
	}
	
	// 更新时间戳
	chapter.UpdatedAt = time.Now()
	
	// 更新章节
	r.chapters[chapter.ID] = chapter
	
	return chapter, nil
}

// GetChapter 获取章节
func (r *novelRepo) GetChapter(ctx context.Context, chapterID string) (*models.Chapter, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	r.log.WithContext(ctx).Infof("Getting chapter: %s", chapterID)
	
	chapter, exists := r.chapters[chapterID]
	if !exists {
		return nil, fmt.Errorf("chapter with ID %s not found", chapterID)
	}
	
	return chapter, nil
}

// ListChapters 列出章节
func (r *novelRepo) ListChapters(ctx context.Context, projectID string) ([]*models.Chapter, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	
	r.log.WithContext(ctx).Infof("Listing chapters for project: %s", projectID)
	
	chapters := make([]*models.Chapter, 0)
	for _, chapter := range r.chapters {
		if chapter.ProjectID == projectID {
			chapters = append(chapters, chapter)
		}
	}
	
	return chapters, nil
}

// DeleteChapter 删除章节
func (r *novelRepo) DeleteChapter(ctx context.Context, chapterID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	
	r.log.WithContext(ctx).Infof("Deleting chapter: %s", chapterID)
	
	// 检查章节是否存在
	if _, exists := r.chapters[chapterID]; !exists {
		return fmt.Errorf("chapter with ID %s not found", chapterID)
	}
	
	// 删除章节
	delete(r.chapters, chapterID)
	
	return nil
}