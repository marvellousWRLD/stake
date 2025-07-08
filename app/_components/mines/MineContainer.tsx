"use client";
import React, { useState, useRef } from "react";
import ConfigComponent from "./ConfigComponent";
import GridComponent from "./GridComponent";
import { useAuthStore } from "@/app/_store/commonStore";

export default function MineContainer() {
  // --- lifted state ---
  const [revealedTiles, setRevealedTiles] = useState<number[]>([]);
  const [showModal, setShowModal]         = useState(false);
  const [currentProfit, setCurrentProfit] = useState<number | null>(null);
  const [modalResult, setModalResult]     = useState<"win" | "lose" | null>(null);
  const [netProfit, setNetProfit]         = useState<number | null>(null);

  const { user, token, fetchUser } = useAuthStore();

  // refs that ConfigComponent uses to control the game
  const setGameStartedRef   = useRef<(v: boolean) => void>(() => {});
  const clearConfigStoreRef = useRef<() => void>(() => {});
  const resetGameRef        = useRef<() => void>(() => {});
  const resetGridRef        = useRef<() => void>(() => {});

  // Bet & grid settings (lifted up)
  const [betAmount, setBetAmount]         = useState<number>(0);
  const [numberOfMines, setNumberOfMines] = useState<number>(0);
  const [minePositions, setMinePositions] = useState<number[]>([]);

  // Controls whether clicking & cash-out is enabled
  const [gameStarted, setGameStarted]     = useState(false);
  // Which squares to reveal when the round ends
  const [revealMode, setRevealMode] =
    useState<"none" | "mines" | "all">("none");

  // wire the ref so ConfigComponent can call setGameStarted
  setGameStartedRef.current = setGameStarted;

  // --- When a mine is hit (i.e. you bust) ---
  const handleMineHit = async (tiles: number[]) => {
    if (!user || !token) return;

    // send the play to the server
    const res = await fetch("/api/mines/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betAmount,
        numberOfMines,
        revealedTiles: tiles,
        minePositions,
        username: user.username,
      }),
    });
    const data = await res.json();

    // show the result modal
    setShowModal(true);
    setCurrentProfit(data.payout);
    setNetProfit(data.win ? data.payout - betAmount : -betAmount);
    setModalResult(data.win ? "win" : "lose");
    if (data.newBalance != null) fetchUser(token!);

    // End the round (disable further clicks & cash-out)
    setGameStarted(false);
    setGameStartedRef.current(false);

    // ONLY reveal the mines (keep your bet / mine settings intact)
    setRevealMode("mines");
  };

  // --- When you cash out successfully ---
  const handleCashOut = (
    data: any,
    modalMultiplier: number,
    result: "win" | "lose"
  ) => {
    setShowModal(true);
    setCurrentProfit(data.payout);
    setNetProfit(data.win ? data.payout - betAmount : -betAmount);
    setModalResult(result);
    if (data.newBalance != null) fetchUser(token!);

    // Reveal every tile on a win
    setRevealMode("all");
  };

  return (
    <div className="flex flex-col md:flex-row w-full bg-background text-white rounded-lg">
      {/* Configuration Panel */}
      <div className="w-full md:w-[380px] p-6 bg-primary rounded-l-lg border-r border-gray-800">
        <ConfigComponent
          revealedTiles={revealedTiles}
          setRevealedTiles={setRevealedTiles}
          setGameStartedRef={setGameStartedRef}
          clearConfigStoreRef={clearConfigStoreRef}
          resetGameRef={resetGameRef}
          resetGridRef={resetGridRef}
          setBetAmountParent={setBetAmount}
          setNumberOfMinesParent={setNumberOfMines}
          setMinePositions={setMinePositions}
          minePositions={minePositions}
          gameStarted={gameStarted}
          showModal={showModal}
          setShowModal={setShowModal}
          revealMode={revealMode}
          onCashOut={handleCashOut}
          setRevealMode={setRevealMode}
        />
      </div>

      {/* Grid Display */}
      <div className="flex-1 flex flex-col p-4">
        <GridComponent
          revealedTiles={revealedTiles}
          setRevealedTiles={setRevealedTiles}
          onMineHit={handleMineHit}
          gameStarted={gameStarted}
          minePositions={minePositions}
          revealMode={revealMode}
        />
      </div>
    </div>
  );
}
