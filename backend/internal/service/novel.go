package service

import (
	"context"
	"fmt"
	"time"

	pb "backend/api/novel/v1"
	"backend/internal/agent/chapter"
	"backend/internal/agent/character"
	"backend/internal/agent/consistency"
	"backend/internal/agent/orchestrator"
	"backend/internal/agent/outline"
	"backend/internal/agent/polish"
	"backend/internal/agent/quality"
	"backend/internal/agent/worldbuilding"
	"backend/internal/biz"
	"backend/internal/pkg/eino"
	"backend/internal/pkg/llm"
	"backend/internal/pkg/models"
	"backend/internal/pkg/vector"
	"github.com/go-kratos/kratos/v2/log"

	"google.golang.org/protobuf/types/known/timestamppb"
)

// NovelService 小说生成服务
type NovelService struct {
	pb.UnimplementedNovelServiceServer

	uc               *biz.NovelUsecase
	orchestrator     *orchestrator.OrchestratorAgent
	worldAgent       *worldbuilding.WorldBuildingAgent
	charAgent        *character.CharacterAgent
	outlineAgent     *outline.OutlineAgent
	chapterAgent     *chapter.ChapterAgent
	polishAgent      *polish.PolishAgent
	qualityAgent     *quality.QualityAgent
	consistencyAgent *consistency.ConsistencyAgent
	modelSwitcher    *eino.ModelSwitcher
	log              *log.Helper
}

// NewNovelService 创建小说服务
func NewNovelService(uc *biz.NovelUsecase, orchestratorAgent *orchestrator.OrchestratorAgent, llmClient llm.LLMClient, modelSwitcher *eino.ModelSwitcher, logger log.Logger) *NovelService {
	service := &NovelService{
		uc:               uc,
		orchestrator:     orchestratorAgent,
		worldAgent:       worldbuilding.NewWorldBuildingAgent(llmClient, logger),
		charAgent:        character.NewCharacterAgent(llmClient),
		outlineAgent:     outline.NewOutlineAgent(llmClient),
		chapterAgent:     chapter.NewChapterAgent(llmClient),
		polishAgent:      polish.NewPolishAgent(llmClient),
		consistencyAgent: consistency.NewConsistencyAgent(llmClient),
		modelSwitcher:    modelSwitcher,
		log:              log.NewHelper(logger),
	}

	// 初始化qualityAgent，需要依赖polishAgent和consistencyAgent
	service.qualityAgent = quality.NewQualityAgent(llmClient, service.polishAgent, service.consistencyAgent)

	return service
}

// NewNovelServiceWithRAG 创建带RAG功能的小说服务
func NewNovelServiceWithRAG(uc *biz.NovelUsecase, orchestratorAgent *orchestrator.OrchestratorAgent,
	einoClient *eino.EinoLLMClient, ragService *vector.RAGService, llmClient llm.LLMClient, modelSwitcher *eino.ModelSwitcher, logger log.Logger) *NovelService {
	service := &NovelService{
		uc:               uc,
		orchestrator:     orchestratorAgent,
		worldAgent:       worldbuilding.NewWorldBuildingAgent(llmClient, logger),
		charAgent:        character.NewCharacterAgent(llmClient),
		outlineAgent:     outline.NewOutlineAgent(llmClient),
		chapterAgent:     chapter.NewChapterAgent(llmClient),
		polishAgent:      polish.NewPolishAgent(llmClient),
		consistencyAgent: consistency.NewConsistencyAgentWithRAG(llmClient, *einoClient, ragService),
		modelSwitcher:    modelSwitcher,
		log:              log.NewHelper(logger),
	}

	// 初始化qualityAgent，需要依赖polishAgent和consistencyAgent
	service.qualityAgent = quality.NewQualityAgent(llmClient, service.polishAgent, service.consistencyAgent)

	return service
}

