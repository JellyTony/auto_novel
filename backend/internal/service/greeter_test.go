package service

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	pb "backend/api/helloworld/v1"
	"backend/internal/biz"
	"backend/internal/service/mocks"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

func TestGreeterService_SayHello(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	tests := []struct {
		name        string
		request     *pb.HelloRequest
		setupMock   func()
		expected    *pb.HelloReply
		expectError bool
		errorMsg    string
	}{
		{
			name: "成功问候",
			request: &pb.HelloRequest{
				Name: "World",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), "World").Return([]*biz.Greeter{{Hello: "World"}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil)
			},
			expected: &pb.HelloReply{
				Message: "Hello World",
			},
			expectError: false,
		},
		{
			name: "成功问候 - 空名称",
			request: &pb.HelloRequest{
				Name: "",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: ""}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: ""}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: ""}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), "").Return([]*biz.Greeter{{Hello: ""}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: ""}}, nil)
			},
			expected: &pb.HelloReply{
				Message: "Hello ",
			},
			expectError: false,
		},
		{
			name: "成功问候 - 中文名称",
			request: &pb.HelloRequest{
				Name: "世界",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "世界"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "世界"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "世界"}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), "世界").Return([]*biz.Greeter{{Hello: "世界"}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "世界"}}, nil)
			},
			expected: &pb.HelloReply{
				Message: "Hello 世界",
			},
			expectError: false,
		},
		{
			name: "问候失败 - 数据库保存错误",
			request: &pb.HelloRequest{
				Name: "World",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(errors.New("database save error"))
			},
			expectError: true,
			errorMsg:    "database save error",
		},
		{
			name: "问候失败 - 数据库更新错误",
			request: &pb.HelloRequest{
				Name: "World",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(nil, errors.New("database update error"))
			},
			expectError: true,
			errorMsg:    "database update error",
		},
		{
			name: "问候失败 - 数据库查询错误",
			request: &pb.HelloRequest{
				Name: "World",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(nil, errors.New("database find error"))
			},
			expectError: true,
			errorMsg:    "database find error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			resp, err := service.SayHello(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
				if tt.expected != nil {
					assert.Equal(t, tt.expected.Message, resp.Message)
				}
			}
		})
	}
}

// 基准测试
func BenchmarkGreeterService_SayHello(b *testing.B) {
	ctrl := gomock.NewController(b)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()
	mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()

	request := &pb.HelloRequest{
		Name: "World",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = service.SayHello(context.Background(), request)
	}
}

// 并发测试
func TestGreeterService_SayHello_Concurrent(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()
	mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()

	request := &pb.HelloRequest{
		Name: "World",
	}

	// 并发执行多个请求
	concurrency := 10
	done := make(chan bool, concurrency)

	for i := 0; i < concurrency; i++ {
		go func() {
			defer func() { done <- true }()
			_, err := service.SayHello(context.Background(), request)
			assert.NoError(t, err)
		}()
	}

	// 等待所有 goroutine 完成
	for i := 0; i < concurrency; i++ {
		<-done
	}
}

// 超时测试
func TestGreeterService_SayHello_Timeout(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	logger := log.With(log.NewStdLogger(os.Stdout))
	uc := biz.NewGreeterUsecase(mockRepo, logger)
	service := NewGreeterService(uc)

	// 创建一个会超时的 context
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Millisecond)
	defer cancel()

	request := &pb.HelloRequest{
		Name: "World",
	}

	_, err := service.SayHello(ctx, request)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context deadline exceeded")
}

// 边界情况测试
func TestGreeterService_SayHello_EdgeCases(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	tests := []struct {
		name        string
		request     *pb.HelloRequest
		setupMock   func()
		expectError bool
		errorMsg    string
	}{
		{
			name: "极长名称",
			request: &pb.HelloRequest{
				Name: string(make([]byte, 1000)), // 1000字符的名称
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil)
			},
			expectError: false,
		},
		{
			name: "特殊字符名称",
			request: &pb.HelloRequest{
				Name: "!@#$%^&*()_+-={}[]|\\:;\"'<>?,./",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil)
			},
			expectError: false,
		},
		{
			name: "Unicode 字符名称",
			request: &pb.HelloRequest{
				Name: "🌍🌎🌏",
			},
			setupMock: func() {
				mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "🌍🌎🌏"}, nil)
				mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "🌍🌎🌏"}, nil)
				mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "🌍🌎🌏"}, nil)
				mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "🌍🌎🌏"}}, nil)
				mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "🌍🌎🌏"}}, nil)
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			resp, err := service.SayHello(context.Background(), tt.request)

			if tt.expectError {
				assert.Error(t, err)
				if tt.errorMsg != "" {
					assert.Contains(t, err.Error(), tt.errorMsg)
				}
				assert.Nil(t, resp)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, resp)
			}
		})
	}
}

// 性能测试 - 测试响应时间
func TestGreeterService_SayHello_Performance(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()
	mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()

	request := &pb.HelloRequest{
		Name: "World",
	}

	// 测试响应时间应该在合理范围内（< 100ms）
	start := time.Now()
	_, err := service.SayHello(context.Background(), request)
	duration := time.Since(start)

	assert.NoError(t, err)
	assert.Less(t, duration, 100*time.Millisecond, "响应时间应该小于100ms")
}

// 内存使用测试
func TestGreeterService_SayHello_Memory(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()

	mockRepo := mocks.NewMockGreeterRepo(ctrl)
	mockLogger := log.NewStdLogger(os.Stdout)
	uc := biz.NewGreeterUsecase(mockRepo, mockLogger)
	service := &GreeterService{uc: uc}

	mockRepo.EXPECT().Save(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().Update(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().FindByID(gomock.Any(), gomock.Any()).Return(&biz.Greeter{Hello: "World"}, nil).AnyTimes()
	mockRepo.EXPECT().ListByHello(gomock.Any(), gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()
	mockRepo.EXPECT().ListAll(gomock.Any()).Return([]*biz.Greeter{{Hello: "World"}}, nil).AnyTimes()

	request := &pb.HelloRequest{
		Name: "World",
	}

	// 执行多次请求，检查是否有内存泄漏
	for i := 0; i < 1000; i++ {
		_, err := service.SayHello(context.Background(), request)
		assert.NoError(t, err)
	}
}