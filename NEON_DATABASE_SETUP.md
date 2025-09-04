# Neon Database Setup Instructions

## Step 1: Create a Neon Account
1. Go to https://neon.tech
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your Database Credentials
After creating your project in Neon, you'll get:
- Database name
- Username
- Password
- Host (something like: ep-cool-darkness-123456.us-east-2.aws.neon.tech)

## Step 3: Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual Neon credentials:

```
DATABASE_URL="postgresql://[username]:[password]@[host].neon.tech/[database_name]?sslmode=require"
DIRECT_URL="postgresql://[username]:[password]@[host].neon.tech/[database_name]?sslmode=require"
```

Example:
```
DATABASE_URL="postgresql://inventory_owner:mypassword123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/inventory_db?sslmode=require"
DIRECT_URL="postgresql://inventory_owner:mypassword123@ep-cool-darkness-123456.us-east-2.aws.neon.tech/inventory_db?sslmode=require"
```

## Step 4: Install Dependencies
Run these commands in your terminal:

```bash
npm install @prisma/client
npm install -D prisma
```

## Step 5: Generate Prisma Client
```bash
npx prisma generate
```

## Step 6: Push Schema to Database
This will create all the tables in your Neon database:

```bash
npx prisma db push
```

## Step 7: (Optional) Seed Initial Data
If you want to add some initial data:

```bash
npx prisma db seed
```

## Step 8: Verify Connection
Test if everything is working:

```bash
npx prisma studio
```

This will open Prisma Studio in your browser where you can view and manage your database.

## Troubleshooting

### Connection Timeout
If you get connection timeout errors:
1. Make sure your Neon project is active (not paused)
2. Check that SSL mode is set to "require" in the connection string
3. Verify your credentials are correct

### Schema Changes
Whenever you modify `prisma/schema.prisma`, run:
```bash
npx prisma db push
npx prisma generate
```

### Database Reset
To reset your database (WARNING: This will delete all data):
```bash
npx prisma db push --force-reset
```

## Important Notes
- Neon databases auto-pause after 5 minutes of inactivity on the free tier
- They automatically wake up when you connect again
- Keep your database credentials secret - never commit them to Git