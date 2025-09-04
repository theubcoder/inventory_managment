import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initPrisma() {
  console.log('Initializing Prisma...');
  
  try {
    // Try to import PrismaClient to check if it's generated
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      console.log('✅ Prisma Client is already generated and working!');
      await prisma.$disconnect();
      return;
    } catch (error) {
      console.log('Prisma Client not generated. Will generate now...');
    }
    
    // Download and run Prisma CLI
    console.log('Installing Prisma CLI temporarily...');
    const { stdout: installOutput } = await execAsync('npm install --no-save prisma@latest', { cwd: __dirname });
    console.log(installOutput);
    
    // Generate Prisma Client
    console.log('Generating Prisma Client...');
    const { stdout: generateOutput } = await execAsync('npx prisma generate', { cwd: __dirname });
    console.log(generateOutput);
    
    console.log('✅ Prisma Client generated successfully!');
    
    // Test the connection
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n📝 Please make sure you have:');
    console.log('1. Set up your DATABASE_URL in .env.local');
    console.log('2. Valid Neon database credentials');
  }
}

initPrisma();