// CreateProject 创建小说项目
func (s *NovelService) CreateProject(ctx context.Context, req *pb.CreateProjectRequest) (*pb.CreateProjectResponse, error) {
	project := &models.NovelProject{
		ID:             generateID(),
		Title:          req.Title,
		Description:    req.Description,
		Genre:          req.Genre,
		TargetAudience: req.TargetAudience,
		Tone:           req.Tone,
		Themes:         req.Themes,
		Status:         "draft",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	createdProject, err := s.uc.CreateProject(ctx, project)
	if err != nil {
		return nil, err
	}

	return &pb.CreateProjectResponse{
		ProjectId: createdProject.ID,
		Title:     createdProject.Title,
		Status:    createdProject.Status,
		CreatedAt: timestamppb.New(createdProject.CreatedAt),
	}, nil
}

// GetProject 获取项目详情
func (s *NovelService) GetProject(ctx context.Context, req *pb.GetProjectRequest) (*pb.GetProjectResponse, error) {
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	return &pb.GetProjectResponse{
		Project: convertProjectToProto(project),
	}, nil
}

// ListProjects 获取项目列表
func (s *NovelService) ListProjects(ctx context.Context, req *pb.ListProjectsRequest) (*pb.ListProjectsResponse, error) {
	// 设置默认分页参数
	page := int(req.Page)
	pageSize := int(req.PageSize)
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	projects, total, err := s.uc.ListProjects(ctx, page, pageSize)
	if err != nil {
		return nil, err
	}

	pbProjects := make([]*pb.Project, len(projects))
	for i, project := range projects {
		pbProjects[i] = convertProjectToProto(project)
	}

	return &pb.ListProjectsResponse{
		Projects: pbProjects,
		Total:    int32(total),
	}, nil
}

// UpdateProject 更新项目
func (s *NovelService) UpdateProject(ctx context.Context, req *pb.UpdateProjectRequest) (*pb.UpdateProjectResponse, error) {
	s.log.Infof("=== UpdateProject called ===")
	s.log.Infof("Request: %+v", req)
	s.log.Infof("ProjectId: %s", req.ProjectId)
	s.log.Infof("Title: %s", req.Title)
	s.log.Infof("Description: %s", req.Description)
	s.log.Infof("Genre: %s", req.Genre)
	s.log.Infof("TargetAudience: %s", req.TargetAudience)
	s.log.Infof("Tone: %s", req.Tone)
	s.log.Infof("Themes: %v", req.Themes)

	// 获取现有项目
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		s.log.Errorf("Error getting project: %v", err)
		return nil, err
	}

	s.log.Infof("Original project: Title=%s, Description=%s, Genre=%s, TargetAudience=%s, Tone=%s, Themes=%v",
		project.Title, project.Description, project.Genre, project.TargetAudience, project.Tone, project.Themes)

	// 更新项目字段 - 直接更新所有字段，允许设置为空值
	project.Title = req.Title
	project.Description = req.Description
	project.Genre = req.Genre
	project.TargetAudience = req.TargetAudience
	project.Tone = req.Tone
	project.Themes = req.Themes

	// 更新大纲（如果提供）
	if req.Outline != nil {
		s.log.Infof("Updating outline: %+v", req.Outline)
		outline := &models.Outline{
			ID:        req.Outline.Id,
			ProjectID: req.Outline.ProjectId,
		}
		
		if len(req.Outline.Chapters) > 0 {
			outline.Chapters = make([]*models.ChapterOutline, len(req.Outline.Chapters))
			for i, pbChapter := range req.Outline.Chapters {
				outline.Chapters[i] = &models.ChapterOutline{
					Index:          int(pbChapter.Index),
					Title:          pbChapter.Title,
					Summary:        pbChapter.Summary,
					Goal:           pbChapter.Goal,
					TwistHint:      pbChapter.TwistHint,
					ImportantItems: pbChapter.ImportantItems,
				}
			}
		}
		
		project.Outline = outline
	}

	s.log.Infof("Updated project: Title=%s, Description=%s, Genre=%s, TargetAudience=%s, Tone=%s, Themes=%v",
		project.Title, project.Description, project.Genre, project.TargetAudience, project.Tone, project.Themes)

	// 保存更新后的项目
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		s.log.Errorf("Error updating project: %v", err)
		return nil, err
	}

	s.log.Infof("Successfully updated project")

	return &pb.UpdateProjectResponse{
		Project: convertProjectToProto(project),
	}, nil
}

// GenerateWorldView 生成世界观
func (s *NovelService) GenerateWorldView(ctx context.Context, req *pb.GenerateWorldViewRequest) (*pb.GenerateWorldViewResponse, error) {
	s.log.Infof("=== GenerateWorldView called ===")
	s.log.Infof("Request: %+v", req)
	s.log.Infof("ProjectId: %s", req.ProjectId)
	s.log.Infof("Genre: %s", req.Genre)
	s.log.Infof("Setting: %s", req.Setting)

	// 获取项目信息
	s.log.Infof("Getting project with ID: %s", req.ProjectId)
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		s.log.Errorf("Error getting project: %v", err)
		return nil, err
	}
	s.log.Infof("Project retrieved successfully: %+v", project)

	// 构建世界观生成请求
	s.log.Infof("Building worldview generation request...")
	worldReq := &worldbuilding.GenerateWorldViewRequest{
		ProjectID: req.ProjectId,
		Genre:     req.Genre,
		Setting:   req.Setting,
		KeyRules:  req.KeyRules,
		Tone:      req.Tone,
		Audience:  req.TargetAudience,
		Themes:    req.Themes,
	}
	s.log.Infof("Worldview request: %+v", worldReq)

	// 生成世界观
	s.log.Infof("Calling world agent GenerateWorldView...")
	worldView, err := s.worldAgent.GenerateWorldView(ctx, worldReq)
	if err != nil {
		s.log.Errorf("Error generating worldview: %v", err)
		return nil, err
	}
	s.log.Infof("Worldview generated successfully: %+v", worldView)

	// 更新项目的世界观
	s.log.Infof("Updating project worldview...")
	project.WorldView = worldView

	// 保存项目
	s.log.Infof("Saving updated project...")
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		s.log.Errorf("Error updating project: %v", err)
		return nil, err
	}
	s.log.Infof("Project updated successfully")

	s.log.Infof("=== GenerateWorldView completed ===")
	return &pb.GenerateWorldViewResponse{
		WorldView: &pb.WorldView{
			Title:        worldView.Title,
			Synopsis:     worldView.Synopsis,
			Setting:      worldView.Setting,
			KeyRules:     worldView.KeyRules,
			ToneExamples: worldView.ToneExamples,
			Themes:       worldView.Themes,
		},
	}, nil
}

// GenerateCharacters 生成角色卡
func (s *NovelService) GenerateCharacters(ctx context.Context, req *pb.GenerateCharactersRequest) (*pb.GenerateCharactersResponse, error) {
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	charReq := &character.GenerateCharactersRequest{
		ProjectID:      req.ProjectId,
		WorldView:      project.WorldView,
		CharacterNames: req.CharacterNames,
		Options:        convertLLMOptionsFromProto(req.LlmOptions),
	}

	resp, err := s.charAgent.GenerateCharacters(ctx, charReq)
	if err != nil {
		return nil, err
	}

	// 保存角色到项目中
	project.Characters = resp.Characters
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		return nil, err
	}

	pbCharacters := make([]*pb.Character, len(resp.Characters))
	for i, char := range resp.Characters {
		pbCharacters[i] = convertCharacterToProto(char)
	}

	return &pb.GenerateCharactersResponse{
		Characters: pbCharacters,
	}, nil
}

