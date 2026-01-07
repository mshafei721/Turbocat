# Turbocat API Authentication Guide

This guide explains how to authenticate with the Turbocat API and manage access tokens.

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
- [JWT Token Flow](#jwt-token-flow)
- [API Key Authentication](#api-key-authentication)
- [Code Examples](#code-examples)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The Turbocat API uses two authentication methods:

1. **JWT Bearer Tokens** - For user authentication (web/mobile apps)
2. **API Keys** - For service-to-service authentication (backend integrations)

Most endpoints require authentication. Endpoints that are publicly accessible are explicitly marked in the API documentation.

## Authentication Methods

### JWT Bearer Token

JWT (JSON Web Token) is the primary authentication method for user-facing applications. After logging in, you receive two tokens:

| Token | Purpose | Expiration |
|-------|---------|------------|
| Access Token | Used for API requests | 15 minutes |
| Refresh Token | Used to get new access tokens | 7 days |

**Header Format:**
```
Authorization: Bearer <access_token>
```

### API Key

API keys are used for service-to-service authentication. They are ideal for:
- Backend integrations
- Automated scripts
- CI/CD pipelines

**Header Format:**
```
X-API-Key: <your_api_key>
```

## JWT Token Flow

### Step 1: Register or Login

**Register a new user:**

```bash
curl -X POST https://api.turbocat.dev/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

**Login an existing user:**

```bash
curl -X POST https://api.turbocat.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "accessTokenExpiresAt": "2024-01-15T10:45:00.000Z",
      "refreshTokenExpiresAt": "2024-01-22T10:30:00.000Z"
    }
  },
  "requestId": "abc123"
}
```

### Step 2: Make Authenticated Requests

Use the access token in the `Authorization` header:

```bash
curl -X GET https://api.turbocat.dev/api/v1/agents \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Refresh Expired Tokens

When the access token expires (after 15 minutes), use the refresh token to get a new one:

```bash
curl -X POST https://api.turbocat.dev/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessTokenExpiresAt": "2024-01-15T11:00:00.000Z"
  },
  "requestId": "def456"
}
```

### Step 4: Logout

To invalidate your session:

```bash
curl -X POST https://api.turbocat.dev/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## API Key Authentication

### Generating an API Key

API keys can be generated through the Turbocat dashboard or via the API (coming soon).

### Using API Keys

Include the API key in the `X-API-Key` header:

```bash
curl -X GET https://api.turbocat.dev/api/v1/agents \
  -H "X-API-Key: tk_live_abc123xyz789"
