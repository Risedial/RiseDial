# Risedial - AI Mental Health Assistant

A compassionate Telegram bot providing personalized mental health support through AI-powered conversations, crisis detection, and therapeutic guidance.

## Project Overview

Risedial is designed to offer accessible mental health support through intelligent conversation, early crisis detection, and therapeutic interventions. The system operates within strict cost constraints while maintaining high reliability and user safety.

## Key Features

- **Personalized AI Conversations**: Context-aware mental health support
- **Crisis Detection**: Early identification of mental health emergencies
- **Cost Management**: Automated spending limits and monitoring
- **User Progress Tracking**: Long-term mental health journey support
- **24/7 Availability**: Round-the-clock support through Telegram

## Technology Stack

- **Platform**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Messaging**: Telegram Bot API
- **Deployment**: Vercel
- **Testing**: Jest with comprehensive test coverage

## Quick Start

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd risedial
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Testing**
   ```bash
   npm test
   npm run test:coverage
   ```

## Project Structure

```
src/
├── api/           # API routes and webhooks
├── lib/           # Core business logic
│   └── agents/    # AI agent implementations
├── types/         # TypeScript type definitions
└── utils/         # Utility functions

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
├── crisis/        # Crisis detection tests
└── therapeutic/   # Therapeutic feature tests

docs/
├── setup/         # Setup documentation
├── testing/       # Testing documentation
└── architecture/  # System architecture
```

## Development Guidelines

- Follow TypeScript strict mode
- Maintain 80%+ test coverage
- Implement proper error handling
- Document complex functions
- Use meaningful commit messages

## Cost Management

- Daily limit: $0.50
- Monthly limit: $15.00
- Automatic shutdowns on limit breach
- Detailed cost tracking and alerts

## Security & Privacy

- End-to-end encryption for sensitive data
- GDPR compliant data handling
- No storage of private conversations
- Anonymous user metrics only

## Contributing

Please read our development documentation in `docs/development/` before contributing.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical issues, please check the documentation in the `docs/` directory or create an issue. 