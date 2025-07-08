import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_PATH = path.resolve(process.cwd(), 'users.json');
const HOUSE_EDGE = 0.01;

function getUser(username: string) {
  const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
  return users.find((u: any) => u.username === username);
}

function updateUserBalance(username: string, newBalance: number) {
  const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
  const user = users.find((u: any) => u.username === username);
  if (user) user.wallet.balance = newBalance;
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

export async function POST(req: NextRequest) {
  const { betAmount, target, username } = await req.json();
  if (!betAmount || !target || !username) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const user = getUser(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.wallet.balance < betAmount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

  // Roll
  const roll = Math.floor(Math.random() * 100) + 1;
  const win = roll > target;
  const chance = target;
  const multiplier = (99 / chance) * (1 - HOUSE_EDGE);
  const payout = win ? betAmount * multiplier : 0;
  const newBalance = user.wallet.balance - betAmount + payout;
  updateUserBalance(username, newBalance);
  return NextResponse.json({ roll, win, payout, newBalance });
} 