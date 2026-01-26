# Vibe Subscription Manager

A comprehensive full-stack subscription and license management system built with modern web technologies. This monorepo manages license keys, user submissions, API keys, and provides a robust admin dashboard for monitoring and control.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- **License Key Management**: Generate, activate, revoke, and monitor license keys
- **User Submission System**: Collect and manage user subscription requests with reCAPTCHA protection
- **API Key Management**: Create and manage API keys for third-party integrations
- **Admin Dashboard**: Comprehensive dashboard with real-time statistics and analytics
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Verification Logging**: Track all license verification attempts and status changes

### Security Features
- 🔐 JWT-based authentication with refresh tokens
- 🔑 API key authentication for external integrations
- 🛡️ Google reCAPTCHA v2 integration for form protection
- 🚦 Rate limiting on sensitive endpoints
- 🔒 Password hashing with bcrypt
- 📝 Comprehensive audit logging

### Admin Features
- 📊 Real-time dashboard with key metrics
- 👥 Active user session tracking
- 📈 License statistics and analytics
- 🔍 Advanced filtering and search capabilities
- 📋 Submission management and approval workflow
- 🔑 License key generation and management
- 🗝️ API key creation and revocation

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: [Hono](https://hono.dev/) - Ultra-fast web framework
- **Database**: SQLite with [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Password Hashing**: bcrypt
- **Development**: tsx (TypeScript execution)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### DevOps & Tools
- **Package Manager**: pnpm (>=8.0.0)
- **Monorepo**: pnpm workspaces
- **Type Checking**: TypeScript 5.x
- **Linting**: ESLint
- **Testing**: Jest (backend), Vitest (frontend)

## 📁 Project Structure

```
subscription_manager/
├── apps/
│   ├── backend/                 # Backend API service
│   │   ├── src/
│   │   │   ├── config/         # Environment configuration
│   │   │   ├── db/             # Database schema and migrations
│   │   │   ├── middleware/     # Express/Hono middleware
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── admin/      # Admin-only routes
│   │   │   │   ├── api.routes.ts
│   │   │   │   └── public.routes.ts
│   │   │   ├── schemas/        # Zod validation schemas
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── utils/          # Utility functions
│   │   │   └── index.ts        # Application entry point
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── frontend/               # Frontend React application
│       ├── src/
│       │   ├── components/     # Reusable React components
│       │   │   └── ui/         # UI primitives (buttons, cards, etc.)
│       │   ├── hooks/          # Custom React hooks
│       │   ├── layouts/        # Layout components
│       │   ├── lib/            # Third-party library configs
│       │   ├── pages/          # Page components
│       │   │   └── admin/      # Admin dashboard pages
│       │   ├── schemas/        # Frontend validation schemas
│       │   ├── services/       # API service layer
│       │   ├── stores/         # Zustand state stores
│       │   ├── utils/          # Utility functions
│       │   ├── App.tsx         # Main app component
│       │   └── main.tsx        # Application entry point
│       ├── .env.example
│       └── package.json
│
├── .gitignore
├── ENV_SETUP.md               # Environment setup guide
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── post-install.js            # Post-install setup script
└── setup-env.js               # Environment setup script
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 8.0.0 or higher
- **Git**: For version control

### Installing pnpm

```bash
npm install -g pnpm@8.15.0
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd subscription_manager
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies for both backend and frontend applications.

### 3. Environment Setup

Run the automated environment setup:

```bash
pnpm setup:env
```

This creates the necessary configuration files and directories.

### 4. Configure Environment Variables

Update the generated `.env` files with your actual values:

#### Backend (`.env` in `apps/backend/`)

```env
# Database
DATABASE_URL=file:./dev.db

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
API_KEY_SECRET=your-super-secret-api-key-min-32-chars

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Google reCAPTCHA
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

#### Frontend (`.env` in `apps/frontend/`)

```env
VITE_API_URL=http://localhost:3000
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

> 📖 For detailed environment variable documentation, see [ENV_SETUP.md](./ENV_SETUP.md)

### 5. Database Setup

Initialize and seed the database:

```bash
pnpm setup:db
```

This will:
- Create the SQLite database
- Run migrations to create tables
- Seed initial data (admin user, sample data)

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **Important**: Change the default admin password immediately after first login!

## ⚙️ Configuration

### Google reCAPTCHA Setup

1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register a new site (choose reCAPTCHA v2 - "I'm not a robot" checkbox)
3. Add your domains (localhost for development)
4. Copy the Site Key and Secret Key to your `.env` files

### SMTP Configuration

For email functionality, configure your SMTP settings:

**Gmail Example:**
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Account Settings → Security → App Passwords
3. Use the app password in `SMTP_PASS`

## 🎯 Usage

### Development Mode

Run both backend and frontend concurrently:

```bash
pnpm dev
```

Or run them separately:

```bash
# Backend only (runs on http://localhost:3000)
pnpm backend:dev

# Frontend only (runs on http://localhost:5173)
pnpm frontend:dev
```

### Production Build

Build both applications:

```bash
pnpm build
```

Start the production server:

```bash
pnpm backend:start
```

### Available Scripts

#### Root Level
- `pnpm dev` - Run both apps in development mode
- `pnpm build` - Build all apps
- `pnpm test` - Run tests for all apps
- `pnpm lint` - Lint all apps
- `pnpm setup:env` - Setup environment files
- `pnpm setup:db` - Initialize and seed database

#### Backend Specific
- `pnpm backend:dev` - Run backend in watch mode
- `pnpm backend:build` - Build backend
- `pnpm backend:start` - Start production backend
- `pnpm backend:db:generate` - Generate Drizzle migrations
- `pnpm backend:db:push` - Push schema changes to database
- `pnpm backend:db:studio` - Open Drizzle Studio (database GUI)
- `pnpm backend:db:seed` - Seed database with initial data
- `pnpm backend:type-check` - TypeScript type checking

#### Frontend Specific
- `pnpm frontend:dev` - Run frontend dev server
- `pnpm frontend:build` - Build frontend for production

## 📚 API Documentation

### Public Endpoints

#### Submit License Request
```http
POST /api/public/submit
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "shopName": "My Shop",
  "machineId": "MACHINE-123",
  "numberOfCashiers": 3,
  "captchaToken": "recaptcha-token"
}
```

### API Key Protected Endpoints

All API endpoints require an API key in the header:

```http
X-API-Key: your-api-key-here
```

#### Verify License
```http
POST /api/verify
Content-Type: application/json

{
  "licenseKey": "LICENSE-KEY-HERE",
  "machineId": "MACHINE-123"
}
```

#### Get License Info
```http
GET /api/license/:licenseKey
```

### Admin Endpoints

All admin endpoints require JWT authentication:

```http
Authorization: Bearer your-jwt-token
```

#### Authentication
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Dashboard Stats
```http
GET /api/admin/dashboard/stats
```

#### Manage Licenses
```http
GET /api/admin/licenses
POST /api/admin/licenses
PUT /api/admin/licenses/:id/status
GET /api/admin/licenses/:id
```

#### Manage Submissions
```http
GET /api/admin/submissions
POST /api/admin/submissions/:id/approve
DELETE /api/admin/submissions/:id
```

#### Manage API Keys
```http
GET /api/admin/api-keys
POST /api/admin/api-keys
DELETE /api/admin/api-keys/:id
```

## 🗄️ Database Schema

### Tables

#### `admin_users`
Admin user accounts with role-based access control.

#### `license_keys`
License keys with status tracking (active, inactive, revoked).

#### `user_submissions`
User subscription requests from the public form.

#### `api_keys`
API keys for third-party integrations.

#### `refresh_tokens`
JWT refresh tokens for admin sessions.

#### `verification_logs`
Audit log of all license verification attempts.

#### `license_status_logs`
History of license status changes.

### Relationships
- `user_submissions` → `license_keys` (one-to-one)
- `license_keys` → `verification_logs` (one-to-many)
- `license_keys` → `license_status_logs` (one-to-many)
- `admin_users` → `license_status_logs` (one-to-many)

## 💻 Development

### Database Management

**View Database in Drizzle Studio:**
```bash
pnpm backend:db:studio
```

**Generate Migrations:**
```bash
pnpm backend:db:generate
```

**Push Schema Changes:**
```bash
pnpm backend:db:push
```

**Reseed Database:**
```bash
pnpm backend:db:seed
```

### Type Checking

```bash
# Backend
pnpm backend:type-check

# Frontend
pnpm frontend:type-check
```

### Linting

```bash
pnpm lint
```

### Testing

```bash
pnpm test
```

## 🚢 Deployment

### Backend Deployment

1. **Build the application:**
   ```bash
   pnpm backend:build
   ```

2. **Set production environment variables**

3. **Run database migrations:**
   ```bash
   pnpm backend:db:push
   ```

4. **Start the server:**
   ```bash
   pnpm backend:start
   ```

### Frontend Deployment

1. **Build the application:**
   ```bash
   pnpm frontend:build
   ```

2. **Deploy the `apps/frontend/dist` folder** to your hosting provider (Vercel, Netlify, etc.)

### Environment Considerations

- Use strong, unique secrets for `JWT_SECRET` and `API_KEY_SECRET`
- Configure proper CORS origins
- Use a production-grade database (PostgreSQL, MySQL) instead of SQLite
- Set up proper SSL/TLS certificates
- Configure rate limiting appropriately
- Set up monitoring and logging
- Use environment-specific secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

## 🔒 Security

### Best Practices Implemented

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT with short expiration times (15 minutes for access tokens)
- ✅ Refresh token rotation
- ✅ API key authentication for external access
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation with Zod schemas
- ✅ CORS configuration
- ✅ SQL injection prevention (parameterized queries via Drizzle ORM)
- ✅ XSS protection
- ✅ reCAPTCHA for public forms
- ✅ Comprehensive audit logging

### Security Checklist for Production

- [ ] Change default admin credentials
- [ ] Generate strong, unique secrets (min 32 characters)
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Configure secure session management
- [ ] Implement proper error handling (don't leak sensitive info)
- [ ] Set up monitoring and alerting
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- [Hono](https://hono.dev/) - Ultra-fast web framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [TanStack Query](https://tanstack.com/query) - Powerful data synchronization

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Built with ❤️ using modern web technologies**
