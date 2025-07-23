"use client";
import React, { useState } from "react";
import { useSlideStore } from "@/app/_store/SlideStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SlideConfigProps {
  onBet: (amount: number) => void;
}

export default function SlideConfig({ onBet }: SlideConfigProps) {
  const [betAmount, setBetAmount] = useState<number>(0.001);
  const { multiplier, setMultiplier, isRolling } = useSlideStore();

  const handleBet = () => {
    if (!betAmount || betAmount <= 0 || isRolling) return;
    onBet(betAmount);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 w-full h-full text-white">
      <div>
        <label className="text-sm text-muted-foreground">Bet Amount (ETH)</label>
        <Input
          type="number"
          min={0.0001}
          step={0.0001}
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          disabled={isRolling}
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm text-muted-foreground">Target Multiplier</label>
        <Input
          type="number"
          min={1.01}
          step={0.01}
          value={multiplier}
          onChange={(e) => setMultiplier(Number(e.target.value))}
          disabled={isRolling}
          className="mt-1"
        />
      </div>

      <Button
        onClick={handleBet}
        disabled={isRolling}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isRolling ? "Rolling..." : "Start Slide"}
      </Button>
    </div>
  );
}
