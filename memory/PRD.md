# Script-to-Gear - Product Requirements Document

## Original Problem Statement
Build a production-ready full-stack marketplace application called "Script-to-Gear" with two distinct user roles: "filmmaker" and "rental_house". The platform connects filmmakers with professional equipment rental houses using AI-powered script analysis to recommend gear.

## Core Features

### 1. Authentication System
- Sign up/login with Google OAuth (Emergent-managed)
- Role selection screen (filmmaker or rental_house)
- Role-based access control
- **Status**: COMPLETED

### 2. User Profiles
- Store user's name, email, role, phone
- Company name for rental houses
- Stripe Connect account for rental houses
- **Status**: COMPLETED

### 3. AI Script Analysis (GPT-5.2 via Emergent LLM Key)
- Analyze script text to recommend gear
- Scene type detection (interior/exterior, day/night)
- Generate complete gear list with quantities
- **Status**: COMPLETED

### 4. Gear & Projects
- Rental houses can manage gear inventory
- Filmmakers can create projects and get AI analysis
- **Status**: COMPLETED

### 5. Quote Workflow
- Filmmakers request quotes from rental houses
- Rental houses send back formal quotes
- **Status**: COMPLETED

### 6. Payment Integration (Stripe Connect)
- 10% platform fee
- Direct payouts to rental houses
- **Status**: COMPLETED

### 7. Email Notifications (Resend)
- Welcome emails on signup
- New lead notifications to rental houses
- Quote received notifications to filmmakers
- Booking confirmation emails
- **Status**: COMPLETED (Dec 2024) - Placeholder API key, user needs to add real RESEND_API_KEY

## Technical Architecture

### Backend
- Framework: FastAPI
- Database: MongoDB (Motor async driver)
- Authentication: Emergent OAuth + Session-based
- Main file: `/app/backend/server.py`

### Frontend
- Framework: React
- Routing: React Router
- Styling: TailwindCSS
- UI Components: Shadcn/UI

### Third-Party Integrations
- OpenAI GPT-5.2 (via Emergent LLM Key)
- Emergent Google OAuth
- Stripe Connect (payments)
- Resend (emails)

## Database Collections
- `users`: User profiles with roles
- `gear_items`: Rental house inventory
- `projects`: Filmmaker projects with AI analysis
- `project_gear`: Gear added to projects
- `leads`: Quote requests between filmmakers and rental houses
- `payment_transactions`: Stripe payment records
- `email_logs`: Email send attempts and status

## API Endpoints Summary
- `/api/auth/*` - Authentication
- `/api/gear/*` - Gear inventory management
- `/api/projects/*` - Project management
- `/api/leads/*` - Lead/quote management
- `/api/stripe/*` - Stripe Connect onboarding
- `/api/payments/*` - Payment processing
- `/api/webhook/stripe` - Stripe webhooks

---

## Completed Work Log

### December 2024
- Email notification integration completed
  - Welcome emails (filmmaker/rental_house)
  - New lead notifications
  - Quote received notifications
  - Booking confirmation emails
  - Email logging to db.email_logs

- Filmmaker Quote Review UI completed
  - `/filmmaker/leads` - List view of all quote requests
  - `/filmmaker/leads/{leadId}` - Detailed quote view with Accept & Pay / Decline
  - Integrated with Stripe checkout for payments
  - Quote status display (Pending, Quote Ready, Accepted, Declined)

- User Profile Management completed
  - `/profile` - Shared profile page for all users
  - Edit name, phone number
  - Company name editing for rental houses
  - Backend `PUT /api/users/profile` endpoint
  - Sidebar navigation links to profile

---

## Upcoming Tasks (P1)
All P1 tasks completed!

## Future Tasks (P2)
1. Systematic Audit Logging
2. Script File Upload (PDF parsing)
3. Advanced Gear Matching Logic
4. Payment Analytics Dashboard

## Known Limitations
- AI analysis endpoint can take up to 30 seconds (synchronous)
- Script file upload is a UI placeholder
- Email sending requires valid RESEND_API_KEY for production
