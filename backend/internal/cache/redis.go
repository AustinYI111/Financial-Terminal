// Package cache provides a Redis-backed cache layer.
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache wraps a Redis client with helper methods.
type Cache struct {
	client *redis.Client
}

// New creates a new Redis cache client.
func New(host, port, password string) (*Cache, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis ping: %w", err)
	}
	return &Cache{client: rdb}, nil
}

// Set stores a value in cache with an expiration duration.
func (c *Cache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	b, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal value: %w", err)
	}
	return c.client.Set(ctx, key, b, ttl).Err()
}

// Get retrieves a value from cache and unmarshals it into dest.
// Returns (false, nil) when the key does not exist.
func (c *Cache) Get(ctx context.Context, key string, dest interface{}) (bool, error) {
	b, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("redis get: %w", err)
	}
	if err := json.Unmarshal(b, dest); err != nil {
		return false, fmt.Errorf("unmarshal value: %w", err)
	}
	return true, nil
}

// Delete removes a key from cache.
func (c *Cache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

// Close closes the Redis connection.
func (c *Cache) Close() error {
	return c.client.Close()
}
