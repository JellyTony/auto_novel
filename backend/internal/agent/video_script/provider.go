package video_script

import (
	"github.com/google/wire"
)

// ProviderSet is video script agent providers.
var ProviderSet = wire.NewSet(NewEinoVideoScriptAgent)