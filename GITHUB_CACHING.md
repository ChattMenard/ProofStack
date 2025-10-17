# GitHub API Caching Implementation

## Overview
This implementation uses **ETag-based conditional requests** to dramatically reduce GitHub API rate limit consumption while maintaining fresh data.

## How It Works

### 1. ETag Caching
- GitHub API returns an `ETag` header with each response (a hash of the content)
- When making subsequent requests, we send the ETag in an `If-None-Match` header
- If content hasn't changed, GitHub returns `304 Not Modified` **without consuming rate limit quota**
- If content has changed, GitHub returns `200 OK` with new data and new ETag

### 2. Architecture

#### Database Schema (`github_api_cache` table)
```sql
- user_id: references auth.users (RLS isolation)
- url: GitHub API endpoint URL
- etag: ETag value from GitHub response
- response_data: Cached JSON response (JSONB)
- cached_at: When response was cached
- expires_at: Cache expiration timestamp
- hit_count: Number of cache hits (analytics)
```

#### Cache Service (`lib/githubCache.ts`)
- `getCachedResponse()`: Retrieves cached response if not expired
- `setCachedResponse()`: Stores response with ETag and expiration
- `fetchGitHubWithCache()`: Main function - handles conditional requests
- `clearUserCache()`: Clear all cache for a user
- `clearExpiredCache()`: Cleanup job for expired entries
- `getCacheStats()`: Analytics on cache performance

### 3. Updated Endpoints

#### `/api/github/repos` (Repository List)
- **Cache TTL**: 60 minutes
- **Why**: Repository lists change infrequently
- **Benefit**: Users browsing repos won't consume API quota on refresh

#### `/api/github/verify` (Ownership Verification)
- **Cache TTL**: 5 minutes
- **Why**: Verification files should be detected quickly
- **Benefit**: Reduces quota consumption during multi-attempt verification

## Rate Limit Savings

### Before Caching
- Authenticated user: 5,000 requests/hour
- Each page view of repos consumes 1 request
- Power users could hit limits

### After Caching
- 304 responses **do NOT count** against rate limit
- Only changed data consumes quota
- Typical scenario: 90% cache hit rate = 10x effective limit increase

### Example
```
User refreshes /repos page 50 times in an hour:
- Without caching: 50 requests consumed
- With caching: 1 request consumed (first), 49 cache hits (304s)
- Savings: 98% reduction
```

## Cache Headers

Responses include diagnostic headers:
```http
X-Cache: HIT | MISS
X-RateLimit-Remaining: <number>
```

## Maintenance

### Automatic Cleanup
The database includes a trigger that runs cleanup on cache updates:
```sql
CREATE TRIGGER cleanup_expired_cache_trigger
  AFTER INSERT OR UPDATE ON github_api_cache
  EXECUTE FUNCTION cleanup_expired_github_cache();
```

### Manual Cleanup
```typescript
import { clearExpiredCache, clearUserCache } from '@/lib/githubCache'

// Clear all expired entries
await clearExpiredCache()

// Clear specific user's cache
await clearUserCache(userId)
```

## Security

### Row Level Security (RLS)
- Users can only access their own cached responses
- Cache isolation prevents data leakage
- Admin access for cleanup operations

### Token Safety
- GitHub tokens are NOT stored in cache
- Tokens passed at request time only
- Cache stores only public response data

## Performance

### Indexes
```sql
CREATE INDEX idx_github_cache_user ON github_api_cache(user_id);
CREATE INDEX idx_github_cache_expires ON github_api_cache(expires_at);
CREATE INDEX idx_github_cache_url ON github_api_cache(url);
```

### Query Optimization
- Composite unique key on `(user_id, url)` prevents duplicate caches
- Expired entries filtered by index-backed query
- JSONB storage for efficient response serialization

## Monitoring

### Cache Stats
```typescript
const stats = await getCacheStats(userId)
// Returns: { totalEntries, hitCount, avgAge, oldestEntry }
```

### Rate Limit Tracking
Every cached request logs:
```
GitHub cache MISS: <url>
Rate limit remaining: <count>
```

## Future Enhancements

1. **Background Refresh**: Proactively refresh expiring caches
2. **Partial Response Caching**: Cache pagination separately
3. **Cache Warming**: Pre-populate common queries
4. **Analytics Dashboard**: Visualize cache performance
5. **Smart TTL**: Adjust TTL based on update frequency

## Migration

Apply the schema:
```bash
# Development
supabase migration up

# Production
supabase db push
```

## Testing

Test cache behavior:
```bash
# First request (cache miss)
curl http://localhost:3000/api/github/repos
# Response headers: X-Cache: MISS

# Second request (cache hit)
curl http://localhost:3000/api/github/repos
# Response headers: X-Cache: HIT
```

## References

- [GitHub API Conditional Requests](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#conditional-requests)
- [HTTP ETags (RFC 7232)](https://datatracker.ietf.org/doc/html/rfc7232#section-2.3)
- [GitHub Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
