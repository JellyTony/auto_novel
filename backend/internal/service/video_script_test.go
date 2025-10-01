package service

import (
	"context"
	"os"
	"testing"
	"time"

	pb "backend/api/video_script/v1"
	"backend/internal/agent/video_script"
	"backend/internal/biz"
	"backend/internal/pkg/models"
	"backend/internal/service/mocks"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

func TestVideoScriptService_GenerateVideoScript(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := mocks.NewMockVideoScriptAgent(ctrl)
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	tests := []struct {
		name      string
		request   *pb.GenerateVideoScriptRequest
		setupMock func()
		wantErr   bool
		errorMsg  string
	}{
		{
			name: "成功生成视频脚本",
			request: &pb.GenerateVideoScriptRequest{
				ProjectId:      "test-project-id",
				ChapterId:      "chapter-1",
				ChapterTitle:   "Test Chapter",
				ChapterContent: "This is test chapter content for video script generation.",
				Platform:       "douyin",
				Duration:       60,
				Style:          "dramatic",
				Requirements:   "Test video script generation",
			},
			setupMock: func() {
				mockAgent.EXPECT().GenerateVideoScript(gomock.Any(), gomock.Any()).Return(&video_script.GenerateVideoScriptResponse{
					VideoScript: &models.VideoScript{
						ID:          "script-id",
						ProjectID:   "test-project-id",
						Title:       "测试视频脚本",
						Platform:    "douyin",
						Duration:    60,
						Style:       "dramatic",
						Description: "生成一个引人入胜的短视频脚本",
						Status:      "generated",
					},
				}, nil)
				mockRepo.EXPECT().SaveVideoScript(gomock.Any(), gomock.Any()).Return(&models.VideoScript{
					ID:          "script-id",
					ProjectID:   "test-project-id",
					Title:       "测试视频脚本",
					Platform:    "douyin",
					Duration:    60,
					Style:       "dramatic",
					Description: "生成一个引人入胜的短视频脚本",
					Status:      "generated",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "项目ID为空",
			request: &pb.GenerateVideoScriptRequest{
				ProjectId:      "",
				ChapterId:      "chapter-1",
				ChapterTitle:   "Test Chapter",
				ChapterContent: "This is test chapter content.",
				Platform:       "douyin",
				Duration:       60,
				Style:          "dramatic",
				Requirements:   "Test requirements",
			},
			setupMock: func() {},
			wantErr:   true,
			errorMsg:  "项目ID不能为空",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			ctx := context.Background()
			resp, err := service.GenerateVideoScript(ctx, tt.request)

			if tt.wantErr {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.VideoScript)
			}
		})
	}
}

func TestVideoScriptService_GetVideoScript(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := &video_script.EinoVideoScriptAgent{}
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	tests := []struct {
		name      string
		request   *pb.GetVideoScriptRequest
		setupMock func()
		wantErr   bool
		errorMsg  string
	}{
		{
			name: "成功获取视频脚本",
			request: &pb.GetVideoScriptRequest{
				ScriptId: "script-id",
			},
			setupMock: func() {
				mockRepo.EXPECT().GetVideoScript(gomock.Any(), "script-id").Return(&models.VideoScript{
					ID:          "script-id",
					ProjectID:   "test-project-id",
					Title:       "测试视频脚本",
					Platform:    "douyin",
					Duration:    60,
					Style:       "dramatic",
					Description: "测试描述",
					Status:      "generated",
					CreatedAt:   time.Now(),
					UpdatedAt:   time.Now(),
				}, nil)
			},
			wantErr: false,
		},
		{
			name: "脚本ID为空",
			request: &pb.GetVideoScriptRequest{
				ScriptId: "",
			},
			setupMock: func() {},
			wantErr:   true,
			errorMsg:  "脚本ID不能为空",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			ctx := context.Background()
			resp, err := service.GetVideoScript(ctx, tt.request)

			if tt.wantErr {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.VideoScript)
			}
		})
	}
}

