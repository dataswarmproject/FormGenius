# FormGenius - AI-Powered Form Builder

FormGenius is a sophisticated, AI-powered form builder platform that seamlessly integrates with Google Sheets and leverages artificial intelligence for automated evaluation, intelligent analysis, and smart assistance features.

## Features

### Core Capabilities
- 🤖 **AI-Powered Evaluation**: Automatically grade essays, tests, and surveys using Gemini AI
- 📊 **Google Sheets Integration**: Real-time synchronization with Google Sheets
- 🎨 **Drag-and-Drop Form Builder**: Intuitive interface with 20+ question types
- 📈 **Advanced Analytics**: AI-powered insights, sentiment analysis, and trend detection
- 🔄 **Smart Automation**: Automated workflows, notifications, and custom triggers
- ✨ **AI Assistance**: Generate questions, rubrics, and get intelligent suggestions

### Question Types
- Short/Long Text
- Email, Phone, URL
- Number, Date, Time
- Single/Multiple Choice
- Dropdown, Rating, Scale
- Matrix, File Upload
- Code Editor, Essay
- And more...

## Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Animation**: Framer Motion
- **State Management**: TanStack Query

### Backend
- **Framework**: Next.js API Routes & Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: Google Gemini API (gemini-2.0-flash-exp)
- **Google APIs**: Sheets API, Drive API
- **Queue**: BullMQ with Redis (planned)
- **Email**: Resend (planned)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Google Cloud project with OAuth credentials
- Google Gemini API key
- Redis (for background jobs - optional for development)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-org/formgenius.git
cd formgenius
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/formgenius"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth & APIs
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"
```

4. **Set up the database**
```bash
npm run db:push
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
FormGenius/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # NextAuth routes
│   │   │   ├── forms/        # Form CRUD operations
│   │   │   ├── submissions/  # Submission handling
│   │   │   └── ai/           # AI features
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard (planned)
│   │   └── page.tsx          # Landing page
│   ├── components/           # React components
│   │   ├── ui/               # UI primitives
│   │   └── form-builder/     # Form builder components (planned)
│   ├── lib/                  # Utility libraries
│   │   ├── ai/               # AI services
│   │   │   ├── evaluation-engine.ts
│   │   │   └── ai-assistant.ts
│   │   ├── google/           # Google APIs integration
│   │   │   └── sheets-integration.ts
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client
│   │   └── utils.ts          # Utility functions
│   ├── types/                # TypeScript types
│   │   ├── index.ts          # Main type definitions
│   │   └── next-auth.d.ts    # NextAuth type extensions
│   └── validations/          # Zod schemas
│       └── form.ts
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static assets
└── package.json
```

## Database Schema

The application uses a comprehensive database schema including:

- **Users & Authentication**: User accounts, sessions, OAuth accounts
- **Workspaces**: Multi-tenant workspace support
- **Forms**: Form configuration, questions, settings
- **Submissions**: User responses and answers
- **AI Evaluation**: Scores, feedback, and analysis
- **Analytics**: Aggregated statistics and insights
- **Webhooks**: Event-based integrations
- **API Keys**: Programmatic access

See `prisma/schema.prisma` for the complete schema.

## API Endpoints

### Forms
- `GET /api/forms` - List user's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/[id]` - Get form details
- `PATCH /api/forms/[id]` - Update form
- `DELETE /api/forms/[id]` - Delete form

### Submissions
- `POST /api/submissions` - Create submission
- `POST /api/submissions/[id]/evaluate` - Evaluate submission with AI

### AI Features
- `POST /api/ai/generate-questions` - Generate questions from topic
- `POST /api/ai/generate-rubric` - Generate grading rubric

## AI Evaluation

The AI Evaluation Engine uses Google's Gemini API to:

1. **Evaluate Responses**: Grade open-ended questions, essays, and code
2. **Provide Feedback**: Detailed, constructive feedback for each answer
3. **Apply Rubrics**: Score based on custom grading criteria
4. **Detect Patterns**: Identify strengths, weaknesses, and themes
5. **Generate Insights**: Provide actionable recommendations

### Evaluation Styles
- **Strict**: Exact matching, high standards
- **Moderate**: Balanced approach with partial credit
- **Lenient**: Focus on understanding over perfection

## Google Sheets Integration

Features:
- Automatic spreadsheet creation for each form
- Real-time sync of submissions
- Custom column mapping
- Analytics sheet with AI insights
- Bidirectional sync (planned)

## Development

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Create migration
```

### Code Style
- Use TypeScript strict mode
- Follow ESLint configuration
- Use Prettier for formatting
- Write JSDoc comments for complex functions

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables
Ensure all production environment variables are set:
- Database connection string
- Authentication secrets
- API keys for Google and Gemini
- Redis connection (for background jobs)

## Security

- All API routes require authentication
- Row-level security through ownership checks
- Input validation with Zod schemas
- SQL injection protection via Prisma
- XSS protection through React
- Rate limiting (planned)
- CSRF protection via NextAuth

## Roadmap

### Phase 1 (Current)
- [x] Basic form builder
- [x] AI evaluation engine
- [x] Google Sheets integration
- [x] Authentication
- [x] Core API routes

### Phase 2
- [ ] Form Builder UI with drag-and-drop
- [ ] Dashboard and analytics
- [ ] Background job processing
- [ ] Email notifications
- [ ] File uploads

### Phase 3
- [ ] Collaborative editing
- [ ] Advanced analytics dashboard
- [ ] Custom branding and white-labeling
- [ ] Public API with rate limiting
- [ ] Mobile app

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@formgenius.com or join our Discord community.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
