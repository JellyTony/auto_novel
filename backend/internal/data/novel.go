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

// novelRepo 小说数据仓库实现
type novelRepo struct {
	data *Data
	log  *log.Helper
}

// NewNovelRepo 创建小说数据仓库
func NewNovelRepo(data *Data, logger log.Logger) biz.NovelRepo {
	return &novelRepo{
		data: data,
		log:  log.NewHelper(logger),
	}
}

// modelToEntity 将数据库模型转换为业务实体
func (r *novelRepo) modelToEntity(dbProject *NovelProject) (*models.NovelProject, error) {
	project := &models.NovelProject{
		ID:             dbProject.ID,
		Title:          dbProject.Title,
		Description:    dbProject.Description,
		Genre:          dbProject.Genre,
		TargetAudience: dbProject.TargetAudience,
		Tone:           dbProject.Tone,
		Status:         dbProject.Status,
		CreatedAt:      dbProject.CreatedAt,
		UpdatedAt:      dbProject.UpdatedAt,
	}

	// 解析主题数组
	if dbProject.Themes != "" {
		var themes []string
		if err := json.Unmarshal([]byte(dbProject.Themes), &themes); err == nil {
			project.Themes = themes
		}
	}

	// 解析世界观设定
	if dbProject.WorldView != "" {
		var worldView models.WorldView
		if err := json.Unmarshal([]byte(dbProject.WorldView), &worldView); err == nil {
			project.WorldView = &worldView
		}
	}

	// 解析人物设定
	if dbProject.Characters != "" {
		var characters []*models.Character
		if err := json.Unmarshal([]byte(dbProject.Characters), &characters); err == nil {
			project.Characters = characters
		}
	}

	// 解析大纲
	if dbProject.Outline != "" {
		var outline models.Outline
		if err := json.Unmarshal([]byte(dbProject.Outline), &outline); err == nil {
			project.Outline = &outline
		}
	}

	return project, nil
}

// entityToModel 将业务实体转换为数据库模型
func (r *novelRepo) entityToModel(project *models.NovelProject) (*NovelProject, error) {
	dbProject := &NovelProject{
		ID:             project.ID,
		Title:          project.Title,
		Description:    project.Description,
		Genre:          project.Genre,
		TargetAudience: project.TargetAudience,
		Tone:           project.Tone,
		Status:         project.Status,
		CreatedAt:      project.CreatedAt,
		UpdatedAt:      project.UpdatedAt,
	}

	// 序列化主题数组
	if project.Themes != nil {
		if data, err := json.Marshal(project.Themes); err == nil {
			dbProject.Themes = string(data)
		}
	}

	// 序列化世界观设定
	if project.WorldView != nil {
		if data, err := json.Marshal(project.WorldView); err == nil {
			dbProject.WorldView = string(data)
		}
	}

	// 序列化人物设定
	if project.Characters != nil {
		if data, err := json.Marshal(project.Characters); err == nil {
			dbProject.Characters = string(data)
		}
	}

	// 序列化大纲
	if project.Outline != nil {
		if data, err := json.Marshal(project.Outline); err == nil {
			dbProject.Outline = string(data)
		}
	}

	return dbProject, nil
}

// chapterModelToEntity 将章节数据库模型转换为业务实体
func (r *novelRepo) chapterModelToEntity(dbChapter *Chapter) (*models.Chapter, error) {
	return &models.Chapter{
		ID:              dbChapter.ID,
		ProjectID:       dbChapter.ProjectID,
		Index:           dbChapter.Order,
		Title:           dbChapter.Title,
		RawContent:      dbChapter.Content,
		PolishedContent: dbChapter.Content,
		Summary:         dbChapter.Summary,
		Status:          dbChapter.Status,
		CreatedAt:       dbChapter.CreatedAt,
		UpdatedAt:       dbChapter.UpdatedAt,
	}, nil
}

// chapterEntityToModel 将章节业务实体转换为数据库模型
func (r *novelRepo) chapterEntityToModel(chapter *models.Chapter) (*Chapter, error) {
	return &Chapter{
		ID:        chapter.ID,
		ProjectID: chapter.ProjectID,
		Title:     chapter.Title,
		Content:   chapter.RawContent,
		Summary:   chapter.Summary,
		Order:     chapter.Index,
		Status:    chapter.Status,
		CreatedAt: chapter.CreatedAt,
		UpdatedAt: chapter.UpdatedAt,
	}, nil
}

// CreateProject 创建项目
func (r *novelRepo) CreateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	r.log.WithContext(ctx).Infof("Creating project: %s", project.ID)

	dbProject, err := r.entityToModel(project)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 设置时间戳
	now := time.Now()
	dbProject.CreatedAt = now
	dbProject.UpdatedAt = now

	if err := r.data.db.WithContext(ctx).Create(dbProject).Error; err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	return r.modelToEntity(dbProject)
}

// UpdateProject 更新项目
func (r *novelRepo) UpdateProject(ctx context.Context, project *models.NovelProject) (*models.NovelProject, error) {
	r.log.WithContext(ctx).Infof("Updating project: %s", project.ID)

	dbProject, err := r.entityToModel(project)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 更新时间戳
	dbProject.UpdatedAt = time.Now()

	if err := r.data.db.WithContext(ctx).Where("id = ?", project.ID).Updates(dbProject).Error; err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return r.modelToEntity(dbProject)
}