func TestVideoScriptService_ListVideoScripts(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := &video_script.EinoVideoScriptAgent{}
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	tests := []struct {
		name      string
		request   *pb.ListVideoScriptsRequest
		setupMock func()
		wantErr   bool
		errorMsg  string
	}{
		{
			name: "成功获取视频脚本列表",
			request: &pb.ListVideoScriptsRequest{
				ProjectId: "test-project-id",
				Page:      1,
				PageSize:  10,
			},
			setupMock: func() {
				scripts := []*models.VideoScript{
					{
						ID:          "script-1",
						ProjectID:   "test-project-id",
						Title:       "脚本1",
						Platform:    "douyin",
						Duration:    60,
						Style:       "dramatic",
						Description: "描述1",
						Status:      "generated",
						CreatedAt:   time.Now(),
						UpdatedAt:   time.Now(),
					},
				}
				mockRepo.EXPECT().ListVideoScripts(gomock.Any(), "test-project-id", 1, 10).Return(scripts, 1, nil)
			},
			wantErr: false,
		},
		{
			name: "项目ID为空",
			request: &pb.ListVideoScriptsRequest{
				ProjectId: "",
				Page:      1,
				PageSize:  10,
			},
			setupMock: func() {},
			wantErr:   true,
			errorMsg:  "项目ID不能为空",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			ctx := context.Background()
			resp, err := service.ListVideoScripts(ctx, tt.request)

			if tt.wantErr {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				assert.NotNil(t, resp.Scripts)
			}
		})
	}
}

