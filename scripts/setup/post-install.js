#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function postInstallSetup() {
  console.log('🔧 Running post-install setup...');
  
  try {
    // Ensure required directories exist
    await ensureDirectories();
    
    // Copy environment files if needed
    await setupEnvironmentFiles();
    
    // Set up git hooks if needed
    await setupGitHooks();
    
    console.log('✅ Post-install setup completed successfully');
  } catch (error) {
    console.error('❌ Post-install setup failed:', error.message);
    // Don't exit with error code for post-install scripts
  }
}

async function ensureDirectories() {
  const directories = [
    'logs',
    'coverage',
    'tests/smoke',
    'tests/crisis',
    'scripts/monitoring',
    'scripts/security',
    'scripts/health',
    '.github/workflows'
  ];
  
  for (const dir of directories) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }
}

async function setupEnvironmentFiles() {
  const envExample = path.join(process.cwd(), '.env.example');
  const envLocal = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envExample) && !fs.existsSync(envLocal)) {
    console.log('ℹ️ .env.example exists but .env.local does not');
    console.log('Please copy .env.example to .env.local and configure your environment variables');
  }
}

async function setupGitHooks() {
  // Basic git hooks setup
  console.log('✅ Git hooks setup skipped (handled by CI/CD)');
}

if (require.main === module) {
  postInstallSetup();
}

module.exports = { postInstallSetup }; 