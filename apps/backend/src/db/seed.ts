import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Initialize database connection
const client = new Database(process.env.DATABASE_URL || 'dev.db');
const db = drizzle(client, { schema });

async function seed() {
    console.log('🌱 Starting database seeding...');

    try {
        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing data...');
        await db.delete(schema.licenseStatusLogs);
        await db.delete(schema.verificationLogs);
        await db.delete(schema.userSubmissions);
        await db.delete(schema.licenseKeys);
        await db.delete(schema.apiKeys);
        await db.delete(schema.adminUsers);
        await db.delete(schema.users);

        // Seed Admin Users
        console.log('👤 Seeding admin users...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const hashedPassword2 = await bcrypt.hash('superadmin123', 10);

        const admins = await db.insert(schema.adminUsers).values([
            {
                username: 'admin',
                hashedPassword: hashedPassword,
                role: 'admin',
                isActive: true,
            },
            {
                username: 'superadmin',
                hashedPassword: hashedPassword2,
                role: 'super-admin',
                isActive: true,
            },
        ]).returning();

        const [admin1, admin2] = admins;

        console.log(`✅ Created ${admins.length} admin users`);
        console.log(`   Admin 1 ID: ${admin1.id}, Username: ${admin1.username}`);
        console.log(`   Admin 2 ID: ${admin2.id}, Username: ${admin2.username}`);

        // Seed API Keys
        console.log('🔑 Seeding API keys...');
        const apiKey1 = crypto.randomBytes(32).toString('hex');
        const apiKey2 = crypto.randomBytes(32).toString('hex');

        await db.insert(schema.apiKeys).values([
            {
                key: apiKey1,
                name: 'Production API Key',
                isActive: true,
                usageCount: 150,
            },
            {
                key: apiKey2,
                name: 'Development API Key',
                isActive: true,
                usageCount: 45,
            },
        ]);

        console.log(`✅ Created 2 API keys`);
        console.log(`   Production Key: ${apiKey1}`);
        console.log(`   Development Key: ${apiKey2}`);

        // Seed License Keys
        console.log('🎫 Seeding license keys...');
        const generateLicenseKey = () => {
            const segments = [];
            for (let i = 0; i < 4; i++) {
                segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
            }
            return segments.join('-');
        };

        const licenseKeysData = [
            {
                licenseKey: generateLicenseKey(),
                machineId: 'MACHINE-001-ABC123',
                status: 'active' as const,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15'),
                expiresAt: new Date('2025-01-15'),
            },
            {
                licenseKey: generateLicenseKey(),
                machineId: 'MACHINE-002-DEF456',
                status: 'active' as const,
                createdAt: new Date('2024-02-20'),
                updatedAt: new Date('2024-02-20'),
                expiresAt: new Date('2025-02-20'),
            },
            {
                licenseKey: generateLicenseKey(),
                machineId: 'MACHINE-003-GHI789',
                status: 'inactive' as const,
                createdAt: new Date('2024-03-10'),
                updatedAt: new Date('2024-06-10'),
                expiresAt: new Date('2024-06-10'),
            },
            {
                licenseKey: generateLicenseKey(),
                machineId: 'MACHINE-004-JKL012',
                status: 'revoked' as const,
                createdAt: new Date('2024-04-05'),
                updatedAt: new Date('2024-05-01'),
                expiresAt: new Date('2025-04-05'),
                revokedAt: new Date('2024-05-01'),
            },
            {
                licenseKey: generateLicenseKey(),
                machineId: 'MACHINE-005-MNO345',
                status: 'active' as const,
                createdAt: new Date('2024-05-12'),
                updatedAt: new Date('2024-05-12'),
                expiresAt: new Date('2025-05-12'),
            },
        ];

        const insertedLicenses = await db.insert(schema.licenseKeys).values(licenseKeysData).returning();
        console.log(`✅ Created ${insertedLicenses.length} license keys`);

        // Seed User Submissions
        console.log('📝 Seeding user submissions...');
        const submissionsData = [
            {
                name: 'John Doe',
                machineId: 'MACHINE-001-ABC123',
                phone: '+1234567890',
                shopName: 'Tech Store Downtown',
                numberOfCashiers: 3,
                submissionDate: new Date('2024-01-15'),
                ipAddress: '192.168.1.100',
                licenseKeyId: insertedLicenses[0].id,
            },
            {
                name: 'Jane Smith',
                machineId: 'MACHINE-002-DEF456',
                phone: '+1234567891',
                shopName: 'Fashion Boutique',
                numberOfCashiers: 2,
                submissionDate: new Date('2024-02-20'),
                ipAddress: '192.168.1.101',
                licenseKeyId: insertedLicenses[1].id,
            },
            {
                name: 'Bob Johnson',
                machineId: 'MACHINE-003-GHI789',
                phone: '+1234567892',
                shopName: 'Hardware Supplies',
                numberOfCashiers: 5,
                submissionDate: new Date('2024-03-10'),
                ipAddress: '192.168.1.102',
                licenseKeyId: insertedLicenses[2].id,
            },
            {
                name: 'Alice Williams',
                machineId: 'MACHINE-004-JKL012',
                phone: '+1234567893',
                shopName: 'Grocery Mart',
                numberOfCashiers: 4,
                submissionDate: new Date('2024-04-05'),
                ipAddress: '192.168.1.103',
                licenseKeyId: insertedLicenses[3].id,
            },
            {
                name: 'Charlie Brown',
                machineId: 'MACHINE-005-MNO345',
                phone: '+1234567894',
                shopName: 'Coffee Shop Central',
                numberOfCashiers: 2,
                submissionDate: new Date('2024-05-12'),
                ipAddress: '192.168.1.104',
                licenseKeyId: insertedLicenses[4].id,
            },
        ];

        await db.insert(schema.userSubmissions).values(submissionsData);
        console.log(`✅ Created ${submissionsData.length} user submissions`);

        // Seed Verification Logs
        console.log('📊 Seeding verification logs...');
        const verificationLogsData = [
            {
                licenseKeyId: insertedLicenses[0].id,
                machineId: 'MACHINE-001-ABC123',
                status: 'success' as const,
                message: 'License verified successfully',
                ipAddress: '192.168.1.100',
                timestamp: new Date('2024-01-16'),
            },
            {
                licenseKeyId: insertedLicenses[0].id,
                machineId: 'MACHINE-001-ABC123',
                status: 'success' as const,
                message: 'License verified successfully',
                ipAddress: '192.168.1.100',
                timestamp: new Date('2024-01-20'),
            },
            {
                licenseKeyId: insertedLicenses[1].id,
                machineId: 'MACHINE-002-DEF456',
                status: 'success' as const,
                message: 'License verified successfully',
                ipAddress: '192.168.1.101',
                timestamp: new Date('2024-02-21'),
            },
            {
                licenseKeyId: insertedLicenses[2].id,
                machineId: 'MACHINE-003-GHI789',
                status: 'failed' as const,
                message: 'License expired',
                ipAddress: '192.168.1.102',
                timestamp: new Date('2024-06-15'),
            },
            {
                licenseKeyId: insertedLicenses[3].id,
                machineId: 'MACHINE-004-JKL012',
                status: 'failed' as const,
                message: 'License revoked',
                ipAddress: '192.168.1.103',
                timestamp: new Date('2024-05-02'),
            },
        ];

        await db.insert(schema.verificationLogs).values(verificationLogsData);
        console.log(`✅ Created ${verificationLogsData.length} verification logs`);

        // Seed License Status Logs
        console.log('📋 Seeding license status logs...');
        const statusLogsData = [
            {
                licenseKeyId: insertedLicenses[2].id,
                oldStatus: 'active' as const,
                newStatus: 'inactive' as const,
                adminId: admin1.id,
                reason: 'License expired',
                timestamp: new Date('2024-06-10'),
            },
            {
                licenseKeyId: insertedLicenses[3].id,
                oldStatus: 'active' as const,
                newStatus: 'revoked' as const,
                adminId: admin2.id,
                reason: 'Fraudulent activity detected',
                timestamp: new Date('2024-05-01'),
            },
        ];

        await db.insert(schema.licenseStatusLogs).values(statusLogsData);
        console.log(`✅ Created ${statusLogsData.length} license status logs`);

        // Seed Users (basic users table)
        console.log('👥 Seeding users...');
        await db.insert(schema.users).values([
            {
                name: 'Test User 1',
            },
            {
                name: 'Test User 2',
            },
        ]);
        console.log(`✅ Created 2 users`);

        console.log('\n✨ Database seeding completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   - Admin Users: 2`);
        console.log(`   - API Keys: 2`);
        console.log(`   - License Keys: ${insertedLicenses.length}`);
        console.log(`   - User Submissions: ${submissionsData.length}`);
        console.log(`   - Verification Logs: ${verificationLogsData.length}`);
        console.log(`   - License Status Logs: ${statusLogsData.length}`);
        console.log(`   - Users: 2`);
        console.log('\n🔐 Admin Credentials:');
        console.log('   Username: admin | Password: admin123 | Role: admin');
        console.log('   Username: superadmin | Password: superadmin123 | Role: super-admin');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        client.close();
    }
}

// Run the seed function
seed()
    .then(() => {
        console.log('\n✅ Seeding process finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding process failed:', error);
        process.exit(1);
    });