// GetProject 获取项目
func (r *novelRepo) GetProject(ctx context.Context, projectID string) (*models.NovelProject, error) {
	r.log.WithContext(ctx).Infof("Getting project: %s", projectID)

	var dbProject NovelProject
	if err := r.data.db.WithContext(ctx).Where("id = ?", projectID).First(&dbProject).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("project with ID %s not found", projectID)
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}

	return r.modelToEntity(&dbProject)
}

// ListProjects 列出项目
func (r *novelRepo) ListProjects(ctx context.Context, page, pageSize int) ([]*models.NovelProject, int, error) {
	r.log.WithContext(ctx).Infof("Listing projects: page=%d, pageSize=%d", page, pageSize)

	var dbProjects []NovelProject
	var total int64

	// 获取总数
	if err := r.data.db.WithContext(ctx).Model(&NovelProject{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count projects: %w", err)
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.data.db.WithContext(ctx).Offset(offset).Limit(pageSize).Find(&dbProjects).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list projects: %w", err)
	}

	// 转换为业务实体
	projects := make([]*models.NovelProject, 0, len(dbProjects))
	for _, dbProject := range dbProjects {
		project, err := r.modelToEntity(&dbProject)
		if err != nil {
			r.log.Errorf("failed to convert project %s: %v", dbProject.ID, err)
			continue
		}
		projects = append(projects, project)
	}

	return projects, int(total), nil
}

// DeleteProject 删除项目
func (r *novelRepo) DeleteProject(ctx context.Context, projectID string) error {
	r.log.WithContext(ctx).Infof("Deleting project: %s", projectID)

	return r.data.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 删除项目相关的章节
		if err := tx.Where("project_id = ?", projectID).Delete(&Chapter{}).Error; err != nil {
			return fmt.Errorf("failed to delete chapters: %w", err)
		}

		// 删除项目
		if err := tx.Where("id = ?", projectID).Delete(&NovelProject{}).Error; err != nil {
			return fmt.Errorf("failed to delete project: %w", err)
		}

		return nil
	})
}

// SaveChapter 保存章节
func (r *novelRepo) SaveChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	r.log.WithContext(ctx).Infof("Saving chapter: %s", chapter.ID)

	dbChapter, err := r.chapterEntityToModel(chapter)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 设置时间戳
	now := time.Now()
	if dbChapter.CreatedAt.IsZero() {
		dbChapter.CreatedAt = now
	}
	dbChapter.UpdatedAt = now

	if err := r.data.db.WithContext(ctx).Create(dbChapter).Error; err != nil {
		return nil, fmt.Errorf("failed to save chapter: %w", err)
	}

	return r.chapterModelToEntity(dbChapter)
}

// UpdateChapter 更新章节
func (r *novelRepo) UpdateChapter(ctx context.Context, chapter *models.Chapter) (*models.Chapter, error) {
	r.log.WithContext(ctx).Infof("Updating chapter: %s", chapter.ID)

	dbChapter, err := r.chapterEntityToModel(chapter)
	if err != nil {
		return nil, fmt.Errorf("failed to convert entity to model: %w", err)
	}

	// 更新时间戳
	dbChapter.UpdatedAt = time.Now()

	if err := r.data.db.WithContext(ctx).Where("id = ?", chapter.ID).Updates(dbChapter).Error; err != nil {
		return nil, fmt.Errorf("failed to update chapter: %w", err)
	}

	return r.chapterModelToEntity(dbChapter)
}

// GetChapter 获取章节
func (r *novelRepo) GetChapter(ctx context.Context, chapterID string) (*models.Chapter, error) {
	r.log.WithContext(ctx).Infof("Getting chapter: %s", chapterID)

	var dbChapter Chapter
	if err := r.data.db.WithContext(ctx).Where("id = ?", chapterID).First(&dbChapter).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("chapter with ID %s not found", chapterID)
		}
		return nil, fmt.Errorf("failed to get chapter: %w", err)
	}

	return r.chapterModelToEntity(&dbChapter)
}

// ListChapters 列出章节
func (r *novelRepo) ListChapters(ctx context.Context, projectID string) ([]*models.Chapter, error) {
	r.log.WithContext(ctx).Infof("Listing chapters for project: %s", projectID)

	var dbChapters []Chapter
	if err := r.data.db.WithContext(ctx).Where("project_id = ?", projectID).Order("`order` ASC").Find(&dbChapters).Error; err != nil {
		return nil, fmt.Errorf("failed to list chapters: %w", err)
	}

	// 转换为业务实体
	chapters := make([]*models.Chapter, 0, len(dbChapters))
	for _, dbChapter := range dbChapters {
		chapter, err := r.chapterModelToEntity(&dbChapter)
		if err != nil {
			r.log.Errorf("failed to convert chapter %s: %v", dbChapter.ID, err)
			continue
		}
		chapters = append(chapters, chapter)
	}

	return chapters, nil
}

// DeleteChapter 删除章节
func (r *novelRepo) DeleteChapter(ctx context.Context, chapterID string) error {
	r.log.WithContext(ctx).Infof("Deleting chapter: %s", chapterID)

	if err := r.data.db.WithContext(ctx).Where("id = ?", chapterID).Delete(&Chapter{}).Error; err != nil {
		return fmt.Errorf("failed to delete chapter: %w", err)
	}

	return nil
}