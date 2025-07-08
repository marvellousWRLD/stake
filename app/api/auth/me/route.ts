import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const USERS_PATH = path.resolve(process.cwd(), 'users.json');

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { username: string };
    let users = [];
    if (fs.existsSync(USERS_PATH)) {
      users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    }
    const user = users.find((u: any) => u.username === payload.username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ username: user.username, wallet: user.wallet });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
} 