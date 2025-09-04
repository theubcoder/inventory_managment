const { exec } = require('child_process');
const path = require('path');

console.log('Generating Prisma Client...');

// Run prisma generate
exec('npx prisma generate', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }
  console.log(`stdout: ${stdout}`);
  console.log('Prisma Client generated successfully!');
});