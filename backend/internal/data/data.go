package data

import (
	"os"
	"path/filepath"

	"backend/internal/conf"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/google/wire"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// ProviderSet is data providers.
var ProviderSet = wire.NewSet(NewData, NewGreeterRepo, NewVideoScriptRepo, NewNovelRepo)

// Data .
type Data struct {
	db *gorm.DB
}

// NewData .
func NewData(c *conf.Data, l log.Logger) (*Data, func(), error) {
	helper := log.NewHelper(l)

	// 确保数据目录存在
	dbPath := c.Database.Source
	if err := os.MkdirAll(filepath.Dir(dbPath), 0755); err != nil {
		helper.Errorf("failed to create database directory: %v", err)
		return nil, nil, err
	}

	// 连接SQLite数据库
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		helper.Errorf("failed to connect database: %v", err)
		return nil, nil, err
	}

	// 自动迁移数据库表结构
	if err := autoMigrate(db); err != nil {
		helper.Errorf("failed to migrate database: %v", err)
		return nil, nil, err
	}

	helper.Info("database connected successfully")

	cleanup := func() {
		helper.Info("closing the data resources")
		if sqlDB, err := db.DB(); err == nil {
			sqlDB.Close()
		}
	}

	return &Data{db: db}, cleanup, nil
}

// autoMigrate 自动迁移数据库表结构
func autoMigrate(db *gorm.DB) error {
	// 自动迁移表结构
	if err := db.AutoMigrate(
		&NovelProject{},
		&Chapter{},
		&VideoScript{},
	); err != nil {
		return err
	}

	// 创建索引
	if err := createIndexes(db); err != nil {
		return err
	}

	return nil
}

// createIndexes 创建数据库索引
func createIndexes(db *gorm.DB) error {
	// 创建 NovelProject 索引
	project := &NovelProject{}
	if err := project.CreateIndexes(db); err != nil {
		return err
	}

	// 创建 Chapter 索引
	chapter := &Chapter{}
	if err := chapter.CreateIndexes(db); err != nil {
		return err
	}

	// 创建 VideoScript 索引
	videoScript := &VideoScript{}
	if err := videoScript.CreateIndexes(db); err != nil {
		return err
	}

	return nil
}
