"use client";
import { useState, useEffect } from "react";
import { useLimboStore } from "@/app/_store/limboStore";

interface LimboComponentProps {
  onFinish?: (random: number, isWin: boolean) => void;
}

export default function LimboComponent({ onFinish }: LimboComponentProps) {
  const {
    isRolling,
    setIsRolling,
    displayMultiplier,
    recentWins,    // (no longer used to record new wins here)
    multiplier: targetMultiplier,
  } = useLimboStore();

  const [animatedMultiplier, setAnimatedMultiplier] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRolling) {
      setAnimatedMultiplier(0);

      const animationSpeed = 100;
      const incrementAmount = 0.1;
      const minDuration = 1000;
      const startTime = Date.now();

      intervalId = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / minDuration, 1);
        const easedProgress = progress < 1 ? progress ** 2 : 1;
        const nextMultiplier = easedProgress * displayMultiplier;

        // once we've essentially reached the target…
        if (
          progress >= 1 &&
          nextMultiplier >= displayMultiplier - incrementAmount
        ) {
          clearInterval(intervalId);
          setAnimatedMultiplier(displayMultiplier);
          setIsRolling(false);

          // fire our “finished” callback
          const didWin = displayMultiplier >= targetMultiplier;
          onFinish?.(displayMultiplier, didWin);
        } else {
          setAnimatedMultiplier(nextMultiplier);
        }
      }, animationSpeed);
    }

    return () => clearInterval(intervalId);
  }, [isRolling, displayMultiplier, setIsRolling, onFinish, targetMultiplier]);

  const formatted = (isRolling
    ? animatedMultiplier
    : displayMultiplier
  ).toFixed(2);

  // once isRolling==false, color green if >= targetMultiplier
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
                item.isWin
                  ? "bg-success text-black"
                  : "bg-neutral-700 text-white"
              }`}
            >
              <span className="text-xs font-bold">
                {item.randomNumber.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 w-full flex items-center justify-center">
      <span
  className={`
    font-bold
    text-7xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
    transition-all duration-300
    ${isRolling ? "animate-pulse text-white" : resultColor}
  `}
>
  {formatted}X
</span>

      </div>
    </div>
  );
}
