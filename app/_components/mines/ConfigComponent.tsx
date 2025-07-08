"use client";
import { type ChangeEvent, useEffect, useState } from "react";
import { useConfigStore } from "@/app/_store/configStore";
import { useGridStore } from "@/app/_store/gridStore";
import { useAuthStore } from "@/app/_store/commonStore";
import Modal from "@/app/_components/ui/Modal";
import { addGameResult } from "@/app/_constants/data";

export default function ConfigComponent({
  revealedTiles,
  setRevealedTiles,
  setGameStartedRef,
  clearConfigStoreRef,
  resetGameRef,
  resetGridRef,
  setBetAmountParent,
  setNumberOfMinesParent,
  setMinePositions,
  minePositions,
  gameStarted,
  showModal,
  revealMode,
  setShowModal,
  onCashOut,
  setRevealMode,
}: {
  revealedTiles: number[];
  setRevealedTiles: React.Dispatch<React.SetStateAction<number[]>>;
  setGameStartedRef: React.MutableRefObject<(v: boolean) => void>;
  clearConfigStoreRef: React.MutableRefObject<() => void>;
  resetGameRef: React.MutableRefObject<() => void>;
  resetGridRef: React.MutableRefObject<() => void>;
  setBetAmountParent?: React.Dispatch<React.SetStateAction<number>>;
  setNumberOfMinesParent?: React.Dispatch<React.SetStateAction<number>>;
  setMinePositions: React.Dispatch<React.SetStateAction<number[]>>;
  minePositions: number[];
  gameStarted: boolean;
  showModal: boolean;
  revealMode: "none" | "mines" | "all";  // ← NEW
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onCashOut: (data: any, modalMultiplier: number, modalResult: "win" | "lose") => void;
  setRevealMode: React.Dispatch<React.SetStateAction<"none" | "mines" | "all">>;
}) {
  const {
    numberOfMines,
    betAmount,
    setNumberOfMines,
    setBetAmount,
    handleSetupGame,
    setGameStarted,
    resetGame,
    clearConfigStore,
  } = useConfigStore();
  const { resetGrid } = useGridStore();
  const { user, token, fetchUser } = useAuthStore();

  const [currentProfit, setCurrentProfit] = useState<number | null>(null);
  const [netProfit, setNetProfit]       = useState<number | null>(null);
  const [modalResult, setModalResult]   = useState<"win" | "lose" | null>(null);
  const [modalMultiplier, setModalMultiplier] = useState<number>(0);

  const walletBalance = user?.wallet?.balance ?? 1000;

  const handleBetAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBetAmount(val === "" ? null : Number(val));
  };

  const handleNumMinesChange = (n: number) => {
    setNumberOfMines(n);
  };

  const handleBet = async () => {
    if (betAmount === null || betAmount > walletBalance) {
      alert("You don't have enough balance");
      return;
    }
    // 🔄 Reset to a fresh board
    setShowModal(false);
    setRevealMode("none");
    resetGrid();
    setRevealedTiles([]);

    // 🛡️ Randomize mines
    const total = 25;
    const mineSet = new Set<number>();
    while (mineSet.size < numberOfMines) {
      mineSet.add(Math.floor(Math.random() * total));
    }
    setMinePositions([...mineSet]);

    // 💸 Deduct bet on server
    if (user && token) {
      const res = await fetch("/api/mines/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount, username: user.username }),
      });
      const data = await res.json();
      if (data.newBalance != null) fetchUser(token);
    }

    setModalMultiplier(0);
    setModalResult(null);
    handleSetupGame();
    setGameStartedRef.current(true);
    setCurrentProfit(betAmount);
    // note: we already cleared revealedTiles above
  };
    useEffect(() => {
        if (showModal && revealMode === "mines") {
          setModalResult("lose");
          setModalMultiplier(0);
        }
      }, [showModal, revealMode]);
  // ⏱ Combinatorial multiplier logic (same as backend)
  function combinations(n: number, k: number) {
    if (k > n) return 0;
    let r = 1;
    for (let i = 1; i <= k; i++) {
      r *= (n - i + 1) / i;
    }
    return r;
  }
  const HOUSE_EDGE = 0.01;
  function calculateCombinatorialMultiplier(
    bet: number,
    mines: number,
    picks: number
  ) {
    if (bet && mines && picks > 0 && picks <= 25 - mines) {
      const num = combinations(25 - mines, picks);
      const den = combinations(25, picks);
      if (den > 0) {
        return (1 / (num / den)) * (1 - HOUSE_EDGE);
      }
    }
    return 0;
  }

  const safePicks = revealedTiles.length;
  const safeBet   = typeof betAmount === "number" ? betAmount : 0;
  const safeMines = typeof numberOfMines === "number" ? numberOfMines : 0;
  const unifiedMultiplier = calculateCombinatorialMultiplier(
    safeBet,
    safeMines,
    safePicks
  );
  const unifiedProfit =
    unifiedMultiplier > 0 ? unifiedMultiplier * safeBet : 0;

  const handleCashOut = async () => {
    if (!user || !token) return;
    const mult = calculateCombinatorialMultiplier(
      safeBet,
      safeMines,
      revealedTiles.length
    );
    setModalMultiplier(Number(mult.toFixed(2)));

    const res = await fetch("/api/mines/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betAmount,
        numberOfMines,
        revealedTiles,
        minePositions,
        username: user.username,
      }),
    });
    const data = await res.json();

    // 💥 End game
    setGameStartedRef.current(false);
    setGameStarted(false);
    clearConfigStore();
    resetGame();
    resetGrid();

    const result: "win" | "lose" = data.win ? "win" : "lose";
    const displayMult = data.win ? Number(mult.toFixed(2)) : 0;

    onCashOut(data, displayMult, result);
    setCurrentProfit(data.payout);
    setNetProfit(data.win ? data.payout - betAmount! : -betAmount!);
    setModalResult(result);

    if (data.newBalance != null) fetchUser(token);
    addGameResult(
      "Mines",
      data.win ? "Win" : "Loss",
      data.payout,
      data.newBalance
    );
  };

  const handleDisabledBetClick = () => {
    if (betAmount! > walletBalance) {
      alert("You don't have enough balance");
    }
  };

  useEffect(() => {
    setGameStartedRef.current = setGameStarted;
    clearConfigStoreRef.current = clearConfigStore;
    resetGameRef.current = resetGame;
    resetGridRef.current = resetGrid;
  }, [
    setGameStartedRef,
    clearConfigStoreRef,
    resetGameRef,
    resetGridRef,
    setGameStarted,
    clearConfigStore,
    resetGame,
    resetGrid,
  ]);

  useEffect(() => {
    setBetAmountParent?.(betAmount ?? 0);
  }, [betAmount, setBetAmountParent]);

  useEffect(() => {
    setNumberOfMinesParent?.(numberOfMines ?? 0);
  }, [numberOfMines, setNumberOfMinesParent]);

  const handleCloseModal = () => {
    setShowModal(false);
    setModalMultiplier(0);
    setModalResult(null);
  };

  return (
    <div className="flex flex-col gap-6 p-4 text-white max-w-md mx-auto rounded-lg">
      {/* Bet Amount */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[#b0b9d2]">Bet Amount</span>
          <span className="text-white">
            ${walletBalance ? walletBalance.toFixed(2) : "0.00"}
          </span>
        </div>
        <div className="flex bg-[#1e2a36] rounded-md overflow-hidden">
          <div className="flex-1 flex items-center relative">
            <input
              type="number"
              id="betAmount"
              value={betAmount !== null ? betAmount : ""}
              min={10}
              onChange={handleBetAmountChange}
              className="w-full bg-[#1e2a36] px-3 py-3 outline-none"
              disabled={gameStarted}
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <button
            className="bg-[#1e2a36] px-6 border-l border-[#2c3a47] hover:bg-[#2c3a47] transition-colors"
            onClick={() =>
              betAmount && betAmount > 0 && setBetAmount(betAmount / 2)
            }
            disabled={gameStarted}
          >
            ½
          </button>
          <button
            className="bg-[#1e2a36] px-6 border-l border-[#2c3a47] hover:bg-[#2c3a47] transition-colors"
            onClick={() =>
              betAmount && betAmount > 0 && setBetAmount(betAmount * 2)
            }
            disabled={gameStarted}
          >
            2×
          </button>
        </div>
        {betAmount! > walletBalance && !gameStarted && (
          <p className="mt-1 text-sm font-medium text-red-500">
            Insufficient balance!
          </p>
        )}
      </div>

      {/* Number of Mines */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[#b0b9d2]">Mines</span>
        </div>
        <div className="relative">
          <select
            value={numberOfMines || ""}
            onChange={(e) => handleNumMinesChange(Number(e.target.value))}
            disabled={gameStarted}
            className="w-full p-3 border border-[#2c3a47] bg-[#1e2a36] text-white rounded-md appearance-none focus:outline-none"
          >
            <option value="" disabled>
              Select number of mines
            </option>
            {[1, 3, 5, 10].map((numMines) => (
              <option key={numMines} value={numMines}>
                {numMines} {numMines === 1 ? "Mine" : "Mines"}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Bet Button */}
      <button
        onClick={
          betAmount === null ||
          betAmount <= 0 ||
          numberOfMines <= 0 ||
          gameStarted ||
          betAmount > walletBalance
            ? handleDisabledBetClick
            : handleBet
        }
        disabled={
          betAmount === null ||
          betAmount <= 0 ||
          numberOfMines <= 0 ||
          gameStarted ||
          betAmount > walletBalance
        }
        className="w-full bg-[#4cd964] hover:bg-[#3cc153] disabled:bg-[#2c3a47] disabled:text-gray-400 text-black font-medium py-4 rounded-md transition-colors"
      >
        Bet
      </button>

      {/* Cash Out Section */}
      {gameStarted && (
        <div className="mt-2">
          <p className="text-sm text-gray-400">
            {netProfit !== null &&
              `Net Profit: $${netProfit.toFixed(2)}`}
          </p>
          <button
            onClick={handleCashOut}
            className="w-full py-3 rounded-md bg-success text-black hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            disabled={!gameStarted}
          >
            {`Cash Out${unifiedMultiplier > 0 && betAmount ? ` $${unifiedProfit.toFixed(2)}` : ''}`}
          </button>
          <div>{unifiedMultiplier > 0 ? `${unifiedMultiplier.toFixed(2)}x` : ''}</div>
          <div>{unifiedMultiplier > 0 && betAmount ? `Profit: $${(unifiedProfit - betAmount).toFixed(2)}` : ''}</div>
        </div>
      )}

      {/* Win Modal */}
      <Modal
        isOpen={showModal}
        closeModal={handleCloseModal}
        result={modalResult}
        amount={currentProfit!}
        multiplier={Number(modalMultiplier.toFixed(2))}
      />
    </div>
  );
}