// GenerateOutline 生成大纲
func (s *NovelService) GenerateOutline(ctx context.Context, req *pb.GenerateOutlineRequest) (*pb.GenerateOutlineResponse, error) {
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	outlineReq := &outline.GenerateOutlineRequest{
		ProjectID:    req.ProjectId,
		WorldView:    project.WorldView,
		Characters:   project.Characters,
		ChapterCount: int(req.ChapterCount),
		Options:      convertLLMOptionsFromProto(req.LlmOptions),
	}

	resp, err := s.outlineAgent.GenerateOutline(ctx, outlineReq)
	if err != nil {
		return nil, err
	}

	// 保存大纲到项目中
	project.Outline = resp.Outline
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		return nil, err
	}

	return &pb.GenerateOutlineResponse{
		Outline: convertOutlineToProto(resp.Outline),
	}, nil
}

// UpdateChapterOutline 更新章节大纲
func (s *NovelService) UpdateChapterOutline(ctx context.Context, req *pb.UpdateChapterOutlineRequest) (*pb.UpdateChapterOutlineResponse, error) {
	// 获取项目
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	// 检查项目是否有大纲
	if project.Outline == nil {
		return nil, fmt.Errorf("project outline not found")
	}

	// 查找要更新的章节 - 按章节的Index字段查找，而不是数组索引
	targetChapterIndex := int(req.ChapterIndex)
	var foundIndex = -1
	
	for i, chapter := range project.Outline.Chapters {
		if chapter.Index == targetChapterIndex {
			foundIndex = i
			break
		}
	}
	
	if foundIndex == -1 {
		return nil, fmt.Errorf("chapter with index %d not found", targetChapterIndex)
	}

	// 更新章节大纲 - 创建新的 ChapterOutline 对象
	updatedChapter := &models.ChapterOutline{
		Index:          targetChapterIndex,
		Title:          req.Title,
		Summary:        req.Summary,
		Goal:           req.Goal,
		TwistHint:      req.TwistHint,
		ImportantItems: req.ImportantItems,
	}

	// 替换到找到的位置
	project.Outline.Chapters[foundIndex] = updatedChapter

	// 添加日志以便调试
	s.log.WithContext(ctx).Infof("Updated chapter %d: %s", req.ChapterIndex, req.Title)

	// 保存更新后的项目
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		return nil, err
	}

	return &pb.UpdateChapterOutlineResponse{
		Outline: convertOutlineToProto(project.Outline),
	}, nil
}

// DeleteChapterOutline 删除章节大纲
func (s *NovelService) DeleteChapterOutline(ctx context.Context, req *pb.DeleteChapterOutlineRequest) (*pb.DeleteChapterOutlineResponse, error) {
	// 获取项目
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	// 检查项目是否有大纲
	if project.Outline == nil {
		return nil, fmt.Errorf("project outline not found")
	}

	// 查找要删除的章节
	targetChapterIndex := int(req.ChapterIndex)
	var foundIndex = -1
	
	for i, chapter := range project.Outline.Chapters {
		if chapter.Index == targetChapterIndex {
			foundIndex = i
			break
		}
	}
	
	if foundIndex == -1 {
		return nil, fmt.Errorf("chapter with index %d not found", targetChapterIndex)
	}

	// 删除章节
	project.Outline.Chapters = append(project.Outline.Chapters[:foundIndex], project.Outline.Chapters[foundIndex+1:]...)

	// 重新调整后续章节的索引
	for i := foundIndex; i < len(project.Outline.Chapters); i++ {
		project.Outline.Chapters[i].Index = i + 1
	}

	// 添加日志
	s.log.WithContext(ctx).Infof("Deleted chapter %d", req.ChapterIndex)

	// 保存更新后的项目
	_, err = s.uc.UpdateProject(ctx, project)
	if err != nil {
		return nil, err
	}

	return &pb.DeleteChapterOutlineResponse{
		Outline: convertOutlineToProto(project.Outline),
	}, nil
}

