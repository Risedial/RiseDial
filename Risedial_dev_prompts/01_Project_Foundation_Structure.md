# Prompt 1: Create Core Project Structure

## Context
You are building Risedial, an AI therapeutic companion that provides personalized growth support through Telegram. This is a Next.js/TypeScript project using Supabase (database), Vercel (hosting), and OpenAI (AI). The system must achieve 95%+ profit margins with <$15 CAD monthly cost per user.

## Required Reading
First, read these files to understand the complete project requirements:
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Full development strategy and file structure
- `Context/project_blueprint.md` - Project overview and technical requirements

## Task
Create the complete foundational project structure for Risedial including all configuration files, folder structure, and package dependencies.

## Exact Expected Outputs

### 1. Root Configuration Files
Create these files in the project root:

**package.json** - Include these dependencies:
```json
{
  "name": "risedial",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:crisis": "jest tests/crisis",
    "test:therapeutic": "jest tests/therapeutic", 
    "test:load": "jest tests/load",
    "test:coverage": "jest --coverage",
    "validate-env": "ts-node scripts/setup/validate-env.ts",
    "setup-webhook": "ts-node scripts/setup/setup-webhook.ts"
  },
  "dependencies": {
    "next": "^14.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "openai": "^4.20.0",
    "node-telegram-bot-api": "^0.64.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/node-telegram-bot-api": "^0.64.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "ts-node": "^10.9.0"
  }
}
```

**tsconfig.json** - TypeScript configuration with path aliases:
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/api/*": ["./src/api/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**next.config.js** - Next.js configuration:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

**vercel.json** - Vercel deployment configuration:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "functions": {
    "src/api/telegram-webhook.js": { "maxDuration": 30 },
    "src/api/ai-chat.js": { "maxDuration": 60 }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, PUT, DELETE, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/health", "destination": "/api/health" }
  ]
}
```

**jest.config.js** - Testing configuration:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**.env.example** - Environment variables template:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
WEBHOOK_SECRET_TOKEN=your-webhook-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Cost Management
DAILY_COST_LIMIT_USD=0.50
MONTHLY_COST_LIMIT_USD=15.00

# Feature Flags
ENABLE_CRISIS_DETECTION=true
ENABLE_PROGRESS_TRACKING=true
ENABLE_COST_MONITORING=true

# Environment
NODE_ENV=development
VERCEL_ENV=development
LOG_LEVEL=info
```

### 2. Complete Folder Structure
Create these empty folders with placeholder files where needed:

```
src/
├── api/                  # API endpoints
├── lib/                  # Core business logic
│   ├── agents/          # AI agent implementations
├── types/               # TypeScript definitions
└── utils/               # Utility functions

tests/
├── unit/                # Unit tests
├── integration/         # Integration tests  
├── crisis/              # Crisis detection tests
├── therapeutic/         # Therapeutic effectiveness tests
├── load/                # Load testing
├── mocks/               # Test mocks
└── utils/               # Test utilities

scripts/
├── setup/               # Setup scripts
├── deployment/          # Deployment scripts
└── maintenance/         # Maintenance scripts

docs/
├── development/         # Development docs
├── deployment/          # Deployment docs
└── architecture/        # Architecture docs
```

### 3. Create Initial Placeholder Files
Create these placeholder files to establish the structure:

**src/lib/index.ts**:
```typescript
// Core library exports - to be implemented
export * from './ai-orchestrator';
export * from './crisis-detection';
export * from './cost-monitor';
export * from './user-manager';
```

**src/types/index.ts**:
```typescript
// Type definitions - to be implemented
export * from './database';
export * from './user';
export * from './conversation';
export * from './crisis';
```

**src/utils/index.ts**:
```typescript
// Utility functions - to be implemented
export * from './telegram';
export * from './database';
export * from './validation';
```

## Validation Requirements
After creating the structure:
1. Ensure `npm install` runs without errors
2. Ensure `npm run type-check` passes
3. Verify all folders are created as specified
4. Confirm all configuration files are properly formatted
5. Check that path aliases in tsconfig.json work correctly

## Success Criteria
- [ ] Complete project structure matches the specification
- [ ] All configuration files are created and valid
- [ ] TypeScript compilation works
- [ ] Package.json includes all required dependencies
- [ ] Environment template covers all needed variables
- [ ] Folder structure supports the full development plan 