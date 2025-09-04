@echo off
echo Setting up database...
echo.
echo Step 1: Installing dependencies...
call npm install
echo.
echo Step 2: Generating Prisma Client...
call npx prisma generate
echo.
echo Step 3: Pushing schema to database...
call npx prisma db push
echo.
echo Database setup complete!
echo.
echo Please make sure you have configured your DATABASE_URL in .env.local
pause