// ReorderChapterOutline 重排序章节大纲
func (s *NovelService) ReorderChapterOutline(ctx context.Context, req *pb.ReorderChapterOutlineRequest) (*pb.ReorderChapterOutlineResponse, error) {
	s.log.WithContext(ctx).Infof("ReorderChapterOutline called for project %s with %d mappings", req.ProjectId, len(req.ChapterMappings))

	// 获取项目
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		s.log.WithContext(ctx).Errorf("Failed to get project %s: %v", req.ProjectId, err)
		return nil, err
	}

	// 检查项目是否有大纲
	if project.Outline == nil || len(project.Outline.Chapters) == 0 {
		s.log.WithContext(ctx).Errorf("Project %s has no outline or empty chapters", req.ProjectId)
		return nil, fmt.Errorf("project outline not found or empty")
	}

	originalChapters := project.Outline.Chapters
	chapterCount := len(originalChapters)
	s.log.WithContext(ctx).Infof("Original chapter count: %d", chapterCount)

	// 验证所有映射的有效性
	for i, mapping := range req.ChapterMappings {
		oldIndex := int(mapping.OldIndex)
		newIndex := int(mapping.NewIndex)
		
		s.log.WithContext(ctx).Infof("Mapping %d: %d -> %d", i, oldIndex, newIndex)

		// 索引从1开始，转换为从0开始的数组索引
		if oldIndex < 1 || oldIndex > chapterCount || newIndex < 1 || newIndex > chapterCount {
			s.log.WithContext(ctx).Errorf("Invalid index mapping: old=%d, new=%d, chapter_count=%d", oldIndex, newIndex, chapterCount)
			return nil, fmt.Errorf("invalid chapter index: old=%d, new=%d (valid range: 1-%d)", oldIndex, newIndex, chapterCount)
		}
	}

	// 如果只有一个映射，使用简单的移动算法
	if len(req.ChapterMappings) == 1 {
		mapping := req.ChapterMappings[0]
		fromIndex := int(mapping.OldIndex) - 1  // 转换为0基索引
		toIndex := int(mapping.NewIndex) - 1    // 转换为0基索引

		s.log.WithContext(ctx).Infof("Single mapping: moving chapter from position %d to %d", fromIndex, toIndex)

		// 创建新的章节数组
		newChapters := make([]*models.ChapterOutline, chapterCount)
		copy(newChapters, originalChapters)

		// 移动章节
		if fromIndex != toIndex {
			chapterToMove := newChapters[fromIndex]
			
			// 移除原位置的章节
			if fromIndex < toIndex {
				// 向后移动：将中间的章节向前移动
				copy(newChapters[fromIndex:toIndex], newChapters[fromIndex+1:toIndex+1])
			} else {
				// 向前移动：将中间的章节向后移动
				copy(newChapters[toIndex+1:fromIndex+1], newChapters[toIndex:fromIndex])
			}
			
			// 插入到新位置
			newChapters[toIndex] = chapterToMove
		}

		// 重新编号所有章节的Index字段
		for i, chapter := range newChapters {
			chapter.Index = i + 1
			s.log.WithContext(ctx).Infof("Chapter %d: %s (new index: %d)", i, chapter.Title, chapter.Index)
		}

		// 更新项目大纲
		project.Outline.Chapters = newChapters
	} else {
		// 多个映射的情况，使用更复杂的算法
		s.log.WithContext(ctx).Infof("Multiple mappings detected, using complex reordering algorithm")
		
		// 构建索引映射表
		indexMappings := make([]struct {
			OldIndex int
			NewIndex int
		}, len(req.ChapterMappings))
		
		for i, mapping := range req.ChapterMappings {
			indexMappings[i] = struct {
				OldIndex int
				NewIndex int
			}{
				OldIndex: int(mapping.OldIndex),
				NewIndex: int(mapping.NewIndex),
			}
		}

		// 调用业务层的重排序方法
		err = s.uc.ReorderChapterOutline(ctx, req.ProjectId, indexMappings)
		if err != nil {
			s.log.WithContext(ctx).Errorf("Failed to reorder chapters in business layer: %v", err)
			return nil, err
		}

		// 重新获取更新后的项目
		project, err = s.uc.GetProject(ctx, req.ProjectId)
		if err != nil {
			s.log.WithContext(ctx).Errorf("Failed to get updated project: %v", err)
			return nil, err
		}
	}

	s.log.WithContext(ctx).Infof("Successfully reordered chapters for project %s", req.ProjectId)

	return &pb.ReorderChapterOutlineResponse{
		Outline: convertOutlineToProto(project.Outline),
	}, nil
}

// GenerateChapter 生成章节
func (s *NovelService) GenerateChapter(ctx context.Context, req *pb.GenerateChapterRequest) (*pb.GenerateChapterResponse, error) {
	chapterReq := &chapter.GenerateChapterRequest{
		ProjectID:       req.ProjectId,
		ChapterOutline:  convertChapterOutlineFromProto(req.ChapterOutline),
		Context:         convertContextFromProto(req.Context),
		TargetWordCount: int(req.TargetWordCount),
		Options:         convertLLMOptionsFromProto(req.LlmOptions),
	}

	resp, err := s.chapterAgent.GenerateChapter(ctx, chapterReq)
	if err != nil {
		return nil, err
	}

	// 保存章节
	savedChapter, err := s.uc.SaveChapter(ctx, resp.Chapter)
	if err != nil {
		return nil, err
	}

	return &pb.GenerateChapterResponse{
		Chapter: convertChapterToProto(savedChapter),
	}, nil
}

// PolishChapter 润色章节
func (s *NovelService) PolishChapter(ctx context.Context, req *pb.PolishChapterRequest) (*pb.PolishChapterResponse, error) {
	chapter, err := s.uc.GetChapter(ctx, req.ChapterId)
	if err != nil {
		return nil, err
	}

	polishReq := &polish.PolishChapterRequest{
		Chapter: chapter,
		Style:   req.Style,
		Focus:   req.Focus,
		Options: convertLLMOptionsFromProto(req.LlmOptions),
	}

	resp, err := s.polishAgent.PolishChapter(ctx, polishReq)
	if err != nil {
		return nil, err
	}

	// 更新章节
	updatedChapter, err := s.uc.UpdateChapter(ctx, resp.Chapter)
	if err != nil {
		return nil, err
	}

	return &pb.PolishChapterResponse{
		PolishedChapter: convertChapterToProto(updatedChapter),
	}, nil
}

