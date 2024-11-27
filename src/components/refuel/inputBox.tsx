import React, { useEffect, useState, useMemo } from "react";
import { Input, Slider } from "@nextui-org/react";
import {
  BridgeTokenRoutes,
  minSwapAmountInUniswapV2Router02,
  maxSwapAmountInUniswapV2Router02,
} from "@/config/bridge";
import TokenSelector from "./tokenSelector";
import { getTokenMeta } from "@/utils/token";
import { useRefuelStore } from "@/stores/refuel";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useAccountStore } from "@/stores/account";
const evmSpecialSymbols = ["USDC.e", "USDT.e"];
function InputContainer() {
  const { accountId } = useEvmWallet();
  const refuelStore = useRefuelStore();
  const { getAccountId } = useAccountStore();
  const nearAccountId = getAccountId();
  const { bridgeFromData, bridgeToData, setBridgeFromData } = refuelStore;
  const supportTokens = useMemo(() => {
    const symbols = BridgeTokenRoutes.filter(
      (route) =>
        route.from === bridgeFromData.chain && route.to === bridgeToData.chain
    )
      .map((v) => v.symbols)
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
    if (bridgeFromData.chain !== "NEAR") {
      return symbols.filter((v) => !evmSpecialSymbols.includes(v));
    }
    return symbols;
  }, [bridgeFromData.chain]);

  function onChangeOfSlider(value: number) {
    setBridgeFromData({ ...bridgeFromData, amount: value.toString() });
  }
  const notLogin = !accountId || !nearAccountId;
  return (
    <main>
      {/* balance and token selector */}
      <div className="flex items-center justify-between mt-6">
        <span className="text-sm text-gray-60">Enter Refuel Amount</span>
        <TokenSelector
          value={bridgeFromData.tokenMeta}
          chain={bridgeFromData.chain}
          tokens={supportTokens.map(getTokenMeta)}
          onChange={(tokenMeta) => {
            setBridgeFromData({ ...bridgeFromData, tokenMeta });
          }}
          disabled={notLogin}
        />
      </div>
      {/* amount */}
      <Input
        type="number"
        className="mt-3"
        placeholder="0.00"
        isDisabled={notLogin}
        classNames={{
          inputWrapper: [
            "bg-black bg-opacity-20 rounded-lg h-[55px]",
            "dark:group-data-[focus=true]:bg-black",
            "dark:group-data-[focus=true]:bg-opacity-20",
            "dark:hover:bg-black",
            "dark:hover:bg-opacity-20",
          ],
          input: [
            "text-xl font-bold",
            "dark:group-data-[has-value=true]:text-white",
          ],
        }}
        value={bridgeFromData.amount}
        onChange={(v) => {
          setBridgeFromData({
            ...bridgeFromData,
            amount: v.currentTarget.value,
          });
        }}
      />
      {/* slider */}
      <div className="flex items-center justify-between text-sm text-white font-bold mt-[10px] px-0.5">
        <span
          className="cursor-pointer"
          onClick={() => {
            onChangeOfSlider(+minSwapAmountInUniswapV2Router02);
          }}
        >
          {minSwapAmountInUniswapV2Router02}
        </span>
        <span
          className="cursor-pointer"
          onClick={() => {
            onChangeOfSlider(+maxSwapAmountInUniswapV2Router02);
          }}
        >
          {maxSwapAmountInUniswapV2Router02}
        </span>
      </div>
      <Slider
        className="mt-1.5"
        maxValue={+maxSwapAmountInUniswapV2Router02}
        minValue={+minSwapAmountInUniswapV2Router02}
        step={0.001}
        isDisabled={notLogin}
        defaultValue={0}
        value={bridgeFromData.amount ? +bridgeFromData.amount : 0}
        classNames={{
          track: ["h-[6px] bg-[#344049]", "border-s-[#9EFF00]"],
          filler: "bg-[#9EFF00]",
        }}
        renderThumb={(props) => {
          return (
            <div
              {...props}
              className="top-1/2 border-[3px] border-[#1D2932] w-[24px] h-[24px] rounded-full bg-[#9EFF00]"
            ></div>
          );
        }}
        onChange={onChangeOfSlider}
      />
    </main>
  );
}

export default React.memo(InputContainer);
