import React, { useEffect, useState, useMemo } from "react";
import { Switch } from "@nextui-org/switch";
import Big from "big.js";
import { GasIcon } from "./icons";
import { QuestionMark } from "@/components/farm/icon";
import { useBridgeFormContext } from "@/providers/bridgeForm";
import { minSwapAmountInUniswapV2Router02 } from "@/config/bridge";
function PartToNear() {
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const { bridgeFromValue, setMode } = useBridgeFormContext();
  const shouldDisabled =
    bridgeFromValue.chain == "NEAR" ||
    Big(bridgeFromValue?.amount || 0).lte(minSwapAmountInUniswapV2Router02);
  useEffect(() => {
    if (isSelected && !shouldDisabled) {
      setMode(2);
    } else {
      setMode(1);
    }
  }, [isSelected, shouldDisabled]);
  return (
    <div className="flex items-center justify-between my-3 rounded-xl bg-lightBlueBg p-3.5">
      <div className="flex items-center gap-3">
        <GasIcon />
        <div className="flex flex-col justify-between">
          <div className="flex items-center gap-1 text-base font-bold text-white">
            Enable Refuel
            <QuestionMark
              className="cursor-pointer"
              onClick={() => {
                window.open("https://guide.ref.finance");
              }}
            />
          </div>
          <p className="text-xs text-gray-60 font-bold">
            Get NEAR for transactions on NEAR
          </p>
        </div>
      </div>
      <Switch
        size="sm"
        isDisabled={shouldDisabled}
        isSelected={bridgeFromValue.chain == "NEAR" ? false : isSelected}
        onValueChange={setIsSelected}
        classNames={{
          wrapper: "w-[38px] h-[20px] group-data-[selected=true]:bg-green-30",
          thumb: "w-[14px] h-[14px] flex-shrink-0",
        }}
      />
    </div>
  );
}

export default React.memo(PartToNear);
