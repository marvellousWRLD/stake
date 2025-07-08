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

function combinations(n: number, k: number) {
  if (k > n) return 0;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res *= (n - i + 1) / i;
  }
  return res;
}

export async function POST(req: NextRequest) {
  const { betAmount, numberOfMines, revealedTiles, username, minePositions } = await req.json();
  if (!betAmount || !numberOfMines || !username || !Array.isArray(revealedTiles) || !Array.isArray(minePositions)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const user = getUser(username);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Use provided mine positions
  const totalTiles = 25;
  // Check if user hit a mine
  const hitMine = revealedTiles.some((tile: number) => minePositions.includes(tile));
  let payout = 0;
  let win = false;
  if (!hitMine) {
    // Combinatorial payout (corrected formula)
    const safePicks = revealedTiles.length;
    const multiplier = combinations(totalTiles - numberOfMines, safePicks) / combinations(totalTiles, safePicks);
    payout = betAmount * (1 / multiplier) * (1 - HOUSE_EDGE);
    win = true;
  }
  // Only add payout (bet was already deducted)
  const newBalance = user.wallet.balance + payout;
  updateUserBalance(username, newBalance);
  return NextResponse.json({ win, payout, newBalance, minePositions });
} 