package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/AustinYI111/financial-terminal/backend/internal/api"
	"github.com/AustinYI111/financial-terminal/backend/internal/cache"
	"github.com/AustinYI111/financial-terminal/backend/internal/finnhub"
	"github.com/AustinYI111/financial-terminal/backend/internal/middleware"
	"github.com/AustinYI111/financial-terminal/backend/internal/repository"
	ws "github.com/AustinYI111/financial-terminal/backend/internal/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load .env if present
	_ = godotenv.Load()

	// Configure logging
	level, err := zerolog.ParseLevel(getEnv("LOG_LEVEL", "info"))
	if err != nil {
		level = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(level)
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	// Build dependencies
	finnhubClient := finnhub.New(mustEnv("FINNHUB_API_KEY"))

	redisCache, err := cache.New(
		getEnv("REDIS_HOST", "localhost"),
		getEnv("REDIS_PORT", "6379"),
		getEnv("REDIS_PASSWORD", ""),
	)
	if err != nil {
		log.Fatal().Err(err).Msg("connect to Redis")
	}
	defer func() {
		if closeErr := redisCache.Close(); closeErr != nil {
			log.Warn().Err(closeErr).Msg("close redis")
		}
	}()

	dsn := fmt.Sprintf(
		"host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		getEnv("POSTGRES_HOST", "localhost"),
		getEnv("POSTGRES_PORT", "5432"),
		getEnv("POSTGRES_DB", "financial_terminal"),
		getEnv("POSTGRES_USER", "ftuser"),
		getEnv("POSTGRES_PASSWORD", "ftpassword"),
	)
	db, err := repository.New(context.Background(), dsn)
	if err != nil {
		log.Fatal().Err(err).Msg("connect to TimescaleDB")
	}
	defer db.Close()

	hub := ws.NewHub()
	go hub.Run()

	handler := api.New(finnhubClient, redisCache, db, hub)
	router := handler.Router()

	// Apply middleware
	finalHandler := middleware.Logger(middleware.CORS(router))

	addr := fmt.Sprintf("%s:%s",
		getEnv("SERVER_HOST", "0.0.0.0"),
		getEnv("SERVER_PORT", "8080"),
	)
	srv := &http.Server{
		Addr:         addr,
		Handler:      finalHandler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info().Str("addr", addr).Msg("starting server")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server error")
		}
	}()

	<-quit
	log.Info().Msg("shutting down server…")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("server shutdown")
	}
	log.Info().Msg("server stopped")
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatal().Str("key", key).Msg("required env var not set")
	}
	return v
}
