# App Router API Tests

This document describes the unit tests implemented for Next.js App Router API routes.

## Overview

Unit tests have been added for the Next.js 14 App Router API endpoints in the `app/api/` directory. These tests complement the existing Pages API tests and ensure comprehensive test coverage for the application.

## Test Files

### 1. `__tests__/app-api/upload.test.ts`

Tests for the upload API route (`app/api/upload/route.ts`).

**POST endpoint tests (11 tests):**
- Authentication validation (unauthorized requests, invalid tokens)
- Profile existence validation
- Sample type validation
- File size validation (max 20MB)
- Rate limiting enforcement
- Successful text content upload
- Cloudinary file upload with `fileData`
- Database error handling

**GET endpoint tests:**
- Authentication validation
- Fetching user samples with analyses
- Database error handling

**Coverage:**
- Authentication and authorization
- Input validation
- Rate limiting
- File uploads (text and binary via Cloudinary)
- Database operations
- Error handling

### 2. `__tests__/app-api/analyze.test.ts`

Tests for the analyze API route (`app/api/analyze/route.ts`).

**POST endpoint tests (9 tests):**
- Request validation (missing `analysis_id`)
- Analysis existence validation
- Skip logic for already processing/done analyses
- Sample not found error handling
- Successful AI analysis execution
- Retry logic on AI failures
- Max retries and error marking
- Database error handling

**GET endpoint tests (7 tests):**
- Request validation (missing `analysis_id`)
- Analysis existence validation
- Return analysis results with all metadata
- Return processing status for queued analyses
- Database error handling

**Coverage:**
- Request validation
- Analysis workflow (queued → processing → done)
- AI integration with mock responses
- Retry logic (up to 3 attempts)
- Status checking
- Database operations
- Error handling

## Test Configuration

### Jest Configuration

The tests use a specialized Jest configuration that runs App Router API tests in a Node environment instead of the default JSDOM environment:

```javascript
/**
 * @jest-environment node
 */
```

This docblock at the top of each test file tells Jest to use the Node environment, which provides the Web API globals (`Request`, `Response`, `Headers`, etc.) needed by Next.js App Router routes.

### Mocking Strategy

Tests mock external dependencies to ensure isolation:

- **Supabase**: Mock database operations and authentication
- **Rate Limiting**: Mock rate limit checks
- **Cloudinary**: Mock file uploads
- **AI Services**: Mock analysis functions

### Test Patterns

The tests follow patterns established by existing Pages API tests:

1. **Setup**: Clear all mocks before each test
2. **Arrange**: Create mock requests and set up mock responses
3. **Act**: Call the API route handler
4. **Assert**: Verify status codes, response data, and mock calls

## Running Tests

### Run all app-api tests:
```bash
npm test -- __tests__/app-api
```

### Run specific test file:
```bash
npm test -- __tests__/app-api/upload.test.ts
npm test -- __tests__/app-api/analyze.test.ts
```

### Run all tests (excluding fuzz and e2e):
```bash
npm test -- --testPathIgnorePatterns="fuzz|e2e"
```

## Test Results

All tests pass successfully:
- **27 new tests** added for App Router API routes
- **11 tests** for upload endpoint (POST + GET)
- **16 tests** for analyze endpoint (POST + GET)
- **0 security vulnerabilities** detected by CodeQL

## Differences from Pages API

The App Router API routes differ from Pages API routes in several ways:

1. **Request/Response Objects**: Use Next.js `NextRequest`/`NextResponse` instead of Node.js `req`/`res`
2. **Export Pattern**: Export named functions (`POST`, `GET`) instead of a default handler
3. **Environment**: Require Node environment with Web API globals
4. **URL Parsing**: Use `new URL(req.url)` to access search parameters
5. **JSON Parsing**: Await `req.json()` instead of accessing `req.body`

## Future Improvements

Potential enhancements for the test suite:

1. Add integration tests that test the full upload → analyze workflow
2. Add tests for GitHub-related API endpoints if they exist in app/api
3. Add tests for other API routes (stripe, messages, professional, etc.)
4. Implement test data factories to reduce boilerplate
5. Add snapshot testing for complex response structures
6. Add performance benchmarks for API routes

## Related Documentation

- [TESTING.md](./TESTING.md) - General testing guide
- [TASKS.md](./TASKS.md) - Task tracking and project roadmap
- [jest.config.js](./jest.config.js) - Jest configuration
