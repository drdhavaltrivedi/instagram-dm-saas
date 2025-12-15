# BulkDM - Instagram DM Automation SaaS Platform

<div align="center">

![BulkDM Logo](https://img.shields.io/badge/BulkDM-Instagram%20DM%20Automation-purple?style=for-the-badge&logo=instagram)

**Automate and scale your Instagram direct messages with AI-powered features**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Support](#-support)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [Support](#-support)
- [Contributing](#-contributing)

## 🎯 Overview

**BulkDM** is a comprehensive SaaS platform designed to help businesses, creators, and agencies automate and manage Instagram direct messages at scale. With AI-powered features, multi-account support, and advanced campaign management, BulkDM streamlines your Instagram outreach and engagement.

### Key Benefits

- ⚡ **Save Time**: Automate repetitive DM tasks and responses
- 📈 **Scale Growth**: Reach more leads and customers efficiently
- 🤖 **AI-Powered**: Smart automation and intelligent responses
- 🔒 **Secure**: Enterprise-grade security and data protection
- 📊 **Analytics**: Track performance and optimize your strategy

## ✨ Features

### Core Features

- 🔐 **Multi-Account Management**: Connect and manage unlimited Instagram accounts from one dashboard
- 💬 **Unified Inbox**: View and manage all Instagram DMs from all accounts in one place
- 📊 **Campaign Management**: Create, schedule, and track DM campaigns with advanced targeting
- 🤖 **AI Automations**: Set up intelligent auto-responses based on keywords and triggers
- 👥 **Lead Generation**: Find and engage potential customers using hashtags, followers, and bio keywords
- 📈 **Analytics Dashboard**: Track campaign performance, response rates, and engagement metrics
- 🔔 **Smart Notifications**: Get notified about important messages and campaign updates
- 🎯 **Personalization**: Use variables to personalize messages at scale

### Advanced Features

- 🌐 **Direct Login**: Browser-based Instagram login without manual cookie management
- 🔄 **Auto-Reconnection**: Automatic account reconnection when cookies expire
- 💾 **Persistent Sessions**: Cookies saved securely in Supabase for seamless experience
- 🛡️ **Rate Limiting**: Built-in protection against Instagram rate limits
- 📱 **Chrome Extension**: One-click Instagram account connection
- 🔒 **Workspace Isolation**: Secure data separation for teams and agencies

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS 10
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Supabase Auth
- **Browser Automation**: Puppeteer
- **API**: RESTful API with TypeScript

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library
- **State Management**: React Hooks + Zustand
- **Analytics**: PostHog

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Netlify (Frontend)
- **Deployment**: Netlify, Railway, or Render

### Extension
- **Platform**: Chrome Extension (Manifest V3)
- **Purpose**: Instagram session extraction
- **Versions**: Separate builds for Local and Production

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** database (Supabase recommended)
- **Chrome Browser** (for extension)
- **Supabase Account** (free tier works)

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/instagram-dm-saas.git
cd instagram-dm-saas

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment variables (see Configuration section)

# 4. Run database migrations
cd backend && npx prisma migrate dev

# 5. Start development servers
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# 6. Load Chrome Extension
# Extract bulkdm-extension-local-v1.0.1.zip
# Go to chrome://extensions/ → Enable Developer Mode → Load Unpacked
```

Visit `http://localhost:3000` and start using BulkDM!

## 📦 Installation

### Step-by-Step Installation

#### 1. Clone Repository

```bash
git clone https://github.com/your-username/instagram-dm-saas.git
cd instagram-dm-saas
```

#### 2. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your credentials
```

#### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your credentials
```

#### 4. Database Setup

```bash
cd ../backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

#### 5. Chrome Extension Setup

**For Local Development:**
```bash
cd extension
./build.sh
# Extract bulkdm-extension-local-v1.0.1.zip
# Load in Chrome as unpacked extension
```

**For Production:**
```bash
cd extension
./build.sh
# Use bulkdm-extension-prod-v1.0.1.zip for Chrome Web Store
```

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Security
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
ENCRYPTION_KEY="your-32-character-encryption-key"

# Instagram API (Optional - for OAuth)
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_OAUTH_REDIRECT_URI="http://localhost:3001/api/instagram/oauth/callback"
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Backend API
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### Supabase Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Run Migrations**: Execute SQL migrations from `backend/prisma/migrations/` in Supabase SQL Editor
3. **Configure RLS**: Row-level security policies are included in migrations
4. **Set Up Auth**: Configure email templates (see `SUPABASE_EMAIL_TEMPLATES.md`)

## 📖 Usage Guide

### Connecting Instagram Accounts

BulkDM offers three methods to connect Instagram accounts:

#### Method 1: Direct Login (Recommended) ⭐

1. Go to **Settings → Instagram Accounts**
2. Click **"Connect with Direct Login"**
3. Browser window opens - log in to Instagram
4. Account connects automatically!

**Benefits**: No manual steps, automatic reconnection, most secure

#### Method 2: Chrome Extension

1. Install BulkDM Chrome Extension
2. Go to **Settings → Instagram Accounts**
3. Click **"Connect with Extension"**
4. Open Instagram and click extension icon
5. Click **"Grab Instagram Session"**

**Benefits**: One-click connection, works with existing Instagram session

#### Method 3: Manual Cookies (Advanced)

1. Go to **Settings → Instagram Accounts**
2. Click **"Connect with Cookies"**
3. Open Instagram in browser
4. Extract cookies from Developer Tools
5. Paste into BulkDM

**Benefits**: Full control, works without extension

### Creating Your First Campaign

1. **Navigate to Campaigns**: Click "Campaigns" in sidebar
2. **Create Campaign**: Click "Create Campaign" button
3. **Select Account**: Choose which Instagram account to use
4. **Add Recipients**: Select contacts from your leads or add new ones
5. **Write Message**: Create personalized message template
   - Use `{name}`, `{username}`, `{firstname}` for personalization
6. **Configure Settings**: Set sending rate, delays, schedule
7. **Launch**: Start your campaign!

### Setting Up AI Automations

1. **Go to AI Studio**: Navigate from sidebar
2. **Create Automation**: Click "Create Automation"
3. **Set Triggers**: Define keywords or message types
4. **Write Response**: Create AI-powered response templates
5. **Choose Mode**: Manual review or fully automated
6. **Activate**: Enable the automation

### Finding Leads

1. **Go to Leads Page**: Navigate from sidebar
2. **Choose Search Method**:
   - **By Hashtag**: Find users with specific hashtags
   - **By Followers**: Get followers of target accounts
   - **By Bio Keywords**: Search user bios for keywords
3. **Review Results**: Filter and select potential leads
4. **Add to Contacts**: Save leads for campaigns

### Managing Inbox

1. **Select Account**: Choose Instagram account from dropdown
2. **View Conversations**: All DMs appear in sidebar
3. **Open Conversation**: Click to view messages
4. **Reply**: Type message and send
5. **Use AI Replies**: Click AI icon for suggested responses

## 🔧 Development

### Running Locally

```bash
# Backend (Terminal 1)
cd backend
npm run start:dev
# Runs on http://localhost:3001

# Frontend (Terminal 2)
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Database Commands

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# View database in browser
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Extension Development

```bash
cd extension

# Build both versions
./build.sh

# Test locally
# 1. Extract bulkdm-extension-local-v1.0.1.zip
# 2. Load in Chrome as unpacked extension
# 3. Make changes to source files
# 4. Reload extension in chrome://extensions/
```

### Code Structure

```
instagram-dm-saas/
├── backend/
│   ├── src/
│   │   ├── instagram/        # Instagram API integration
│   │   │   ├── instagram-browser.service.ts
│   │   │   ├── instagram-cookie.service.ts
│   │   │   └── instagram-cookie.controller.ts
│   │   ├── auth/             # Authentication guards
│   │   └── main.ts           # App entry point
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── migrations/       # Database migrations
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   │   ├── (auth)/       # Auth pages (login, signup)
│   │   │   ├── (dashboard)/  # Dashboard pages
│   │   │   ├── docs/         # Documentation
│   │   │   ├── privacy/      # Privacy policy
│   │   │   ├── terms/        # Terms of service
│   │   │   └── support/      # Support page
│   │   ├── components/       # React components
│   │   │   ├── ui/           # UI components
│   │   │   ├── layout/       # Layout components
│   │   │   └── inbox/        # Inbox components
│   │   └── lib/              # Utilities
│   │       ├── supabase/     # Supabase helpers
│   │       └── utils.ts      # Common utilities
│   └── public/               # Static assets
└── extension/
    ├── popup.local.js        # Local version
    ├── popup.prod.js         # Production version
    ├── background.local.js   # Local background
    ├── background.prod.js    # Production background
    ├── manifest.local.json   # Local manifest
    ├── manifest.prod.json    # Production manifest
    └── build.sh              # Build script
```

## 🌐 Deployment

### Frontend Deployment (Netlify)

See detailed guide: [`NETLIFY_DEPLOYMENT.md`](./NETLIFY_DEPLOYMENT.md)

**Quick Deploy:**
1. Connect GitHub repository to Netlify
2. Set build command: `cd frontend && npm run build`
3. Set publish directory: `frontend/.next`
4. Add environment variables
5. Deploy!

### Backend Deployment

Deploy to **Railway**, **Render**, or **Heroku**:

```bash
# Railway
railway login
railway init
railway up

# Render
# Connect GitHub repo and configure build settings
```

### Extension Deployment

See detailed guide: [`EXTENSION_DEPLOYMENT.md`](./EXTENSION_DEPLOYMENT.md)

1. Build production version: `cd extension && ./build.sh`
2. Upload `bulkdm-extension-prod-v1.0.1.zip` to Chrome Web Store
3. Fill in store listing details
4. Submit for review

## 🔐 Security

### Security Features

- ✅ **Row-Level Security (RLS)**: All database queries protected by Supabase RLS
- ✅ **Workspace Isolation**: Users can only access their own workspace data
- ✅ **Encrypted Storage**: Instagram cookies encrypted before storage
- ✅ **Secure Authentication**: Supabase Auth with email verification
- ✅ **HTTPS Only**: All communications encrypted in transit
- ✅ **Content Security Policy**: Strict CSP headers for XSS protection

### Best Practices

- Never commit `.env` files
- Use strong encryption keys (32+ characters)
- Regularly rotate JWT secrets
- Monitor for suspicious activity
- Keep dependencies updated

## 📚 Documentation

- 📖 **[Full Documentation](./frontend/src/app/docs/page.tsx)** - Complete user guide
- 🔧 **[API Documentation](./backend/README.md)** - Backend API reference
- 🚀 **[Deployment Guide](./NETLIFY_DEPLOYMENT.md)** - Deployment instructions
- 🔌 **[Extension Guide](./extension/README.md)** - Chrome extension setup
- 📧 **[Email Templates](./SUPABASE_EMAIL_TEMPLATES.md)** - Supabase email customization

## 🆘 Support

### Get Help

- 📖 **Documentation**: Visit `/docs` for detailed guides
- 💬 **Support Page**: Visit `/support` for FAQs and contact options
- 🐛 **Issues**: Open an issue on [GitHub Issues](https://github.com/your-username/instagram-dm-saas/issues)
- 📧 **Email**: support@bulkdm.com

### Common Issues

- **Account disconnects**: Cookies expire - use Direct Login for auto-reconnection
- **Campaigns not sending**: Check account connection and rate limits
- **Extension not working**: Make sure you're using the correct version (local vs prod)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit**: `git commit -m 'Add amazing feature'`
5. **Push**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow the existing code style

## 📝 License

[Your License Here]

## 🎯 Roadmap

### Upcoming Features

- [ ] WhatsApp integration
- [ ] Telegram integration
- [ ] Advanced AI models (GPT-4, Claude)
- [ ] Team collaboration features
- [ ] API access for developers
- [ ] Webhooks for integrations
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics and reporting
- [ ] A/B testing for campaigns
- [ ] Scheduled campaigns with timezone support

### In Progress

- [x] Multi-account support
- [x] Direct Instagram login
- [x] Cookie persistence
- [x] AI automations
- [x] Lead generation
- [x] Analytics dashboard

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com)
- Analytics by [PostHog](https://posthog.com)

---

<div align="center">

**Built with ❤️ by the BulkDM team**

[Website](https://bulkdm.com) • [Documentation](/docs) • [Support](/support) • [GitHub](https://github.com/your-username/instagram-dm-saas)

⭐ Star us on GitHub if you find this project helpful!

</div>
