import { create } from "zustand";

interface SlideState {
  isRolling: boolean;
  setIsRolling: (val: boolean) => void;

  multiplier: number;
  setMultiplier: (val: number) => void;

  displayMultiplier: number;
  setDisplayMultiplier: (val: number) => void;

  recentWins: { isWin: boolean; randomNumber: number }[];
  setRecentWins: (wins: { isWin: boolean; randomNumber: number }[]) => void;
}

export const useSlideStore = create<SlideState>((set) => ({
  isRolling: false,
  setIsRolling: (val) => set({ isRolling: val }),

  multiplier: 1.5,
  setMultiplier: (val) => set({ multiplier: val }),

  displayMultiplier: 0,
  setDisplayMultiplier: (val) => set({ displayMultiplier: val }),

  recentWins: [],
  setRecentWins: (wins) => set({ recentWins: wins }),
}));
