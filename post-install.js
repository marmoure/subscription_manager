const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🚀 Running post-install setup...\n');

// Check if this is running during the initial install (dependencies might not be ready yet)
const backendNodeModules = path.join(__dirname, 'apps', 'backend', 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
    console.log('⚠️  Backend dependencies not yet installed, skipping post-install setup');
    console.log('💡 Run "pnpm setup:env && pnpm setup:db" manually after installation completes');
    process.exit(0);
}

/**
 * Execute a command and handle errors
 * @param {string} command - Command to execute
 * @param {string} description - Description of the command
 * @param {boolean} optional - Whether the command is optional
 */
function runCommand(command, description, optional = false) {
    try {
        console.log(`\n📦 ${description}...`);
        execSync(command, {
            stdio: 'inherit',
            cwd: __dirname
        });
        console.log(`✅ ${description} completed`);
        return true;
    } catch (error) {
        if (optional) {
            console.warn(`⚠️  ${description} failed (optional step, continuing...)`);
            return false;
        } else {
            console.error(`❌ ${description} failed`);
            throw error;
        }
    }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean}
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

try {
    // Step 1: Run environment setup
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 1: Environment Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    runCommand('node setup-env.js', 'Setting up environment variables and RSA keys');

    // Step 2: Check if backend .env exists
    const backendEnvPath = path.join(__dirname, 'apps', 'backend', '.env');
    if (!fileExists(backendEnvPath)) {
        console.warn('\n⚠️  Backend .env file not found. Database setup will be skipped.');
        console.log('💡 Please create apps/backend/.env and run: pnpm run setup:db');
        process.exit(0);
    }

    // Step 3: Generate and push database schema
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Step 2: Database Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Check if database already exists
    const dbPath = path.join(__dirname, 'apps', 'backend', 'dev.db');
    const dbExists = fileExists(dbPath);

    if (dbExists) {
        console.log('ℹ️  Database file already exists');
        console.log('💡 Skipping database generation. To regenerate, delete dev.db and run: pnpm run setup:db');
    } else {
        // Push schema to database (creates tables directly without migration files)
        runCommand(
            'pnpm --filter @vibe/backend db:push',
            'Pushing database schema'
        );

        // Step 4: Seed the database
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Step 3: Database Seeding');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        runCommand(
            'pnpm --filter @vibe/backend db:seed',
            'Seeding database with initial data'
        );
    }

    // Success message
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✨ Post-install setup completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 What was set up:');
    console.log('  ✓ Environment variables (.env files)');
    console.log('  ✓ RSA key pair for license signing');
    if (!dbExists) {
        console.log('  ✓ Database schema (SQLite)');
        console.log('  ✓ Sample data (admin users, API keys, etc.)');
    }

    console.log('\n🔐 Default Admin Credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    console.log('');
    console.log('  Username: superadmin');
    console.log('  Password: superadmin123');
    console.log('  Role: super-admin');

    console.log('\n💡 Next steps:');
    console.log('  1. Review apps/backend/.env and update reCAPTCHA settings');
    console.log('  2. Run "pnpm dev" to start development servers');
    console.log('  3. Access the backend at http://localhost:3000');
    console.log('  4. Access the frontend at http://localhost:5173');

    console.log('\n📚 Useful commands:');
    console.log('  pnpm dev              - Start both frontend and backend');
    console.log('  pnpm backend:dev      - Start backend only');
    console.log('  pnpm frontend:dev     - Start frontend only');
    console.log('  pnpm backend:db:studio - Open Drizzle Studio (database GUI)');
    console.log('  pnpm backend:db:seed  - Re-seed the database');
    console.log('');

} catch (error) {
    console.error('\n❌ Post-install setup failed!');
    console.error('Error:', error.message);
    console.log('\n💡 You can manually run the setup steps:');
    console.log('  1. node setup-env.js');
    console.log('  2. pnpm --filter @vibe/backend db:push');
    console.log('  3. pnpm --filter @vibe/backend db:seed');
    process.exit(1);
}
