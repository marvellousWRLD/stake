import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_PATH = path.resolve(process.cwd(), 'users.json');

function generateWallet() {
  const hex = [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    address: `wallet_${hex}`,
    balance: 1000,
  };
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }
  let users = [];
  if (fs.existsSync(USERS_PATH)) {
    users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
  }
  if (users.find((u: any) => u.username === username)) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const wallet = generateWallet();
  users.push({ username, password: hashedPassword, wallet });
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
  return NextResponse.json({ success: true });
} 