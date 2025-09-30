package orchestrator

import (
	"backend/internal/pkg/llm"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
)

// ProviderSet is orchestrator providers.
var ProviderSet = wire.NewSet(NewOrchestratorAgentProvider)

// NewOrchestratorAgentProvider 创建主调度代理（用于依赖注入）
func NewOrchestratorAgentProvider(llmClient llm.LLMClient, logger log.Logger) *OrchestratorAgent {
	return NewOrchestratorAgent(llmClient, logger)
}