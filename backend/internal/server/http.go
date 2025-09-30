package server

import (
	"context"

	v1 "backend/api/helloworld/v1"
	novelv1 "backend/api/novel/v1"
	videoscriptv1 "backend/api/video_script/v1"
	"backend/internal/conf"
	"backend/internal/service"

	"github.com/go-kratos/kratos/v2/middleware"
	"github.com/go-kratos/kratos/v2/transport"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/go-kratos/kratos/v2/middleware/recovery"
	"github.com/go-kratos/kratos/v2/transport/http"
	khttp "github.com/go-kratos/kratos/v2/transport/http"
)

func CORS() middleware.Middleware {
	return func(next middleware.Handler) middleware.Handler {
		return func(ctx context.Context, req interface{}) (interface{}, error) {
			if tr, ok := transport.FromServerContext(ctx); ok {
				if ht, ok1 := tr.(khttp.Transporter); ok1 {
					origin := "*"
					if ht.RequestHeader().Get("Origin") != "" {
						origin = ht.RequestHeader().Get("Origin")
					}

					ht.ReplyHeader().Set("Access-Control-Allow-Origin", origin)
					ht.ReplyHeader().Set("Vary", "Origin")
					ht.ReplyHeader().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
					ht.ReplyHeader().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
				}
			}
			return next(ctx, req)
		}
	}
}

// NewHTTPServer new an HTTP server.
func NewHTTPServer(c *conf.Server, greeter *service.GreeterService, videoScript *service.VideoScriptService, novel *service.NovelService, logger log.Logger) *http.Server {
	var opts = []http.ServerOption{
		http.Middleware(
			recovery.Recovery(),
			CORS(),
		),
	}
	if c.Http.Network != "" {
		opts = append(opts, http.Network(c.Http.Network))
	}
	if c.Http.Addr != "" {
		opts = append(opts, http.Address(c.Http.Addr))
	}
	if c.Http.Timeout != nil {
		opts = append(opts, http.Timeout(c.Http.Timeout.AsDuration()))
	}
	srv := http.NewServer(opts...)

	// Add global OPTIONS handler for CORS preflight requests
	srv.Route("/").OPTIONS("/*", func(ctx http.Context) error {
		// The CORS middleware will handle setting the headers
		// Just return 200 OK for preflight requests
		return ctx.Result(200, nil)
	})

	v1.RegisterGreeterHTTPServer(srv, greeter)
	videoscriptv1.RegisterVideoScriptServiceHTTPServer(srv, videoScript)
	novelv1.RegisterNovelServiceHTTPServer(srv, novel)
	return srv
}
