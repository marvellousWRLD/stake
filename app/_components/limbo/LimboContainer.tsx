"use client";
import React, { useState, useRef } from "react";
import LimboComponent from "./LimboComponent";
import LimboConfig from "./LimboConfig";
import { useLimboStore } from "@/app/_store/limboStore";
import { useCommonStore, useAuthStore } from "@/app/_store/commonStore";

export default function LimboContainer() {
  const {
    setIsRolling,
    setDisplayMultiplier,
    recentWins,
    setRecentWins,
    multiplier,
  } = useLimboStore();
  const { user, token, fetchUser } = useAuthStore();

  // — remove setRecentWins from here —
  const handleBet = async (amount: number) => {
    if (!user || !token) return;
    setIsRolling(true);
    const res = await fetch("/api/limbo/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betAmount: amount,
        targetMultiplier: multiplier,
        username: user.username,
      }),
    });
    const data = await res.json();
    setDisplayMultiplier(data.randomMultiplier);
    // 👉 no longer call setRecentWins here
  };

  // called by LimboComponent when spin finishes
  const handleFinish = (random: number, isWin: boolean) => {
    if (!user || !token) return;
    fetchUser(token);
    setRecentWins([
      ...recentWins,
      { isWin, randomNumber: random },
    ]);
  };

  return (
    <div className="flex flex-col md:flex-row bg-background gap-4 md:gap-8 p-4 w-full max-w-6xl mx-auto">
      <div className="w-full md:w-1/3 bg-primary">
        <LimboConfig onBet={handleBet} />
      </div>
      <div className="w-full md:w-2/3">
        <LimboComponent onFinish={handleFinish} />
      </div>
    </div>
  );
}