// CheckConsistency 检查一致性
func (s *NovelService) CheckConsistency(ctx context.Context, req *pb.CheckConsistencyRequest) (*pb.CheckConsistencyResponse, error) {
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	consistencyReq := &consistency.CheckConsistencyRequest{
		Project:   project,
		Chapters:  project.Chapters,
		CheckType: req.CheckType,
		Options:   convertLLMOptionsFromProto(req.LlmOptions),
	}

	resp, err := s.consistencyAgent.CheckConsistency(ctx, consistencyReq)
	if err != nil {
		return nil, err
	}

	pbIssues := make([]*pb.ConsistencyIssue, len(resp.Issues))
	for i, issue := range resp.Issues {
		pbIssues[i] = &pb.ConsistencyIssue{
			Type:        issue.Type,
			Severity:    issue.Severity,
			Description: issue.Description,
			Location:    issue.Location,
			Suggestion:  issue.Suggestion,
		}
	}

	return &pb.CheckConsistencyResponse{
		Issues:       pbIssues,
		Suggestions:  resp.Suggestions,
		OverallScore: resp.OverallScore,
	}, nil
}

// GenerateNovel 生成完整小说（流式响应）
func (s *NovelService) GenerateNovel(req *pb.GenerateNovelRequest, stream pb.NovelService_GenerateNovelServer) error {
	ctx := stream.Context()

	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return err
	}

	orchestratorReq := &orchestrator.GenerateNovelRequest{
		Project: project,
		Options: convertGenerateOptionsFromProto(req.Options),
	}

	resp, err := s.orchestrator.GenerateNovel(ctx, orchestratorReq)
	if err != nil {
		return err
	}

	// 保存生成的内容
	_, err = s.uc.UpdateProject(ctx, resp.Project)
	if err != nil {
		return err
	}

	pbChapters := make([]*pb.Chapter, len(resp.Chapters))
	for i, chapter := range resp.Chapters {
		pbChapters[i] = convertChapterToProto(chapter)
	}

	// 发送响应
	return stream.Send(&pb.GenerateNovelResponse{
		Status:       resp.Status,
		Progress:     resp.Progress,
		CurrentStage: resp.Message,
		Message:      resp.Message,
		Chapters:     pbChapters,
		Issues:       resp.Issues,
	})
}

// ExportNovel 导出小说
func (s *NovelService) ExportNovel(ctx context.Context, req *pb.ExportNovelRequest) (*pb.ExportNovelResponse, error) {
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}

	options := &models.ExportOptions{
		IncludeMetadata: req.Options.IncludeMetadata,
		IncludeOutline:  req.Options.IncludeOutline,
		FontFamily:      req.Options.FontFamily,
		FontSize:        int(req.Options.FontSize),
	}

	result, err := s.uc.ExportNovel(ctx, project, req.Format, options)
	if err != nil {
		return nil, err
	}

	return &pb.ExportNovelResponse{
		DownloadUrl: result.DownloadURL,
		FileName:    result.FileName,
		FileSize:    result.FileSize,
	}, nil
}

// GenerateVideoScript 生成视频脚本
func (s *NovelService) GenerateVideoScript(ctx context.Context, req *pb.GenerateVideoScriptRequest) (*pb.GenerateVideoScriptResponse, error) {
	// 获取章节
	chapters := make([]*models.Chapter, 0)
	for _, chapterID := range req.ChapterIds {
		chapter, err := s.uc.GetChapter(ctx, chapterID)
		if err != nil {
			return nil, err
		}
		chapters = append(chapters, chapter)
	}

	options := &models.VideoScriptOptions{
		ScenesPerChapter: int(req.Options.ScenesPerChapter),
		Platform:         req.Options.Platform,
		VoiceType:        req.Options.VoiceType,
	}

	scenes, err := s.uc.GenerateVideoScript(ctx, chapters, options)
	if err != nil {
		return nil, err
	}

	pbScenes := make([]*pb.VideoScene, len(scenes))
	for i, scene := range scenes {
		pbScenes[i] = &pb.VideoScene{
			ScreenIndex:       int32(scene.ScreenIndex),
			Text:              scene.Text,
			SuggestedBgmTag:   scene.SuggestedBGMTag,
			SuggestedImageTag: scene.SuggestedImageTag,
			TtsVoice:          scene.TTSVoice,
			Notes:             scene.Notes,
		}
	}

	return &pb.GenerateVideoScriptResponse{
		Scenes: pbScenes,
	}, nil
}

