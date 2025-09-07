# Muse Email Service

A standalone, containerized email service for The Code Muse ecosystem. This service handles all email operations including contact form notifications, newsletter verification, and welcome emails.

## Features

- 🚀 **Standalone Service** - Independent microservice with REST API
- 📧 **Multiple Email Providers** - Support for Mailgun, SMTP, and Ethereal (dev)
- 🔒 **Secure API** - API key authentication and rate limiting
- 🐳 **Containerized** - Docker and Docker Compose ready
- 📊 **Health Monitoring** - Comprehensive health checks and logging
- 🛡️ **Production Ready** - Error handling, validation, and security features
- 🔄 **Provider Agnostic** - Easy to switch between email providers

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (for containerized deployment)
- Email provider account (Mailgun, SMTP, etc.)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd muse-email-service
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test the service:**
   ```bash
   curl http://localhost:3001/health
   ```

### Docker Deployment

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   docker-compose logs email-service
   ```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3001 | No |
| `NODE_ENV` | Environment | development | No |
| `EMAIL_PROVIDER` | Email provider (mailgun/smtp/ethereal) | mailgun | No |
| `MAILGUN_USER` | Mailgun username | - | Yes (if using Mailgun) |
| `MAILGUN_PASSWORD` | Mailgun password | - | Yes (if using Mailgun) |
| `MAILGUN_DOMAIN` | Mailgun domain | - | Yes (if using Mailgun) |
| `FROM_EMAIL` | Sender email address | - | Yes |
| `ADMIN_EMAIL` | Admin notification email | - | Yes |
| `FRONTEND_URL` | Frontend URL for links | - | Yes |
| `API_KEY` | API authentication key | - | Yes |

### Email Providers

#### Mailgun
```env
EMAIL_PROVIDER=mailgun
MAILGUN_USER=postmaster@your-domain.mailgun.org
MAILGUN_PASSWORD=your-mailgun-password
MAILGUN_DOMAIN=your-domain.mailgun.org
```

#### SMTP (Gmail, etc.)
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Ethereal (Development)
```env
EMAIL_PROVIDER=ethereal
USE_REAL_EMAIL_IN_DEV=false
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system information

### Email Operations
All email endpoints require API key authentication via `X-API-Key` header.

#### Contact Form Emails
- `POST /api/v1/contact/welcome` - Send welcome email to contact form submitter
- `POST /api/v1/contact/admin` - Send admin notification for contact form

#### Newsletter Emails
- `POST /api/v1/newsletter/verification` - Send newsletter verification email
- `POST /api/v1/newsletter/welcome` - Send newsletter welcome email

#### Test Email
- `POST /api/v1/test` - Send test email (development)

### Request Examples

#### Contact Form Welcome Email
```bash
curl -X POST http://localhost:3001/api/v1/contact/welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Question about your blog",
    "message": "I have a question about your latest post...",
    "documentId": "123",
    "createdAt": "2024-01-01T00:00:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }'
```

#### Newsletter Verification Email
```bash
curl -X POST http://localhost:3001/api/v1/newsletter/verification \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "email": "subscriber@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "verificationToken": "abc123...",
    "source": "homepage",
    "sourceUrl": "https://thecodemuse.com"
  }'
```

## Integration with Strapi CMS

To integrate this service with your existing Strapi CMS:

1. **Update Strapi email service calls:**
   ```javascript
   // Replace direct email service calls with HTTP requests
   const response = await fetch('http://email-service:3001/api/v1/contact/welcome', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-API-Key': process.env.EMAIL_SERVICE_API_KEY
     },
     body: JSON.stringify(contactData)
   });
   ```

2. **Environment variables in Strapi:**
   ```env
   EMAIL_SERVICE_URL=http://email-service:3001
   EMAIL_SERVICE_API_KEY=your-secure-api-key
   ```

## Monitoring & Logging

### Health Checks
- Basic health: `GET /health`
- Detailed metrics: `GET /health/detailed`

### Logs
- Application logs: `logs/email-service.log`
- Error logs: `logs/error.log`
- Exception logs: `logs/exceptions.log`

### Docker Logs
```bash
docker-compose logs -f email-service
```

## Security

- ✅ API key authentication
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Non-root Docker user
- ✅ Health checks

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript types
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## Production Deployment

### Kubernetes
See `k8s/` directory for Kubernetes manifests.

### Environment Setup
1. Set up your email provider (Mailgun recommended)
2. Configure environment variables
3. Deploy with Docker Compose or Kubernetes
4. Set up monitoring and alerting
5. Configure reverse proxy (nginx) for SSL termination

### Scaling
- Horizontal scaling with multiple replicas
- Load balancing with nginx or cloud load balancer
- Database for email queue (future enhancement)

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue in the repository
- Contact: hello@thecodemuse.com
