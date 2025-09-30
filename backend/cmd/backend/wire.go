//go:build wireinject
// +build wireinject

// The build tag makes sure the stub is not built in the final build.

package main

import (
	"backend/internal/biz"
	"backend/internal/conf"
	"backend/internal/data"
	"backend/internal/server"
	"backend/internal/service"
	"backend/internal/pkg/llm"
	"backend/internal/pkg/eino"
	"backend/internal/pkg/vector"
	"backend/internal/agent/orchestrator"

	"github.com/go-kratos/kratos/v2"
	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
)

// wireApp init kratos application.
func wireApp(*conf.Server, *conf.Data, *conf.AI, log.Logger) (*kratos.App, func(), error) {
	panic(wire.Build(server.ProviderSet, data.ProviderSet, biz.ProviderSet, service.ProviderSet, llm.ProviderSet, eino.ProviderSet, vector.ProviderSet, orchestrator.ProviderSet, newApp))
}
