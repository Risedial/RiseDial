#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

class DependencyValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Validating dependency synchronization...');
    
    this.validatePackageFiles();
    this.validateCriticalDependencies();
    this.validateLockFileSync();
    
    this.printResults();
    
    if (this.errors.length > 0) {
      console.error('❌ Dependency validation failed');
      process.exit(1);
    }
    
    console.log('✅ All dependencies validated successfully');
  }

  validatePackageFiles() {
    console.log('📦 Checking package files...');
    
    if (!fs.existsSync('package.json')) {
      this.errors.push('package.json not found');
      return;
    }
    
    if (!fs.existsSync('package-lock.json')) {
      this.errors.push('package-lock.json not found - run npm install');
      return;
    }
    
    console.log('✅ Package files exist');
  }

  validateCriticalDependencies() {
    console.log('🔧 Checking critical dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const criticalDeps = ['axios', 'next', 'react', '@supabase/supabase-js'];
    
    for (const dep of criticalDeps) {
      if (!packageJson.dependencies[dep]) {
        this.errors.push(`Missing critical dependency: ${dep}`);
      } else {
        console.log(`✅ ${dep} declared in package.json`);
      }
    }
  }

  validateLockFileSync() {
    console.log('🔄 Validating lock file sync...');
    
    try {
      // This will fail if package.json and package-lock.json are out of sync
      execSync('npm ls axios', { stdio: 'pipe' });
      console.log('✅ axios properly installed and locked');
    } catch (error) {
      this.errors.push('axios not properly installed - lock file sync issue');
    }
    
    try {
      execSync('npm audit fix --dry-run', { stdio: 'pipe' });
      console.log('✅ No critical audit issues');
    } catch (error) {
      this.warnings.push('npm audit found issues');
    }
  }

  printResults() {
    console.log('\n📊 Validation Results:');
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }
  }
}

if (require.main === module) {
  new DependencyValidator().validate();
}

module.exports = DependencyValidator; 