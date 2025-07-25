import { useCommonStore, useAuthStore } from "@/app/_store/commonStore";
import { Coins } from "lucide-react";
import React from "react";

function ConfigForDice({ onBet }: { onBet: (amount: number) => void }) {
  const [betAmount, setBetAmount] = React.useState<number>(0);
  const [inputValue, setInputValue] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const { balance } = useCommonStore();
  const { user, token, fetchUser } = useAuthStore();
  const walletBalance = user?.wallet?.balance ?? 1000;

  const handleBetAmountChange = (newValue: string) => {
    setInputValue(newValue);
    const parsedValue = parseFloat(newValue);
    if (!isNaN(parsedValue)) {
      setBetAmount(parsedValue);
      if (parsedValue > walletBalance) {
        setError("Bet amount cannot exceed your balance");
      } else {
        setError("");
      }
    } else {
      setBetAmount(0);
    }
  };

  const handleHalfAmount = () => {
    if (betAmount > 0) {
      const newAmount = (betAmount / 2).toFixed(2);
      setInputValue(newAmount);
      setBetAmount(parseFloat(newAmount));
    }
  };

  const handleDoubleAmount = () => {
    if (betAmount > 0) {
      const newAmount = (betAmount * 2).toFixed(2);
      if (parseFloat(newAmount) <= walletBalance) {
        setInputValue(newAmount);
        setBetAmount(parseFloat(newAmount));
        setError("");
      } else {
        setError("Bet amount cannot exceed your balance");
      }
    }
  };

  const handleOnBet = () => {
    onBet(betAmount);
  };


  return (
    <div className="flex flex-col gap-6 p-4  text-white max-w-md mx-auto rounded-lg">
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-[#b0b9d2]">Bet Amount</span>
          <span className="text-white">
            ${walletBalance ? walletBalance.toFixed(2) : "0.00"}
          </span>
        </div>
      </div>
      <div className="flex bg-[#1e2a36] rounded-md overflow-hidden">
        <div className="flex-1 flex items-center relative">
          <input
            type="number"
            id="betAmount"
            value={inputValue}
            min={0.01}
            step={0.01}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            className="w-full bg-[#1e2a36] px-3 py-3 outline-none text-white"
            onClick={(e) => e.currentTarget.select()}
          />
          <div className="absolute right-3 pointer-events-none">
            <Coins className="w-4 h-4 text-success" />
          </div>
        </div>
        <button
          className="bg-[#1e2a36] px-6 border-l border-[#2c3a47] hover:bg-[#2c3a47] transition-colors text-white"
          onClick={handleHalfAmount}
          disabled={!betAmount || betAmount <= 0}
        >
          ½
        </button>
        <button
          className="bg-[#1e2a36] px-6 border-l border-[#2c3a47] hover:bg-[#2c3a47] transition-colors text-white"
          onClick={handleDoubleAmount}
          disabled={!betAmount || betAmount <= 0 || betAmount * 2 > walletBalance}
        >
          2×
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleOnBet}
        className="w-full py-3 rounded-md bg-success text-black hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        disabled={!betAmount || betAmount <= 0 || betAmount > walletBalance}
      >
        Bet
      </button>
    </div>
  );
}

export default ConfigForDice;
