package llm

import (
	"github.com/google/wire"
)

// ProviderSet is llm providers.
var ProviderSet = wire.NewSet(NewRealLLMClient)