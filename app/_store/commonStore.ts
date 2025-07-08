import { create } from "zustand";
import { persist } from "zustand/middleware";

type CommonStore = {
  profitAmount: number;
  setProfitAmount: (profitAmount: number) => void;
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
  balance: number;
  setBalance: (balance: number) => void;
  clearCommonState: () => void;
};

interface Wallet {
  address: string;
  balance: number;
}

interface AuthState {
  token: string | null;
  user: { username: string; wallet: Wallet } | null;
  setToken: (token: string | null) => void;
  setUser: (user: { username: string; wallet: Wallet } | null) => void;
  logout: () => void;
  fetchUser: (token: string) => Promise<void>;
}

export const useCommonStore = create<CommonStore>()(
  persist(
    (set, get) => ({
      profitAmount: 0,
      multiplier: 0,
      balance: 1000,
      setProfitAmount: (profitAmount) => set({ profitAmount }),
      setMultiplier: (multiplier) => set({ multiplier }),
      setBalance: (balance) => set({ balance: balance < 0 ? 0 : balance }),
      clearCommonState: () => {
        const currentBalance = get().balance;
        set({
          profitAmount: 0,
          multiplier: 0,
          balance: currentBalance < 100 ? 1000 : currentBalance,
        });
      },
    }),
    { name: "config-storage" }
  )
);

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  setToken: (token) => {
    set({ token });
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
  },
  setUser: (user) => set({ user }),
  logout: () => {
    set({ token: null, user: null });
    if (typeof window !== 'undefined') localStorage.removeItem('token');
  },
  fetchUser: async (token) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data });
      } else {
        set({ user: null, token: null });
        if (typeof window !== 'undefined') localStorage.removeItem('token');
      }
    } catch {
      set({ user: null, token: null });
      if (typeof window !== 'undefined') localStorage.removeItem('token');
    }
  },
}));
