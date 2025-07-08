// app/api/plinko/bet/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const USERS_PATH = path.resolve(process.cwd(), 'users.json')

function loadUsers() {
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'))
}
function saveUsers(u: any[]) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(u, null, 2))
}
function getUser(users: any[], username: string) {
  return users.find(u => u.username === username)
}

export async function POST(req: NextRequest) {
  const { username, betAmount } = await req.json()
  if (typeof username !== 'string' || typeof betAmount !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const users = loadUsers()
  const user = getUser(users, username)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.wallet.balance < betAmount) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  // Deduct the bet
  user.wallet.balance -= betAmount
  saveUsers(users)

  return NextResponse.json({ newBalance: user.wallet.balance })
}
