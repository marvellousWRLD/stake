"use client";
import React from "react";
import ConfigForDice from "./ConfigForDice";
import DiceComponent from "./DiceComponent";
import { useCommonStore, useAuthStore } from "@/app/_store/commonStore";

function DiceGameContainer() {
  const [multiplier, setMultiplier] = React.useState<number>(2);
  const [gameStarted, setGameStarted] = React.useState<boolean>(false);
  const [targetNumber, setTargetNumber] = React.useState<number>(0);
  const [value, setValue] = React.useState([50]);
  const [winChance, setWinChance] = React.useState(50);
  const [result, setResult] = React.useState<
    | {
        isWin: boolean;
        randomNumber: number;
      }[]
  >([]);
  const { setBalance, balance } = useCommonStore();
  const { user, token, fetchUser } = useAuthStore();

  const handleBet = async (betAmount: number) => {
    if (!user || !token) return;
    const res = await fetch('/api/dice/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        betAmount,
        target: value[0],
        username: user.username,
      }),
    });
    const data = await res.json();
    setTargetNumber(data.roll);
    setGameStarted(true);
    setResult([...result, { isWin: data.win, randomNumber: data.roll }]);
    if (data.newBalance !== undefined) {setBalance(data.newBalance);fetchUser(token);}
  };

  return (
    <div className="flex flex-col md:flex-row bg-background gap-4 md:gap-8 p-4 w-full max-w-6xl mx-auto">
      <div className="w-full md:w-1/3 bg-primary">
        <ConfigForDice onBet={handleBet} />
      </div>
      <div className="w-full md:w-2/3">
        <DiceComponent
          value={value}
          setValue={setValue}
          winChance={winChance}
          setWinChance={setWinChance}
          multiplier={multiplier}
          setMultiplier={setMultiplier}
          targetNumber={targetNumber}
          gameStarted={gameStarted}
          result={result}
        />
      </div>
    </div>
  );
}

export default DiceGameContainer;
