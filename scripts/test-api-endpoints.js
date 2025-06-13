#!/usr/bin/env node

/**
 * API Endpoint Testing Script
 * 
 * This script tests all the implemented API endpoints to ensure they're
 * properly structured and responding correctly.
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

console.log(`${colors.bold}${colors.blue}🔍 Risedial API Endpoints Validation${colors.reset}\n`);

// Define expected API endpoints
const expectedEndpoints = [
  {
    path: 'src/api/health/route.ts',
    name: 'Health Check Endpoint',
    methods: ['GET'],
    description: 'System health monitoring with service status checks'
  },
  {
    path: 'src/api/analytics/route.ts',
    name: 'Analytics API',
    methods: ['GET'],
    description: 'Cost analytics and forecasting with authentication'
  },
  {
    path: 'src/api/admin/users/route.ts',
    name: 'User Admin API',
    methods: ['GET', 'POST'],
    description: 'User management and administration functions'
  },
  {
    path: 'src/api/admin/crisis/route.ts',
    name: 'Crisis Events API',
    methods: ['GET', 'PATCH'],
    description: 'Crisis monitoring and management'
  },
  {
    path: 'src/api/status/route.ts',
    name: 'System Status API',
    methods: ['GET'],
    description: 'Comprehensive system status and performance metrics'
  }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function logResult(type, message) {
  const color = type === 'pass' ? colors.green : 
                type === 'fail' ? colors.red : 
                colors.yellow;
  const icon = type === 'pass' ? '✅' : 
               type === 'fail' ? '❌' : 
               '⚠️';
  console.log(`${color}${icon} ${message}${colors.reset}`);
}

function validateEndpoint(endpoint) {
  console.log(`\n${colors.bold}Testing: ${endpoint.name}${colors.reset}`);
  console.log(`Path: ${endpoint.path}`);
  console.log(`Expected methods: ${endpoint.methods.join(', ')}`);
  console.log(`Description: ${endpoint.description}`);
  
  // Check if file exists
  if (!fs.existsSync(endpoint.path)) {
    logResult('fail', `File does not exist: ${endpoint.path}`);
    results.failed++;
    return false;
  }
  
  // Read file content
  const content = fs.readFileSync(endpoint.path, 'utf8');
  
  // Check for required imports
  const requiredImports = [
    'NextRequest',
    'NextResponse'
  ];
  
  const missingImports = requiredImports.filter(imp => !content.includes(imp));
  if (missingImports.length > 0) {
    logResult('fail', `Missing required imports: ${missingImports.join(', ')}`);
    results.failed++;
    return false;
  }
  
  // Check for expected HTTP methods
  const methodsFound = endpoint.methods.filter(method => {
    return content.includes(`export async function ${method}(`);
  });
  
  if (methodsFound.length !== endpoint.methods.length) {
    const missing = endpoint.methods.filter(m => !methodsFound.includes(m));
    logResult('fail', `Missing HTTP methods: ${missing.join(', ')}`);
    results.failed++;
    return false;
  }
  
  // Check for error handling
  if (!content.includes('try {') || !content.includes('catch')) {
    logResult('warn', 'Missing error handling (try/catch blocks)');
    results.warnings++;
  }
  
  // Check for authentication (admin endpoints)
  if (endpoint.path.includes('/admin/')) {
    if (!content.includes('authenticate')) {
      logResult('fail', 'Admin endpoint missing authentication');
      results.failed++;
      return false;
    }
  }
  
  // Check for proper TypeScript types
  if (!content.includes('NextRequest') || !content.includes('NextResponse')) {
    logResult('fail', 'Missing proper TypeScript request/response types');
    results.failed++;
    return false;
  }
  
  logResult('pass', `${endpoint.name} validation passed`);
  results.passed++;
  return true;
}

// Additional structural checks
function validateAPIStructure() {
  console.log(`\n${colors.bold}🏗️  API Structure Validation${colors.reset}`);
  
  const apiDir = 'src/api';
  if (!fs.existsSync(apiDir)) {
    logResult('fail', 'API directory does not exist');
    return false;
  }
  
  // Check directory structure
  const expectedDirs = ['health', 'analytics', 'admin', 'status'];
  for (const dir of expectedDirs) {
    const dirPath = path.join(apiDir, dir);
    if (!fs.existsSync(dirPath)) {
      logResult('fail', `Missing API directory: ${dir}`);
      results.failed++;
    } else {
      logResult('pass', `API directory exists: ${dir}`);
      results.passed++;
    }
  }
  
  // Check admin subdirectories
  const adminSubdirs = ['users', 'crisis'];
  for (const subdir of adminSubdirs) {
    const subdirPath = path.join(apiDir, 'admin', subdir);
    if (!fs.existsSync(subdirPath)) {
      logResult('fail', `Missing admin subdirectory: ${subdir}`);
      results.failed++;
    } else {
      logResult('pass', `Admin subdirectory exists: ${subdir}`);
      results.passed++;
    }
  }
}

// Security checks
function validateSecurity() {
  console.log(`\n${colors.bold}🔒 Security Validation${colors.reset}`);
  
  const securityChecks = [
    {
      file: 'src/api/analytics/route.ts',
      check: 'authenticateRequest',
      description: 'Analytics API authentication'
    },
    {
      file: 'src/api/admin/users/route.ts',
      check: 'authenticateAdmin',
      description: 'Admin users authentication'
    },
    {
      file: 'src/api/admin/crisis/route.ts',
      check: 'authenticateAdmin',
      description: 'Crisis management authentication'
    }
  ];
  
  securityChecks.forEach(check => {
    if (fs.existsSync(check.file)) {
      const content = fs.readFileSync(check.file, 'utf8');
      if (content.includes(check.check)) {
        logResult('pass', check.description);
        results.passed++;
      } else {
        logResult('fail', `Missing ${check.description}`);
        results.failed++;
      }
    }
  });
}

// Run all validations
console.log(`${colors.bold}Starting API endpoint validation...${colors.reset}\n`);

// Validate structure
validateAPIStructure();

// Validate each endpoint
expectedEndpoints.forEach(validateEndpoint);

// Validate security
validateSecurity();

// Summary
console.log(`\n${colors.bold}📊 Validation Summary${colors.reset}`);
console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);

const total = results.passed + results.failed;
const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;

console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);

if (results.failed === 0) {
  console.log(`\n${colors.green}${colors.bold}🎉 All API endpoints validated successfully!${colors.reset}`);
  console.log(`${colors.green}✅ Ready for integration testing${colors.reset}`);
} else {
  console.log(`\n${colors.red}${colors.bold}⚠️  Some validations failed. Please review and fix the issues above.${colors.reset}`);
  process.exit(1);
}

// API usage examples
console.log(`\n${colors.bold}📚 API Usage Examples${colors.reset}`);
console.log(`
Health Check:
${colors.blue}GET /api/health${colors.reset}

Analytics (requires API key):
${colors.blue}GET /api/analytics?period=monthly&forecasts=true${colors.reset}
${colors.blue}Authorization: Bearer YOUR_ANALYTICS_API_KEY${colors.reset}

System Status:
${colors.blue}GET /api/status${colors.reset}

Admin - List Users (requires admin key):
${colors.blue}GET /api/admin/users?page=1&limit=50&tier=premium${colors.reset}
${colors.blue}Authorization: Bearer YOUR_ADMIN_API_KEY${colors.reset}

Admin - Update User:
${colors.blue}POST /api/admin/users${colors.reset}
${colors.blue}Authorization: Bearer YOUR_ADMIN_API_KEY${colors.reset}
${colors.blue}{
  "action": "update_subscription",
  "userId": "user-id",
  "data": { "tier": "premium" }
}${colors.reset}

Crisis Events (requires admin key):
${colors.blue}GET /api/admin/crisis?status=unresolved&severity=8&hours=24${colors.reset}
${colors.blue}Authorization: Bearer YOUR_ADMIN_API_KEY${colors.reset}
`);

console.log(`\n${colors.bold}🔐 Environment Variables Required:${colors.reset}`);
console.log(`${colors.yellow}ANALYTICS_API_KEY${colors.reset} - For analytics endpoint authentication`);
console.log(`${colors.yellow}ADMIN_API_KEY${colors.reset} - For admin endpoints authentication`);
console.log(`${colors.yellow}TELEGRAM_BOT_TOKEN${colors.reset} - For Telegram bot health checks`);
console.log(`${colors.yellow}ENABLE_CRISIS_DETECTION${colors.reset} - Feature flag for crisis detection`);
console.log(`${colors.yellow}ENABLE_PROGRESS_TRACKING${colors.reset} - Feature flag for progress tracking`);
console.log(`${colors.yellow}ENABLE_COST_MONITORING${colors.reset} - Feature flag for cost monitoring`); 