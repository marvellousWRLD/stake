"use client";
import React, { useState, useRef } from "react";
import SlideComponent from "./SlideComponent";
import SlideConfig from "./SlideConfig";
import { useSlideStore } from "@/app/_store/SlideStore";
import { useAuthStore } from "@/app/_store/commonStore";

export default function SlideContainer() {
  const {
    setIsRolling,
    setDisplayMultiplier,
    recentWins,
    setRecentWins,
    multiplier,
  } = useSlideStore();

  const { user, token, fetchUser } = useAuthStore();

  const handleBet = async (amount: number) => {
    if (!user || !token) return;
    setIsRolling(true);
    const res = await fetch("/api/slide/play", {
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
  };

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
        <SlideConfig onBet={handleBet} />
      </div>
      <div className="w-full md:w-2/3">
        <SlideComponent onFinish={handleFinish} />
      </div>
    </div>
  );
}
