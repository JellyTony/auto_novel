package service

import (
	"context"
	"time"

	pb "backend/api/video_script/v1"
	"backend/internal/agent/video_script"
	"backend/internal/biz"
	"backend/internal/pkg/models"

	"github.com/go-kratos/kratos/v2/log"
)

// VideoScriptService 短视频脚本服务
type VideoScriptService struct {
	pb.UnimplementedVideoScriptServiceServer
	bizUC      *biz.VideoScriptUseCase
	videoAgent video_script.VideoScriptAgent
	logger     *log.Helper
}

// NewVideoScriptService 创建短视频脚本服务
func NewVideoScriptService(
	bizUC *biz.VideoScriptUseCase,
	videoAgent video_script.VideoScriptAgent,
	logger log.Logger,
) *VideoScriptService {
	return &VideoScriptService{
		bizUC:      bizUC,
		videoAgent: videoAgent,
		logger:     log.NewHelper(logger),
	}
}

// GenerateVideoScript 生成短视频脚本
func (s *VideoScriptService) GenerateVideoScript(ctx context.Context, req *pb.GenerateVideoScriptRequest) (*pb.GenerateVideoScriptResponse, error) {
	s.logger.WithContext(ctx).Infof("Generating video script for project: %s, chapter: %s", req.ProjectId, req.ChapterId)

	// 调用 Agent 生成脚本
	agentReq := &video_script.GenerateVideoScriptRequest{
		ProjectID:      req.ProjectId,
		ChapterID:      req.ChapterId,
		ChapterTitle:   req.ChapterTitle,
		ChapterContent: req.ChapterContent,
		Platform:       req.Platform,
		Duration:       int(req.Duration),
		Style:          req.Style,
		Requirements:   req.Requirements,
	}

	agentResp, err := s.videoAgent.GenerateVideoScript(ctx, agentReq)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to generate video script: %v", err)
		return nil, err
	}

	// 保存到数据库
	savedScript, err := s.bizUC.SaveVideoScript(ctx, agentResp.VideoScript)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to save video script: %v", err)
		return nil, err
	}

	return &pb.GenerateVideoScriptResponse{
		VideoScript: convertVideoScriptToProto(savedScript),
	}, nil
}

// OptimizeVideoScript 优化视频脚本
func (s *VideoScriptService) OptimizeVideoScript(ctx context.Context, req *pb.OptimizeVideoScriptRequest) (*pb.OptimizeVideoScriptResponse, error) {
	s.logger.WithContext(ctx).Infof("Optimizing video script: %s", req.ScriptId)

	// 获取原始脚本
	originalScript, err := s.bizUC.GetVideoScript(ctx, req.ScriptId)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to get video script: %v", err)
		return nil, err
	}

	// 调用 Agent 优化脚本
	agentReq := &video_script.OptimizeVideoScriptRequest{
		VideoScript:              originalScript,
		OptimizationRequirements: req.Requirements,
	}

	agentResp, err := s.videoAgent.OptimizeVideoScript(ctx, agentReq)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to optimize video script: %v", err)
		return nil, err
	}

	// 更新数据库
	updatedScript, err := s.bizUC.UpdateVideoScript(ctx, agentResp.VideoScript)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to update video script: %v", err)
		return nil, err
	}

	return &pb.OptimizeVideoScriptResponse{
		VideoScript: convertVideoScriptToProto(updatedScript),
	}, nil
}

// GeneratePlatformVariants 生成平台变体
func (s *VideoScriptService) GeneratePlatformVariants(ctx context.Context, req *pb.GeneratePlatformVariantsRequest) (*pb.GeneratePlatformVariantsResponse, error) {
	s.logger.WithContext(ctx).Infof("Generating platform variants for script: %s", req.BaseScriptId)

	// 获取基础脚本
	baseScript, err := s.bizUC.GetVideoScript(ctx, req.BaseScriptId)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to get base video script: %v", err)
		return nil, err
	}

	// 调用 Agent 生成平台变体
	agentReq := &video_script.GeneratePlatformVariantsRequest{
		BaseScript:      baseScript,
		TargetPlatforms: req.TargetPlatforms,
	}

	agentResp, err := s.videoAgent.GeneratePlatformVariants(ctx, agentReq)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to generate platform variants: %v", err)
		return nil, err
	}

	// 保存变体到数据库
	var savedVariants []*models.VideoScript
	for _, variant := range agentResp.Variants {
		savedVariant, err := s.bizUC.SaveVideoScript(ctx, variant)
		if err != nil {
			s.logger.WithContext(ctx).Errorf("Failed to save variant: %v", err)
			continue
		}
		savedVariants = append(savedVariants, savedVariant)
	}

	// 转换为 protobuf 格式
	var pbVariants []*pb.VideoScript
	for _, variant := range savedVariants {
		pbVariants = append(pbVariants, convertVideoScriptToProto(variant))
	}

	return &pb.GeneratePlatformVariantsResponse{
		Variants: pbVariants,
	}, nil
}