// CheckQuality 质量检测
func (s *NovelService) CheckQuality(ctx context.Context, req *pb.CheckQualityRequest) (*pb.CheckQualityResponse, error) {
	// 获取项目信息
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, fmt.Errorf("获取项目失败: %w", err)
	}

	// 获取章节信息
	chapter, err := s.uc.GetChapter(ctx, req.ChapterId)
	if err != nil {
		return nil, fmt.Errorf("获取章节失败: %w", err)
	}

	// 构建质量检测请求
	qualityReq := &quality.QualityCheckRequest{
		Project:   project,
		Chapter:   chapter,
		CheckType: req.CheckType,
		Options: &llm.GenerateOptions{
			Temperature:      req.LlmOptions.Temperature,
			TopP:             req.LlmOptions.TopP,
			MaxTokens:        int(req.LlmOptions.MaxTokens),
			FrequencyPenalty: req.LlmOptions.FrequencyPenalty,
			PresencePenalty:  req.LlmOptions.PresencePenalty,
		},
	}

	// 执行质量检测
	result, err := s.qualityAgent.CheckQuality(ctx, qualityReq)
	if err != nil {
		return nil, fmt.Errorf("质量检测失败: %w", err)
	}

	// 转换响应
	response := &pb.CheckQualityResponse{
		OverallScore:    result.OverallScore,
		Recommendations: result.Recommendations,
	}

	if result.PolishedChapter != nil {
		response.PolishedChapter = convertChapterToProto(result.PolishedChapter)
	}

	if result.ProofreadResult != nil {
		response.ProofreadResult = &pb.ProofreadResult{
			CorrectedContent: result.ProofreadResult.CorrectedContent,
			Suggestions:      result.ProofreadResult.Suggestions,
		}

		for _, issue := range result.ProofreadResult.Issues {
			response.ProofreadResult.Issues = append(response.ProofreadResult.Issues, &pb.QualityIssue{
				Type:        issue.Type,
				Severity:    issue.Severity,
				Description: issue.Description,
				Position:    issue.Position,
				Original:    issue.Original,
				Corrected:   issue.Corrected,
			})
		}
	}

	if result.CritiqueResult != nil {
		response.CritiqueResult = &pb.CritiqueResult{
			LogicalIssues:   result.CritiqueResult.LogicalIssues,
			CharacterIssues: result.CritiqueResult.CharacterIssues,
			PacingIssues:    result.CritiqueResult.PacingIssues,
			Improvements:    result.CritiqueResult.Improvements,
			FixedExample:    result.CritiqueResult.FixedExample,
			OverallScore:    int32(result.CritiqueResult.OverallScore),
		}
	}

	for _, issue := range result.ConsistencyIssues {
		response.ConsistencyIssues = append(response.ConsistencyIssues, &pb.ConsistencyIssue{
			Type:        issue.Type,
			Severity:    issue.Severity,
			Description: issue.Description,
			Location:    issue.Location,
			Suggestion:  issue.Suggestion,
		})
	}

	return response, nil
}

// BatchCheckQuality 批量质量检测
func (s *NovelService) BatchCheckQuality(ctx context.Context, req *pb.BatchCheckQualityRequest) (*pb.BatchCheckQualityResponse, error) {
	// 获取项目信息
	project, err := s.uc.GetProject(ctx, req.ProjectId)
	if err != nil {
		return nil, fmt.Errorf("获取项目失败: %w", err)
	}

	// 获取章节信息
	var chapters []*models.Chapter
	for _, chapterID := range req.ChapterIds {
		chapter, err := s.uc.GetChapter(ctx, chapterID)
		if err != nil {
			return nil, fmt.Errorf("获取章节 %s 失败: %w", chapterID, err)
		}
		chapters = append(chapters, chapter)
	}

	// 构建批量质量检测请求
	batchReq := &quality.BatchQualityCheckRequest{
		Project:   project,
		Chapters:  chapters,
		CheckType: req.CheckType,
		Options: &llm.GenerateOptions{
			Temperature:      req.LlmOptions.Temperature,
			TopP:             req.LlmOptions.TopP,
			MaxTokens:        int(req.LlmOptions.MaxTokens),
			FrequencyPenalty: req.LlmOptions.FrequencyPenalty,
			PresencePenalty:  req.LlmOptions.PresencePenalty,
		},
	}

	// 执行批量质量检测
	result, err := s.qualityAgent.BatchCheckQuality(ctx, batchReq)
	if err != nil {
		return nil, fmt.Errorf("批量质量检测失败: %w", err)
	}

	// 转换响应
	response := &pb.BatchCheckQualityResponse{
		OverallScore: result.OverallScore,
	}

	// 转换单个结果
	for _, res := range result.Results {
		pbResult := &pb.CheckQualityResponse{
			OverallScore:    res.OverallScore,
			Recommendations: res.Recommendations,
		}

		if res.PolishedChapter != nil {
			pbResult.PolishedChapter = convertChapterToProto(res.PolishedChapter)
		}

		if res.ProofreadResult != nil {
			pbResult.ProofreadResult = &pb.ProofreadResult{
				CorrectedContent: res.ProofreadResult.CorrectedContent,
				Suggestions:      res.ProofreadResult.Suggestions,
			}

			for _, issue := range res.ProofreadResult.Issues {
				pbResult.ProofreadResult.Issues = append(pbResult.ProofreadResult.Issues, &pb.QualityIssue{
					Type:        issue.Type,
					Severity:    issue.Severity,
					Description: issue.Description,
					Position:    issue.Position,
					Original:    issue.Original,
					Corrected:   issue.Corrected,
				})
			}
		}

		if res.CritiqueResult != nil {
			pbResult.CritiqueResult = &pb.CritiqueResult{
				LogicalIssues:   res.CritiqueResult.LogicalIssues,
				CharacterIssues: res.CritiqueResult.CharacterIssues,
				PacingIssues:    res.CritiqueResult.PacingIssues,
				Improvements:    res.CritiqueResult.Improvements,
				FixedExample:    res.CritiqueResult.FixedExample,
				OverallScore:    int32(res.CritiqueResult.OverallScore),
			}
		}

		for _, issue := range res.ConsistencyIssues {
			pbResult.ConsistencyIssues = append(pbResult.ConsistencyIssues, &pb.ConsistencyIssue{
				Type:        issue.Type,
				Severity:    issue.Severity,
				Description: issue.Description,
				Location:    issue.Location,
				Suggestion:  issue.Suggestion,
			})
		}

		response.Results = append(response.Results, pbResult)
	}

	// 转换汇总信息
	if result.Summary != nil {
		response.Summary = &pb.QualitySummary{
			TotalIssues:      int32(result.Summary.TotalIssues),
			IssuesByType:     make(map[string]int32),
			IssuesBySeverity: make(map[string]int32),
			Recommendations:  result.Summary.Recommendations,
		}

		for k, v := range result.Summary.IssuesByType {
			response.Summary.IssuesByType[k] = int32(v)
		}

		for k, v := range result.Summary.IssuesBySeverity {
			response.Summary.IssuesBySeverity[k] = int32(v)
		}

		for _, trend := range result.Summary.QualityTrends {
			response.Summary.QualityTrends = append(response.Summary.QualityTrends, trend)
		}
	}

	return response, nil
}

