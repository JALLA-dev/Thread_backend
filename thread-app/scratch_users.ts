import * as fs from 'fs';
const envFile = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

import { db } from './src/db';
import { users } from './src/db/schema';

async function main() {
  const allUsers = await db.select().from(users);
  console.log('ALL USERS:', allUsers.map(u => ({ id: u.id, username: u.username, email: u.email })));
  process.exit(0);
}
main();