```

### API Key Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** to store keys
3. **Rotate keys regularly** (recommended: every 90 days)
4. **Use different keys** for development and production
5. **Revoke compromised keys** immediately

## Code Examples

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const API_BASE = 'https://api.turbocat.dev/api/v1';

class TurbocatClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string): Promise<void> {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password,
    });

    this.accessToken = response.data.data.tokens.accessToken;
    this.refreshToken = response.data.data.tokens.refreshToken;
  }

  async request<T>(method: string, path: string, data?: any): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${API_BASE}${path}`,
        data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.request(method, path, data);
      }
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const response = await axios.post(`${API_BASE}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });
    this.accessToken = response.data.data.accessToken;
  }

  async getAgents() {
    return this.request('GET', '/agents');
  }

  async createAgent(data: any) {
    return this.request('POST', '/agents', data);
  }
}

// Usage
const client = new TurbocatClient();
await client.login('user@example.com', 'SecurePass123!');
const agents = await client.getAgents();
```

### Python (Requests)

```python
import requests
from datetime import datetime

class TurbocatClient:
    BASE_URL = 'https://api.turbocat.dev/api/v1'

    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.access_token_expires_at = None

    def login(self, email: str, password: str) -> dict:
        response = requests.post(
            f'{self.BASE_URL}/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()
        data = response.json()['data']

        self.access_token = data['tokens']['accessToken']
        self.refresh_token = data['tokens']['refreshToken']
        self.access_token_expires_at = datetime.fromisoformat(
            data['tokens']['accessTokenExpiresAt'].replace('Z', '+00:00')
        )

        return data['user']

    def _get_headers(self) -> dict:
        return {'Authorization': f'Bearer {self.access_token}'}

    def _refresh_if_needed(self):
        if datetime.now().timestamp() > self.access_token_expires_at.timestamp():
            self._refresh_access_token()

    def _refresh_access_token(self):
        response = requests.post(
            f'{self.BASE_URL}/auth/refresh',
            json={'refreshToken': self.refresh_token}
        )
        response.raise_for_status()
        data = response.json()['data']

        self.access_token = data['accessToken']
        self.access_token_expires_at = datetime.fromisoformat(
            data['accessTokenExpiresAt'].replace('Z', '+00:00')
        )

    def get_agents(self, page: int = 1, page_size: int = 20) -> dict:
        self._refresh_if_needed()
        response = requests.get(
            f'{self.BASE_URL}/agents',
            headers=self._get_headers(),
            params={'page': page, 'pageSize': page_size}
        )
        response.raise_for_status()
        return response.json()['data']

    def create_agent(self, name: str, agent_type: str, **kwargs) -> dict:
        self._refresh_if_needed()
        response = requests.post(
            f'{self.BASE_URL}/agents',
            headers=self._get_headers(),
            json={'name': name, 'type': agent_type, **kwargs}
        )
        response.raise_for_status()
        return response.json()['data']


# Usage
client = TurbocatClient()
client.login('user@example.com', 'SecurePass123!')
agents = client.get_agents()
print(agents)
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type TurbocatClient struct {
    BaseURL            string
    AccessToken        string
    RefreshToken       string
    AccessTokenExpires time.Time
    httpClient         *http.Client
}

func NewTurbocatClient() *TurbocatClient {
    return &TurbocatClient{
        BaseURL:    "https://api.turbocat.dev/api/v1",
        httpClient: &http.Client{Timeout: 10 * time.Second},
    }
}

func (c *TurbocatClient) Login(email, password string) error {
    payload := map[string]string{
        "email":    email,
        "password": password,
    }

    body, _ := json.Marshal(payload)
    resp, err := c.httpClient.Post(
        c.BaseURL+"/auth/login",
        "application/json",
        bytes.NewBuffer(body),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    var result struct {
        Data struct {
            Tokens struct {
                AccessToken        string `json:"accessToken"`
                RefreshToken       string `json:"refreshToken"`
                AccessTokenExpires string `json:"accessTokenExpiresAt"`
            } `json:"tokens"`
        } `json:"data"`
    }

    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return err
    }

    c.AccessToken = result.Data.Tokens.AccessToken
    c.RefreshToken = result.Data.Tokens.RefreshToken
    c.AccessTokenExpires, _ = time.Parse(time.RFC3339, result.Data.Tokens.AccessTokenExpires)

    return nil
}

func (c *TurbocatClient) doRequest(method, path string, payload interface{}) (*http.Response, error) {
    var body *bytes.Buffer
    if payload != nil {
        b, _ := json.Marshal(payload)
        body = bytes.NewBuffer(b)
    } else {
        body = bytes.NewBuffer(nil)
    }

    req, err := http.NewRequest(method, c.BaseURL+path, body)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+c.AccessToken)
    req.Header.Set("Content-Type", "application/json")

    return c.httpClient.Do(req)
}

func main() {
    client := NewTurbocatClient()

    if err := client.Login("user@example.com", "SecurePass123!"); err != nil {
        panic(err)
    }

    resp, err := client.doRequest("GET", "/agents", nil)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    fmt.Printf("Status: %s\n", resp.Status)
}
```

## Security Best Practices

### Token Storage

| Platform | Recommended Storage |
|----------|---------------------|
| Web Browser | HttpOnly Cookies (preferred) or Memory |
| React Native | Secure Storage (Keychain/Keystore) |
| Node.js Backend | Environment Variables |
| Mobile Apps | Secure Enclave/Keystore |

### Do NOT Store Tokens In

- localStorage (vulnerable to XSS)
- sessionStorage (vulnerable to XSS)
- Plain text files
- Version control

### HTTPS Only

Always use HTTPS in production. The API will automatically redirect HTTP requests to HTTPS.

### Token Rotation

- Refresh tokens before they expire
- Implement exponential backoff for retry logic
- Log out users when refresh fails

## Troubleshooting

### Common Errors

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Causes:**
- Missing `Authorization` header
- Expired access token
- Invalid token format

**Solution:** Refresh your access token or log in again.

#### 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

**Causes:**
- Trying to access another user's resource
- Missing required role (e.g., ADMIN)

**Solution:** Verify you have the correct permissions.

#### Token Expired

```json
{
  "success": false,
  "error": {
    "code": "TOKEN_EXPIRED",
    "message": "Access token has expired"
  }
}
```

**Solution:** Use the refresh token to get a new access token.

### Debug Mode

In development, you can decode JWT tokens at [jwt.io](https://jwt.io) to inspect their contents.

**Token Payload Structure:**

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "sessionId": "session-uuid",
  "iat": 1705312200,
  "exp": 1705313100
}
```

## Rate Limiting

Authentication endpoints have additional rate limits to prevent brute force attacks:

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 attempts per minute per IP |
| `/auth/register` | 3 attempts per minute per IP |
| `/auth/forgot-password` | 3 attempts per minute per email |
| `/auth/reset-password` | 5 attempts per minute per IP |

When rate limited, you will receive a `429 Too Many Requests` response.

---

For more information, visit the [API Documentation](/api/v1/docs) or contact [support@turbocat.dev](mailto:support@turbocat.dev).
