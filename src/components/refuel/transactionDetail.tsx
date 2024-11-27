import React, { useEffect, useState, useMemo } from "react";
import Big from "big.js";
import { useRefuelStore } from "@/stores/refuel";
import { formatUSDCurrency, formatNumber } from "@/utils/format";
import CustomTooltip from "@/components/customTooltip/customTooltip";
function TransactionDetail() {
  const refuelStore = useRefuelStore();
  const { requestPrepareResult } = refuelStore;
  const {
    format_usdFee,
    format_readableProtocolFee,
    format_fee,
    format_swapFeeUsd,
    formate_ref_fee,
    format_bridgeFeeUsd,
    format_readableSwapOutAmountMin,
    format_readableSwapOutAmountMinWithSlippage,
  } = useMemo(() => {
    const channelInfoMap = requestPrepareResult.data;
    if (channelInfoMap) {
      const stargateChannelInfo = channelInfoMap.Stargate;
      const format_usdFee = formatUSDCurrency(
        stargateChannelInfo?.usdFee || 0,
        "0.01"
      );
      const format_readableProtocolFee = formatUSDCurrency(
        stargateChannelInfo?.readableProtocolFee || 0,
        "0.01"
      );
      const format_swapFeeUsd = formatUSDCurrency(
        Number(stargateChannelInfo?.swapFeeUsd || 0),
        "0.01"
      );
      const format_bridgeFeeUsd = formatUSDCurrency(
        Number(stargateChannelInfo?.bridgeFeeUsed || 0),
        "0.01"
      );
      const formate_ref_fee = formatUSDCurrency(
        Big(stargateChannelInfo?.swapFeeUsd || 0)
          .plus(stargateChannelInfo?.bridgeFeeUsed || 0)
          .toNumber(),
        "0.01"
      );
      const format_fee = formatUSDCurrency(
        Big(stargateChannelInfo?.usdFee || 0)
          .plus(stargateChannelInfo?.readableProtocolFee || 0)
          .toNumber(),
        "0.01"
      );

      const format_readableSwapOutAmountMin = formatNumber(
        stargateChannelInfo?.readableSwapOutAmountMin || 0
      );
      const format_readableSwapOutAmountMinWithSlippage = formatNumber(
        stargateChannelInfo?.readableSwapOutAmountMinWithSlippage || 0
      );
      return {
        format_usdFee,
        format_readableProtocolFee,
        format_fee,
        format_swapFeeUsd,
        format_bridgeFeeUsd,
        formate_ref_fee,
        format_readableSwapOutAmountMin,
        format_readableSwapOutAmountMinWithSlippage,
      };
    }
    return {};
  }, [JSON.stringify(requestPrepareResult || {})]);
  return (
    <div className="mt-6">
      <div className="text-sm font-bold text-gray-60 pl-2">
        Transaction Summary
      </div>
      <div className="flex flex-col gap-2.5 rounded border border-gray-90 p-3 mt-4 text-xs text-gray-60">
        <div className="flex items-center justify-between">
          <span>Estimated Transfer Time:</span>
          <span>1~3 mins</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Refuel Fee:</span>
          <span
            className={`cursor-pointer ml-1 ${
              formate_ref_fee ? "underline" : ""
            }`}
            data-tooltip-id="RefuelFee"
            data-place="right"
            data-class="reactTip"
            data-tooltip-html={`
                <div>Swap Fee: ${format_swapFeeUsd || "$0.00"} </div>
                <div>Bridge Fee: ${format_bridgeFeeUsd || "$0.00"}</div>`}
          >
            <span>{formate_ref_fee || "$0.00"}</span>
            <CustomTooltip id="RefuelFee" />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Gas Fee:</span>
          <span
            className={`cursor-pointer ml-1 ${format_fee ? "underline" : ""}`}
            data-tooltip-id="bridgeFee"
            data-place="right"
            data-class="reactTip"
            data-tooltip-html={`
                <div>Layer0 Fee: ${format_usdFee || "$0.00"} </div>
                <div>StarGate Fee: ${
                  format_readableProtocolFee || "$0.00"
                }</div>`}
          >
            <span>{format_fee || "$0.00"}</span>
            <CustomTooltip id="bridgeFee" />
          </span>
        </div>
        {/* <div className="flex items-center justify-between">
          <span>Received:</span>
          <span>{format_readableSwapOutAmountMin || "0"}</span>
        </div> */}
        <div className="flex items-center justify-between">
          <span>Minimum Received:</span>
          <span>{format_readableSwapOutAmountMinWithSlippage || "0"} NEAR</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TransactionDetail);
