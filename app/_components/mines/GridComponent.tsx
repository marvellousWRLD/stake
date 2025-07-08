/* eslint-disable @next/next/no-img-element */
"use client";

import { useConfigStore } from "@/app/_store/configStore";
import { useGridStore } from "@/app/_store/gridStore";
import { useEffect, Dispatch, SetStateAction } from "react";

export default function GridComponent({
  revealedTiles,
  setRevealedTiles,
  onMineHit,
  gameStarted,
  minePositions,
  revealMode,
}: {
  revealedTiles: number[];
  setRevealedTiles: Dispatch<SetStateAction<number[]>>;
  onMineHit: (tiles: number[]) => void;
  gameStarted: boolean;
  minePositions: number[];
  revealMode: "none" | "mines" | "all";
}) {
  const { handleSelectGrid, numberOfSuccessfulClicks, setNumberOfSuccessfulClicks } =
    useGridStore();
  const { isGameSetup } = useConfigStore();

  useEffect(() => {
    if (isGameSetup) {
      // we clear the visual grid in the store if needed
    }
  }, [isGameSetup]);

  const handleGridClick = (index: number) => {
    if (!isGameSetup || !gameStarted) return;

    const isMine = minePositions.includes(index);
    if (isMine) {
      handleSelectGrid(index);
      new Audio("/assets/audio/mine-audio.mp3").play();
      onMineHit([...revealedTiles, index]);
    } else if (!revealedTiles.includes(index)) {
      handleSelectGrid(index);
      setNumberOfSuccessfulClicks(numberOfSuccessfulClicks + 1);
      setRevealedTiles((prev) => [...prev, index]);
      new Audio("/assets/audio/win-audio.mp3").play();
    }
  };

  return (
    <div className="grid grid-cols-5 gap-3 w-full max-w-xl mx-auto">
      {Array.from({ length: 25 }).map((_, index) => {
        const isClicked = revealedTiles.includes(index);
        const isMine = minePositions.includes(index);

        // ** NEW ** treat any mine in 'mines' mode as if it had been clicked
        const trulyClicked = isClicked || (revealMode === "mines" && isMine);

        const baseClasses = `
          aspect-square w-full min-h-18 flex justify-center
          items-center transition-all rounded-md duration-500
        `;

        const clickedClasses = trulyClicked
          ? isMine
            ? "border-red-500 text-white animate-shake bg-[#071924] scale-95"
            : "border-green-500 text-white animate-pop bg-[#071924] scale-95"
          : "bg-[#2f4553] hover:scale-105 active:scale-95 active:bg-[#071924]";

        const greyOut =
          revealMode === "all" && !isClicked ? "opacity-50 grayscale" : "";

        // only show content if clicked, or if reveal-mode says so
        const isRevealed =
          isClicked ||
          revealMode === "all" ||
          (revealMode === "mines" && isMine);

        return (
          <div
            key={index}
            className={`${baseClasses} ${clickedClasses}`}
            onClick={() => handleGridClick(index)}
          >
            {isRevealed && (
              <div
                className={`relative flex p-2 items-center justify-center
                  w-full h-full bg-primary text-white font-bold rounded-md
                  ${greyOut}`}
              >
                <img
                  src={isMine ? "/assets/mine.svg" : "/assets/diamond.svg"}
                  alt={isMine ? "bomb" : "coins"}
                  className="w-4/5 h-4/5 animate-fade-in"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
