package orchestrator

import (
	"backend/internal/pkg/llm"
	"github.com/google/wire"
)

// ProviderSet is orchestrator providers.
var ProviderSet = wire.NewSet(NewOrchestratorAgentProvider)

// NewOrchestratorAgentProvider 创建主调度代理（用于依赖注入）
func NewOrchestratorAgentProvider(llmClient llm.LLMClient) *OrchestratorAgent {
	return NewOrchestratorAgent(llmClient)
}