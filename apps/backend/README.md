# Backend API

## Rate Limiting

The API implements rate limiting to ensure stability and security.

### Public Endpoints
- **Limit:** 5 requests per 15 minutes per IP address.
- **Headers:**
  - `X-RateLimit-Limit`: The maximum number of requests allowed in the window.
  - `X-RateLimit-Remaining`: The number of requests remaining in the current window.
  - `X-RateLimit-Reset`: The time at which the current window resets (in Unix seconds).
- **Error Response:** Returns `429 Too Many Requests` when exceeded, with a `Retry-After` header indicating seconds to wait.

### API Key Protected Endpoints
- **Limit:** 100 requests per 1 minute per API key.
- **Headers:**
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: Number of requests remaining.
  - `X-RateLimit-Reset`: Window reset time.
- **Error Response:** Returns `429 Too Many Requests` when exceeded, with a `Retry-After` header.

## Testing

To run the rate limiting tests:
```bash
cd apps/backend
$env:NODE_OPTIONS='--experimental-vm-modules'; npx jest tests/rate-limiting.test.ts
```