// 基准测试
func BenchmarkVideoScriptService_GenerateVideoScript(b *testing.B) {
	ctrl := gomock.NewController(b)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := mocks.NewMockVideoScriptAgent(ctrl)
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	// Mock agent 期望
	mockAgent.EXPECT().GenerateVideoScript(gomock.Any(), gomock.Any()).Return(&video_script.GenerateVideoScriptResponse{
		VideoScript: &models.VideoScript{
			ID:        "script-id",
			ProjectID: "test-project-id",
			Title:     "测试视频脚本",
			Platform:  "douyin",
			Duration:  60,
			Style:     "dramatic",
			Status:    "generated",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}, nil).AnyTimes()

	mockRepo.EXPECT().SaveVideoScript(gomock.Any(), gomock.Any()).Return(&models.VideoScript{
		ID:        "script-id",
		ProjectID: "test-project-id",
		Title:     "测试视频脚本",
		Platform:  "douyin",
		Duration:  60,
		Style:     "dramatic",
		Status:    "generated",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil).AnyTimes()

	req := &pb.GenerateVideoScriptRequest{
		ProjectId:      "test-project-id",
		ChapterId:      "chapter-1",
		ChapterTitle:   "Test Chapter",
		ChapterContent: "This is test chapter content.",
		Platform:       "douyin",
		Duration:       60,
		Style:          "dramatic",
		Requirements:   "Test requirements",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.GenerateVideoScript(context.Background(), req)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// 并发测试
func TestVideoScriptService_GenerateVideoScript_Concurrent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := mocks.NewMockVideoScriptAgent(ctrl)
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	// Mock agent 期望
	mockAgent.EXPECT().GenerateVideoScript(gomock.Any(), gomock.Any()).Return(&video_script.GenerateVideoScriptResponse{
		VideoScript: &models.VideoScript{
			ID:        "script-id",
			ProjectID: "test-project-id",
			Title:     "测试视频脚本",
			Platform:  "douyin",
			Duration:  60,
			Style:     "dramatic",
			Status:    "generated",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}, nil).AnyTimes()

	mockRepo.EXPECT().SaveVideoScript(gomock.Any(), gomock.Any()).Return(&models.VideoScript{
		ID:        "script-id",
		ProjectID: "test-project-id",
		Title:     "测试视频脚本",
		Platform:  "douyin",
		Duration:  60,
		Style:     "dramatic",
		Status:    "generated",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil).AnyTimes()

	req := &pb.GenerateVideoScriptRequest{
		ProjectId:      "test-project-id",
		ChapterId:      "chapter-1",
		ChapterTitle:   "Test Chapter",
		ChapterContent: "This is test chapter content.",
		Platform:       "douyin",
		Duration:       60,
		Style:          "dramatic",
		Requirements:   "Test requirements",
	}

	// 并发执行
	const numGoroutines = 10
	done := make(chan bool, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		go func() {
			defer func() { done <- true }()
			_, err := service.GenerateVideoScript(context.Background(), req)
			assert.NoError(t, err)
		}()
	}

	// 等待所有 goroutine 完成
	for i := 0; i < numGoroutines; i++ {
		<-done
	}
}

// 超时测试
func TestVideoScriptService_GenerateVideoScript_Timeout(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := mocks.NewMockVideoScriptAgent(ctrl)
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	// Mock agent 期望 - 模拟超时情况
	mockAgent.EXPECT().GenerateVideoScript(gomock.Any(), gomock.Any()).DoAndReturn(
		func(ctx context.Context, req *video_script.GenerateVideoScriptRequest) (*video_script.GenerateVideoScriptResponse, error) {
			// 等待 context 超时
			<-ctx.Done()
			return nil, ctx.Err()
		},
	)

	req := &pb.GenerateVideoScriptRequest{
		ProjectId:      "test-project-id",
		ChapterId:      "chapter-1",
		ChapterTitle:   "Test Chapter",
		ChapterContent: "This is test chapter content.",
		Platform:       "douyin",
		Duration:       60,
		Style:          "dramatic",
		Requirements:   "Test requirements",
	}

	// 创建一个会超时的 context
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	_, err := service.GenerateVideoScript(ctx, req)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context deadline exceeded")
}

// 边界情况测试
func TestVideoScriptService_GenerateVideoScript_EdgeCases(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockVideoScriptRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewVideoScriptUseCase(mockRepo, logger)
	
	// 创建 mock video agent
	mockAgent := mocks.NewMockVideoScriptAgent(ctrl)
	
	service := NewVideoScriptService(uc, mockAgent, logger)

	tests := []struct {
		name    string
		request *pb.GenerateVideoScriptRequest
		wantErr bool
	}{
		{
			name: "极长的章节内容",
			request: &pb.GenerateVideoScriptRequest{
				ProjectId:      "test-project-id",
				ChapterId:      "chapter-1",
				ChapterTitle:   "Test Chapter",
				ChapterContent: string(make([]byte, 10000)), // 10KB 内容
				Platform:       "douyin",
				Duration:       60,
				Style:          "dramatic",
				Requirements:   "Test requirements",
			},
			wantErr: false,
		},
		{
			name: "特殊字符内容",
			request: &pb.GenerateVideoScriptRequest{
				ProjectId:      "test-project-id",
				ChapterId:      "chapter-1",
				ChapterTitle:   "特殊字符测试 !@#$%^&*()",
				ChapterContent: "包含特殊字符的内容：\n\t\"引号\"、'单引号'、<标签>等",
				Platform:       "douyin",
				Duration:       60,
				Style:          "dramatic",
				Requirements:   "Test requirements",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if !tt.wantErr {
				// Mock agent 期望
				mockAgent.EXPECT().GenerateVideoScript(gomock.Any(), gomock.Any()).Return(&video_script.GenerateVideoScriptResponse{
					VideoScript: &models.VideoScript{
						ID:        "script-id",
						ProjectID: "test-project-id",
						Title:     "测试视频脚本",
						Platform:  "douyin",
						Duration:  60,
						Style:     "dramatic",
						Status:    "generated",
						CreatedAt: time.Now(),
						UpdatedAt: time.Now(),
					},
				}, nil)
				
				// Mock repository 期望
				mockRepo.EXPECT().SaveVideoScript(gomock.Any(), gomock.Any()).Return(&models.VideoScript{
					ID:        "script-id",
					ProjectID: "test-project-id",
					Title:     "测试视频脚本",
					Platform:  "douyin",
					Duration:  60,
					Style:     "dramatic",
					Status:    "generated",
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}, nil)
			}

			_, err := service.GenerateVideoScript(context.Background(), tt.request)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}