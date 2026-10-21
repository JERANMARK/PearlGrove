# Pearl Grow API Documentation

## Base URL
- Production: `https://your-render-app.onrender.com/api/v1`
- Development: `http://localhost:5000/api/v1`

## Authentication
All admin endpoints require authentication via HTTP-only cookie (`pearl_admin_session`).

## Public Endpoints

### Health Check
```
GET /api/v1/health
```
Returns service health status.

### Database Readiness
```
GET /api/v1/ready
```
Returns database connection status (cached for 30 seconds).

### Products
```
GET /api/v1/products
GET /api/v1/products/:id
```
Retrieve products and product details.

### Categories
```
GET /api/v1/categories
```
Retrieve product categories.

### Settings
```
GET /api/v1/settings/public
```
Retrieve public settings (WhatsApp number, etc.).

### Orders
```
POST /api/v1/orders
Headers: Idempotency-Key: <uuid>
```
Create a new order/enquiry.

## Admin Endpoints

### Authentication
```
POST /api/v1/admin/login
POST /api/v1/admin/logout
GET /api/v1/admin/me
PUT /api/v1/admin/password
```

### Products
```
GET /api/v1/admin/products
GET /api/v1/admin/products/:id
POST /api/v1/admin/products
PUT /api/v1/admin/products/:id
DELETE /api/v1/admin/products/:id
PATCH /api/v1/admin/products/:id/toggle-availability
POST /api/v1/admin/upload-image
```

### Categories
```
GET /api/v1/admin/categories
POST /api/v1/admin/categories
PUT /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id
```

### Orders
```
GET /api/v1/admin/orders
GET /api/v1/admin/orders/:id
PUT /api/v1/admin/orders/:id/status
DELETE /api/v1/admin/orders/:id
```

### Dashboard
```
GET /api/v1/admin/dashboard
```

### Settings
```
GET /api/v1/admin/settings
PUT /api/v1/admin/settings
```

## Rate Limiting
- Login: 10 attempts per account, 30 per IP (15 min window)
- Orders: 10 requests per IP (15 min window)

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid"
}
```

## Request IDs
All requests include a `X-Request-ID` header for tracing.

## Versioning
Current API version: v1
Legacy endpoints (without /v1/) are supported for backward compatibility.