// 辅助函数：数据模型转换
func convertProjectToProto(project *models.NovelProject) *pb.Project {
	pbProject := &pb.Project{
		Id:             project.ID,
		Title:          project.Title,
		Description:    project.Description,
		Genre:          project.Genre,
		TargetAudience: project.TargetAudience,
		Tone:           project.Tone,
		Themes:         project.Themes,
		Status:         project.Status,
		CreatedAt:      timestamppb.New(project.CreatedAt),
		UpdatedAt:      timestamppb.New(project.UpdatedAt),
	}

	if project.WorldView != nil {
		pbProject.WorldView = convertWorldViewToProto(project.WorldView)
	}

	if len(project.Characters) > 0 {
		pbProject.Characters = make([]*pb.Character, len(project.Characters))
		for i, char := range project.Characters {
			pbProject.Characters[i] = convertCharacterToProto(char)
		}
	}

	if project.Outline != nil {
		pbProject.Outline = convertOutlineToProto(project.Outline)
	}

	if len(project.Chapters) > 0 {
		pbProject.Chapters = make([]*pb.Chapter, len(project.Chapters))
		for i, chapter := range project.Chapters {
			pbProject.Chapters[i] = convertChapterToProto(chapter)
		}
	}

	return pbProject
}

func convertWorldViewToProto(worldView *models.WorldView) *pb.WorldView {
	return &pb.WorldView{
		Title:        worldView.Title,
		Synopsis:     worldView.Synopsis,
		Setting:      worldView.Setting,
		KeyRules:     worldView.KeyRules,
		ToneExamples: worldView.ToneExamples,
		Themes:       worldView.Themes,
	}
}

func convertCharacterToProto(character *models.Character) *pb.Character {
	return &pb.Character{
		Id:              character.ID,
		ProjectId:       character.ProjectID,
		Name:            character.Name,
		Role:            character.Role,
		Age:             int32(character.Age),
		Appearance:      character.Appearance,
		Background:      character.Background,
		Motivation:      character.Motivation,
		Flaws:           character.Flaws,
		SpeechTone:      character.SpeechTone,
		Secrets:         character.Secrets,
		RelationshipMap: character.RelationshipMap,
	}
}

func convertOutlineToProto(outline *models.Outline) *pb.Outline {
	pbOutline := &pb.Outline{
		Id:        outline.ID,
		ProjectId: outline.ProjectID,
	}

	if len(outline.Chapters) > 0 {
		pbOutline.Chapters = make([]*pb.ChapterOutline, len(outline.Chapters))
		for i, chapter := range outline.Chapters {
			pbOutline.Chapters[i] = &pb.ChapterOutline{
				Index:          int32(chapter.Index),
				Title:          chapter.Title,
				Summary:        chapter.Summary,
				Goal:           chapter.Goal,
				TwistHint:      chapter.TwistHint,
				ImportantItems: chapter.ImportantItems,
			}
		}
	}

	return pbOutline
}

func convertChapterToProto(chapter *models.Chapter) *pb.Chapter {
	return &pb.Chapter{
		Id:         chapter.ID,
		ProjectId:  chapter.ProjectID,
		Index:      int32(chapter.Index),
		Title:      chapter.Title,
		Summary:    chapter.Summary,
		RawContent: chapter.RawContent,
		WordCount:  int32(chapter.WordCount),
		Status:     chapter.Status,
		CreatedAt:  timestamppb.New(chapter.CreatedAt),
		UpdatedAt:  timestamppb.New(chapter.UpdatedAt),
	}
}

func convertContextFromProto(pbContext *pb.GenerationContext) *models.GenerationContext {
	context := &models.GenerationContext{
		PreviousSummary: pbContext.PreviousSummary,
		StyleExamples:   pbContext.StyleExamples,
	}

	if len(pbContext.Characters) > 0 {
		context.Characters = make([]*models.Character, len(pbContext.Characters))
		for i, char := range pbContext.Characters {
			context.Characters[i] = convertCharacterFromProto(char)
		}
	}

	if len(pbContext.Timeline) > 0 {
		context.Timeline = make([]*models.TimelineEvent, len(pbContext.Timeline))
		for i, event := range pbContext.Timeline {
			context.Timeline[i] = &models.TimelineEvent{
				Timestamp:   event.Timestamp,
				Event:       event.Event,
				Description: event.Description,
			}
		}
	}

	if len(pbContext.Props) > 0 {
		context.Props = make([]*models.PropItem, len(pbContext.Props))
		for i, prop := range pbContext.Props {
			context.Props[i] = &models.PropItem{
				Name:        prop.Name,
				Description: prop.Description,
				Location:    prop.Location,
			}
		}
	}

	return context
}

func convertWorldViewFromProto(pbWorldView *pb.WorldView) *models.WorldView {
	return &models.WorldView{
		Title:        pbWorldView.Title,
		Synopsis:     pbWorldView.Synopsis,
		Setting:      pbWorldView.Setting,
		KeyRules:     pbWorldView.KeyRules,
		ToneExamples: pbWorldView.ToneExamples,
		Themes:       pbWorldView.Themes,
	}
}

