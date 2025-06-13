#!/usr/bin/env ts-node

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

const ENV_VARIABLES: EnvVariable[] = [
  {
    name: 'NODE_ENV',
    required: false,
    description: 'Node.js environment (development, production, test)',
    validator: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, production, test'
  },
  {
    name: 'SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validator: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
    errorMessage: 'SUPABASE_URL must be a valid Supabase URL (https://....supabase.co)'
  },
  {
    name: 'SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    validator: (value) => value.length > 50,
    errorMessage: 'SUPABASE_ANON_KEY appears to be too short'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service role key (for admin operations)',
    validator: (value) => value.length > 50,
    errorMessage: 'SUPABASE_SERVICE_ROLE_KEY appears to be too short'
  },
  {
    name: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for AI functionality',
    validator: (value) => value.startsWith('sk-') && value.length > 40,
    errorMessage: 'OPENAI_API_KEY must start with "sk-" and be at least 40 characters long'
  },
  {
    name: 'TELEGRAM_BOT_TOKEN',
    required: true,
    description: 'Telegram bot token',
    validator: (value) => /^\d+:[A-Za-z0-9_-]+$/.test(value),
    errorMessage: 'TELEGRAM_BOT_TOKEN must be in format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
  },
  {
    name: 'TELEGRAM_WEBHOOK_SECRET',
    required: false,
    description: 'Secret token for Telegram webhook verification',
    validator: (value) => value.length >= 32,
    errorMessage: 'TELEGRAM_WEBHOOK_SECRET should be at least 32 characters long'
  },
  {
    name: 'NEXT_TELEMETRY_DISABLED',
    required: false,
    description: 'Disable Next.js telemetry',
    validator: (value) => ['1', 'true'].includes(value.toLowerCase()),
    errorMessage: 'NEXT_TELEMETRY_DISABLED should be "1" or "true"'
  },
  {
    name: 'VERCEL_URL',
    required: false,
    description: 'Vercel deployment URL (automatically set)',
    validator: (value) => value.includes('.vercel.app') || value.includes('.') ,
    errorMessage: 'VERCEL_URL should be a valid domain'
  }
];

class EnvironmentValidator {
  private errors: string[] = [];
  private warnings: string[] = [];
  private info: string[] = [];

  private validateVariable(envVar: EnvVariable): void {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        this.errors.push(`❌ ${envVar.name} is required but not set. ${envVar.description}`);
      } else {
        this.warnings.push(`⚠️  ${envVar.name} is not set (optional). ${envVar.description}`);
      }
      return;
    }

    // Validate the value if validator is provided
    if (envVar.validator && !envVar.validator(value)) {
      this.errors.push(`❌ ${envVar.name} is invalid. ${envVar.errorMessage || 'Invalid format'}`);
      return;
    }

    this.info.push(`✅ ${envVar.name} is properly set`);
  }

  public validate(): boolean {
    console.log('🔍 Validating environment variables...\n');

    // Validate all environment variables
    for (const envVar of ENV_VARIABLES) {
      this.validateVariable(envVar);
    }

    // Print results
    if (this.info.length > 0) {
      console.log('✅ Valid Environment Variables:');
      this.info.forEach(msg => console.log(`  ${msg}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(msg => console.log(`  ${msg}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(msg => console.log(`  ${msg}`));
      console.log('');
    }

    // Print summary
    console.log('📊 Environment Validation Summary:');
    console.log('='.repeat(50));
    console.log(`✅ Valid: ${this.info.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log('');

    const hasErrors = this.errors.length > 0;
    
    if (hasErrors) {
      console.log('❌ Environment validation FAILED. Please fix the errors above.');
      console.log('\n💡 Tips:');
      console.log('  • Check your .env.local file for missing variables');
      console.log('  • Ensure all keys are properly formatted');
      console.log('  • Verify URLs and API keys are valid');
      return false;
    } else if (this.warnings.length > 0) {
      console.log('⚠️  Environment validation PASSED with warnings.');
      console.log('  Optional variables are missing but deployment can proceed.');
      return true;
    } else {
      console.log('✅ All environment variables are properly configured!');
      return true;
    }
  }

  public generateEnvTemplate(): void {
    console.log('\n📝 Environment Template (.env.local):');
    console.log('='.repeat(50));

    for (const envVar of ENV_VARIABLES) {
      const required = envVar.required ? '(required)' : '(optional)';
      console.log(`# ${envVar.description} ${required}`);
      console.log(`${envVar.name}=`);
      console.log('');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  
  // Check for --template flag
  if (process.argv.includes('--template')) {
    validator.generateEnvTemplate();
    process.exit(0);
  }

  const success = validator.validate();
  
  if (!success && process.argv.includes('--template-on-fail')) {
    validator.generateEnvTemplate();
  }

  process.exit(success ? 0 : 1);
}

export { EnvironmentValidator, ENV_VARIABLES }; 