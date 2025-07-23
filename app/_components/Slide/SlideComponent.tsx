"use client";
import { useState, useEffect } from "react";
import { useSlideStore } from "@/app/_store/SlideStore";

interface SlideComponentProps {
  onFinish?: (random: number, isWin: boolean) => void;
}

export default function SlideComponent({ onFinish }: SlideComponentProps) {
  const {
    isRolling,
    setIsRolling,
    displayMultiplier,
    recentWins,
    multiplier: targetMultiplier,
  } = useSlideStore();

  const [animatedMultiplier, setAnimatedMultiplier] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRolling) {
      setAnimatedMultiplier(0);
      const speed = 100;
      const increment = 0.1;
      const duration = 1000;
      const start = Date.now();

      intervalId = setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 1 ? progress ** 2 : 1;
        const next = eased * displayMultiplier;

        if (progress >= 1 && next >= displayMultiplier - increment) {
          clearInterval(intervalId);
          setAnimatedMultiplier(displayMultiplier);
          setIsRolling(false);

          const didWin = displayMultiplier >= targetMultiplier;
          onFinish?.(displayMultiplier, didWin);
        } else {
          setAnimatedMultiplier(next);
        }
      }, speed);
    }

    return () => clearInterval(intervalId);
  }, [isRolling, displayMultiplier, setIsRolling, onFinish, targetMultiplier]);

  const formatted = (isRolling ? animatedMultiplier : displayMultiplier).toFixed(2);

  const resultColor =
    !isRolling && displayMultiplier >= targetMultiplier
      ? "text-success"
      : "text-white";

  return (
    <div className="w-full aspect-square bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-3 md:p-6 lg:p-8 flex flex-col">
      <div className="flex flex-row-reverse items-center w-full justify-end gap-2 overflow-x-auto no-scrollbar">
        {recentWins.slice(-17).map((item, i) => (
          <div key={i} className="flex-shrink-0">
            <div
              className={`w-8 h-4 px-6 py-4 rounded-full flex items-center justify-center ${
                item.isWin ? "bg-success text-black" : "bg-neutral-700 text-white"
              }`}
            >
              <span className="text-xs font-bold">{item.randomNumber.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 w-full flex items-center justify-center">
        <span
          className={`font-bold text-7xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl transition-all duration-300 ${
            isRolling ? "animate-pulse text-white" : resultColor
          }`}
        >
          {formatted}X
        </span>
      </div>
    </div>
  );
}