// ListVideoScripts 获取视频脚本列表
func (s *VideoScriptService) ListVideoScripts(ctx context.Context, req *pb.ListVideoScriptsRequest) (*pb.ListVideoScriptsResponse, error) {
	s.logger.WithContext(ctx).Infof("Listing video scripts for project: %s", req.ProjectId)

	// 从数据库获取脚本列表
	page := int(req.Page)
	pageSize := int(req.PageSize)
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}

	scripts, totalCount, err := s.bizUC.ListVideoScripts(ctx, req.ProjectId, page, pageSize)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to list video scripts: %v", err)
		return nil, err
	}

	// 转换为 protobuf 格式
	var pbScripts []*pb.VideoScript
	for _, script := range scripts {
		pbScripts = append(pbScripts, convertVideoScriptToProto(script))
	}

	return &pb.ListVideoScriptsResponse{
		Scripts: pbScripts,
		Total:   int32(totalCount),
	}, nil
}

// GetVideoScript 获取视频脚本详情
func (s *VideoScriptService) GetVideoScript(ctx context.Context, req *pb.GetVideoScriptRequest) (*pb.GetVideoScriptResponse, error) {
	s.logger.WithContext(ctx).Infof("Getting video script: %s", req.ScriptId)

	// 从数据库获取脚本详情
	script, err := s.bizUC.GetVideoScript(ctx, req.ScriptId)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to get video script: %v", err)
		return nil, err
	}

	return &pb.GetVideoScriptResponse{
		VideoScript: convertVideoScriptToProto(script),
	}, nil
}

// DeleteVideoScript 删除视频脚本
func (s *VideoScriptService) DeleteVideoScript(ctx context.Context, req *pb.DeleteVideoScriptRequest) (*pb.DeleteVideoScriptResponse, error) {
	s.logger.WithContext(ctx).Infof("Deleting video script: %s", req.ScriptId)

	// 从数据库删除脚本
	err := s.bizUC.DeleteVideoScript(ctx, req.ScriptId)
	if err != nil {
		s.logger.WithContext(ctx).Errorf("Failed to delete video script: %v", err)
		return nil, err
	}

	return &pb.DeleteVideoScriptResponse{
		Success: true,
	}, nil
}

// convertVideoScriptToProto 将业务模型转换为 protobuf 模型
func convertVideoScriptToProto(script *models.VideoScript) *pb.VideoScript {
	if script == nil {
		return nil
	}

	pbScript := &pb.VideoScript{
		Id:          script.ID,
		ProjectId:   script.ProjectID,
		ChapterId:   script.ChapterID,
		Title:       script.Title,
		Duration:    int32(script.Duration),
		Platform:    script.Platform,
		Style:       script.Style,
		Description: script.Description,
		Status:      script.Status,
		CreatedAt:   script.CreatedAt.Unix(),
		UpdatedAt:   script.UpdatedAt.Unix(),
		Hashtags:    script.Hashtags,
	}

	// 转换场景
	if script.Scenes != nil {
		pbScript.Scenes = make([]*pb.VideoScene, len(script.Scenes))
		for i, scene := range script.Scenes {
			pbScript.Scenes[i] = &pb.VideoScene{
				Index:             int32(scene.Index),
				Duration:          int32(scene.Duration),
				ShotType:          scene.ShotType,
				VisualDescription: scene.VisualDescription,
				Narration:         scene.Narration,
				Subtitle:          scene.Subtitle,
				SoundEffects:      scene.SoundEffects,
				Transition:        scene.Transition,
				KeyElements:       scene.KeyElements,
			}
		}
	}

	// 转换钩子
	if script.Hooks != nil {
		pbScript.Hooks = &pb.VideoHooks{
			Opening: script.Hooks.Opening,
			Climax:  script.Hooks.Climax,
			Ending:  script.Hooks.Ending,
		}
	}

	return pbScript
}

// convertVideoScriptFromProto 将 protobuf 模型转换为业务模型
func convertVideoScriptFromProto(pbScript *pb.VideoScript) *models.VideoScript {
	if pbScript == nil {
		return nil
	}

	script := &models.VideoScript{
		ID:          pbScript.Id,
		ProjectID:   pbScript.ProjectId,
		ChapterID:   pbScript.ChapterId,
		Title:       pbScript.Title,
		Duration:    int(pbScript.Duration),
		Platform:    pbScript.Platform,
		Style:       pbScript.Style,
		Description: pbScript.Description,
		Status:      pbScript.Status,
		Hashtags:    pbScript.Hashtags,
	}

	// 转换时间戳
	if pbScript.CreatedAt > 0 {
		script.CreatedAt = time.Unix(pbScript.CreatedAt, 0)
	}
	if pbScript.UpdatedAt > 0 {
		script.UpdatedAt = time.Unix(pbScript.UpdatedAt, 0)
	}

	// 转换场景
	if pbScript.Scenes != nil {
		script.Scenes = make([]*models.VideoScriptScene, len(pbScript.Scenes))
		for i, pbScene := range pbScript.Scenes {
			script.Scenes[i] = &models.VideoScriptScene{
				Index:             int(pbScene.Index),
				Duration:          int(pbScene.Duration),
				ShotType:          pbScene.ShotType,
				VisualDescription: pbScene.VisualDescription,
				Narration:         pbScene.Narration,
				Subtitle:          pbScene.Subtitle,
				SoundEffects:      pbScene.SoundEffects,
				Transition:        pbScene.Transition,
				KeyElements:       pbScene.KeyElements,
			}
		}
	}

	// 转换钩子
	if pbScript.Hooks != nil {
		script.Hooks = &models.VideoHooks{
			Opening: pbScript.Hooks.Opening,
			Climax:  pbScript.Hooks.Climax,
			Ending:  pbScript.Hooks.Ending,
		}
	}

	return script
}