func convertCharacterFromProto(pbCharacter *pb.Character) *models.Character {
	return &models.Character{
		ID:              pbCharacter.Id,
		ProjectID:       pbCharacter.ProjectId,
		Name:            pbCharacter.Name,
		Role:            pbCharacter.Role,
		Age:             int(pbCharacter.Age),
		Appearance:      pbCharacter.Appearance,
		Background:      pbCharacter.Background,
		Motivation:      pbCharacter.Motivation,
		Flaws:           pbCharacter.Flaws,
		SpeechTone:      pbCharacter.SpeechTone,
		Secrets:         pbCharacter.Secrets,
		RelationshipMap: pbCharacter.RelationshipMap,
	}
}

func convertChapterOutlineFromProto(pbOutline *pb.ChapterOutline) *models.ChapterOutline {
	return &models.ChapterOutline{
		Index:          int(pbOutline.Index),
		Title:          pbOutline.Title,
		Summary:        pbOutline.Summary,
		Goal:           pbOutline.Goal,
		TwistHint:      pbOutline.TwistHint,
		ImportantItems: pbOutline.ImportantItems,
	}
}

// generateID 生成唯一ID
func generateID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// SwitchModel 切换AI模型
func (s *NovelService) SwitchModel(ctx context.Context, req *pb.SwitchModelRequest) (*pb.SwitchModelResponse, error) {
	err := s.modelSwitcher.SwitchModel(ctx, req.ModelName)
	if err != nil {
		return &pb.SwitchModelResponse{
			Success: false,
			Message: fmt.Sprintf("切换模型失败: %v", err),
		}, nil
	}

	currentModel := s.modelSwitcher.GetCurrentModel()
	return &pb.SwitchModelResponse{
		Success:      true,
		Message:      "模型切换成功",
		CurrentModel: currentModel,
	}, nil
}

// ListModels 获取可用模型列表
func (s *NovelService) ListModels(ctx context.Context, req *pb.ListModelsRequest) (*pb.ListModelsResponse, error) {
	models := s.modelSwitcher.ListModels()
	currentModel := s.modelSwitcher.GetCurrentModel()

	var pbModels []*pb.ModelInfo
	for _, modelName := range models {
		pbModels = append(pbModels, &pb.ModelInfo{
			Name:        modelName,
			Provider:    "deepseek", // 这里可以从配置中获取
			Model:       modelName,
			Description: fmt.Sprintf("Model: %s", modelName),
			Available:   true, // 这里可以添加实际的可用性检查
		})
	}

	return &pb.ListModelsResponse{
		Models:       pbModels,
		CurrentModel: currentModel,
	}, nil
}

// GetStats 获取统计信息
func (s *NovelService) GetStats(ctx context.Context, req *pb.GetStatsRequest) (*pb.GetStatsResponse, error) {
	// 获取项目统计信息
	projects, total, err := s.uc.ListProjects(ctx, 1, 1000) // 获取所有项目
	if err != nil {
		return nil, err
	}

	// 计算统计信息
	completedCount := 0
	totalWords := int64(0)
	monthlyWords := int64(0)

	currentTime := time.Now()
	currentMonth := currentTime.Month()
	currentYear := currentTime.Year()

	for _, project := range projects {
		// 统计已完成项目
		if project.Status == "completed" {
			completedCount++
		}

		// 统计总字数和本月字数
		if project.Chapters != nil {
			for _, chapter := range project.Chapters {
				totalWords += int64(chapter.WordCount)

				// 检查是否为本月创建的章节
				if chapter.CreatedAt.Month() == currentMonth && chapter.CreatedAt.Year() == currentYear {
					monthlyWords += int64(chapter.WordCount)
				}
			}
		}
	}

	return &pb.GetStatsResponse{
		Stats: &pb.ProjectStats{
			TotalProjects:     int32(total),
			CompletedProjects: int32(completedCount),
			TotalWords:        totalWords,
			MonthlyWords:      monthlyWords,
		},
	}, nil
}

// convertLLMOptionsFromProto 将protobuf LLM选项转换为LLM选项
func convertLLMOptionsFromProto(pbOptions *pb.LLMOptions) *llm.GenerateOptions {
	if pbOptions == nil {
		return llm.DefaultOptions()
	}

	options := &llm.GenerateOptions{
		Temperature:      float64(pbOptions.Temperature),
		TopP:             float64(pbOptions.TopP),
		MaxTokens:        int(pbOptions.MaxTokens),
		FrequencyPenalty: float64(pbOptions.FrequencyPenalty),
		PresencePenalty:  float64(pbOptions.PresencePenalty),
		RetryCount:       2, // 默认重试次数
	}

	// 设置默认值
	if options.Temperature == 0 {
		options.Temperature = 0.35
	}
	if options.TopP == 0 {
		options.TopP = 0.9
	}
	if options.MaxTokens == 0 {
		options.MaxTokens = 2000
	}

	return options
}

// convertGenerateOptionsFromProto 将protobuf生成选项转换为编排器选项
func convertGenerateOptionsFromProto(pbOptions *pb.GenerateOptions) *orchestrator.GenerateOptions {
	if pbOptions == nil {
		return &orchestrator.GenerateOptions{
			MaxChapters:      20,
			WordsPerChapter:  3000,
			PolishEnabled:    true,
			ConsistencyCheck: true,
			LLMOptions:       llm.DefaultOptions(),
		}
	}

	return &orchestrator.GenerateOptions{
		MaxChapters:      int(pbOptions.MaxChapters),
		WordsPerChapter:  int(pbOptions.WordsPerChapter),
		PolishEnabled:    pbOptions.PolishEnabled,
		ConsistencyCheck: pbOptions.ConsistencyCheck,
		LLMOptions:       convertLLMOptionsFromProto(pbOptions.LlmOptions),
	}
}
