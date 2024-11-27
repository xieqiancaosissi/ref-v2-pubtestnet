import React, { useMemo, useState } from "react";
import { Image } from "@nextui-org/react";
import Big from "big.js";
import {
  TokenSelectorCommonProps,
  TokenSelectorModal,
  formatChainToken,
} from "../bridge/TokenSelector";
import SvgIcon from "../bridge/SvgIcon";
import { useRefuelStore } from "@/stores/refuel";
import { formatNumber } from "@/utils/format";

function TokenSelector({
  value,
  tokens,
  chain,
  placeholder,
  disabled,
  onChange,
}: Partial<TokenSelectorCommonProps & { placeholder?: React.ReactNode }>) {
  const [isOpen, setIsOpen] = useState(false);
  const { bridgeFromData, setBridgeFromData } = useRefuelStore();
  function handleToggle() {
    setIsOpen(!isOpen);
  }
  function onOpen() {
    if (disabled) return;
    setIsOpen(true);
  }
  function setMax() {
    if (disabled) return;
    setBridgeFromData({
      ...bridgeFromData,
      amount: bridgeFromData.balance || "0",
    });
  }
  return (
    <div>
      <div
        className={`flex items-center text-sm text-gray-60 gap-1.5 ${
          disabled ? "opacity-40" : ""
        }`}
      >
        Bal: <Image src={value.icon} width={20} height={20} />{" "}
        <span
          className="underline text-white text-sm cursor-pointer"
          onClick={setMax}
        >
          {formatNumber(bridgeFromData.balance || 0, { rm: Big.roundDown })}
        </span>
        <div
          onClick={onOpen}
          className="flex items-center gap-3 cursor-pointer"
        >
          <span>{value.symbol}</span>
          <SvgIcon name="IconArrowDown" className="text-xs" />
        </div>
      </div>
      {isOpen && tokens?.length && (
        <TokenSelectorModal
          isOpen={isOpen}
          value={value}
          chain={chain}
          tokens={tokens}
          toggleOpenModal={handleToggle}
          onSelected={onChange}
        />
      )}
    </div>
  );
}

export default React.memo(TokenSelector);
