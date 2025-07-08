import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_PATH = path.resolve(process.cwd(), 'users.json');

export async function POST(req: NextRequest) {
  const { username, balance } = await req.json();
  if (!username || typeof balance !== 'number') {
    return NextResponse.json({ error: 'Username and balance required' }, { status: 400 });
  }
  let users = [];
  if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  }
  const user = users.find((u: any) => u.username === username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (!user.wallet) {
    user.wallet = { address: '', balance: 1000 };
  }
  user.wallet.balance = balance;
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
  return NextResponse.json({ success: true, balance: user.wallet.balance });
} 