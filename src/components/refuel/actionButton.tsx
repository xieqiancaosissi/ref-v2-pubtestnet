import React, { useMemo, useState } from "react";
import Big from "big.js";
import { Button } from "@nextui-org/react";
import { toast } from "react-toastify";
import BridgeTransactionStatusModal from "@/components/bridge/BridgeTransactionStatus";
import {
  EVMConfig,
  maxSwapAmountInUniswapV2Router02,
  minSwapAmountInUniswapV2Router02,
} from "@/config/bridge";
import { useRefuelStore, usePersistRefuelStore } from "@/stores/refuel";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import useBridge from "@/hooks/useBridge";
import { useAccountStore } from "@/stores/account";
import SvgIcon from "@/components/bridge/SvgIcon";
function ActionButton() {
  const [transaction, setTransaction] = useState<{
    hash: string;
    params: {
      tokenIn: BridgeModel.BridgeTokenMeta;
      tokenOut: BridgeModel.BridgeTokenMeta;
      amount: string;
      from: BridgeModel.BridgeSupportChain;
      to: BridgeModel.BridgeSupportChain;
      recipient: string;
      sender: string;
      channel: BridgeModel.BridgeSupportChannel;
      slippage: number;
    };
  }>(null);
  const [isOpen, setIsOpen] = useState(false);
  const refuelStore = useRefuelStore();
  const { requestPrepareResult, bridgeFromData, bridgeToData } = refuelStore;
  const persistRefuelStore = usePersistRefuelStore();
  const { actionLoading, transfer } = useBridge();
  const { isEVMSignedIn, connectedChain, setChain, accountId } = useEvmWallet();
  const accountStore = useAccountStore();
  const { selectedChain: currentChain, slippageTolerance } = persistRefuelStore;
  const nearAccountId = accountStore.getAccountId();
  const currentChain_id =
    EVMConfig.chains[currentChain.toLowerCase()]?.id?.toLowerCase();
  const connectedChain_id = connectedChain?.id?.toLocaleLowerCase();
  const notLogin = !nearAccountId || !accountId;
  const [buttonText, isDisabled] = useMemo(() => {
    if (notLogin) {
      return ["Connect Wallet", notLogin];
    } else if (Big(bridgeFromData.amount || 0).lte(0)) {
      return ["Enter amount", true];
    } else if (
      Big(bridgeFromData.balance || 0).lt(bridgeFromData.amount || 0)
    ) {
      return ["Insufficient balance", true];
    } else if (requestPrepareResult.error) {
      return ["Network error", true];
    } else if (
      Big(bridgeFromData.amount || 0).lt(minSwapAmountInUniswapV2Router02)
    ) {
      return [`Min value: ${minSwapAmountInUniswapV2Router02}`, true];
    } else if (
      Big(bridgeFromData.amount || 0).gt(maxSwapAmountInUniswapV2Router02)
    ) {
      return [`Input limit: ${maxSwapAmountInUniswapV2Router02}`, true];
    } else {
      return ["Refuel", requestPrepareResult.loading];
    }
  }, [
    bridgeFromData.amount,
    bridgeFromData.balance,
    requestPrepareResult.loading,
    requestPrepareResult.error,
    nearAccountId,
    accountId,
  ]);
  const needSwitchChain = useMemo(() => {
    if (isEVMSignedIn) {
      return currentChain_id !== connectedChain_id;
    }
    return false;
  }, [isEVMSignedIn, currentChain_id, connectedChain_id]);
  const channelInfoMap = requestPrepareResult.data;
  function switchChain() {
    setChain({ chainId: currentChain_id });
  }
  function toggleOpen() {
    setIsOpen(!isOpen);
  }
  async function handleTransfer() {
    if (new Big(channelInfoMap?.Stargate.minAmount || 0).eq(0)) {
      toast.error(`Minimum Received is 0, can't transfer`);
      return;
    }
    const channel: BridgeModel.BridgeSupportChannel = "Stargate";
    const mode: BridgeModel.BridgeMode = 3;
    const params = {
      tokenIn: bridgeFromData.tokenMeta,
      tokenOut: bridgeFromData.tokenMeta,
      amount: bridgeFromData.amount,
      from: bridgeFromData.chain,
      to: bridgeToData.chain,
      recipient: nearAccountId,
      sender: accountId,
      channel,
      slippage: slippageTolerance,
      mode,
    };
    const result = await transfer(params).catch((err) => {
      // console.error(err.message);
      return err;
    });

    if (typeof result === "string") {
      setTransaction({
        hash: result,
        params,
      });
      setIsOpen(true);
    }
  }
  return (
    <>
      {needSwitchChain && !notLogin ? (
        <Button
          isLoading={requestPrepareResult.loading}
          className="mt-6 w-full rounded h-[50px] text-lg text-black bg-greenGradient"
          spinner={<SvgIcon name="IconLoading" className="mr-1" />}
          onClick={() => {
            switchChain();
          }}
        >
          Switch Network to {currentChain}
        </Button>
      ) : (
        <Button
          onClick={handleTransfer}
          isLoading={requestPrepareResult.loading || actionLoading}
          isDisabled={isDisabled}
          spinner={<SvgIcon name="IconLoading" />}
          className="mt-6 w-full rounded h-[50px] text-lg text-black bg-greenGradient"
        >
          {buttonText}
        </Button>
      )}
      {transaction && (
        <BridgeTransactionStatusModal
          {...transaction}
          isOpen={isOpen}
          toggleOpenModal={toggleOpen}
          page="refuel"
        />
      )}
    </>
  );
}

export default React.memo(ActionButton);
