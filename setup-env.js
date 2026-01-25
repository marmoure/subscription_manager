const fs = require('fs');
const path = require('path');

// Create config directory
const configDir = path.join(__dirname, 'apps', 'backend', 'src', 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('✓ Created config directory');
}

// Backend environment files
const backendDir = path.join(__dirname, 'apps', 'backend');
const backendEnvExample = path.join(backendDir, '.env.example');
const backendEnv = path.join(backendDir, '.env');

// Frontend environment files
const frontendDir = path.join(__dirname, 'apps', 'frontend');
const frontendEnvExample = path.join(frontendDir, '.env.example');
const frontendEnv = path.join(frontendDir, '.env');

// Create backend .env from .env.example if it doesn't exist
if (fs.existsSync(backendEnvExample)) {
  if (!fs.existsSync(backendEnv)) {
    fs.copyFileSync(backendEnvExample, backendEnv);
    console.log('✓ Created apps/backend/.env from .env.example');
  } else {
    console.log('ℹ apps/backend/.env already exists, skipping...');
  }
} else {
  console.warn('⚠ apps/backend/.env.example not found');
}

// Create frontend .env from .env.example if it doesn't exist
if (fs.existsSync(frontendEnvExample)) {
  if (!fs.existsSync(frontendEnv)) {
    fs.copyFileSync(frontendEnvExample, frontendEnv);
    console.log('✓ Created apps/frontend/.env from .env.example');
  } else {
    console.log('ℹ apps/frontend/.env already exists, skipping...');
  }
} else {
  console.warn('⚠ apps/frontend/.env.example not found');
}

console.log('\n✅ Environment setup complete!');
console.log('\n💡 Next steps:');
console.log('  1. Review and update apps/backend/.env with your actual configuration');
console.log('  2. Review and update apps/frontend/.env if needed');
console.log('  3. Run "pnpm dev" to start the development servers');
