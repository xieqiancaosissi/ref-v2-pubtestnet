import React, { useEffect, useMemo, useState } from "react";
import Big from "big.js";
import { ethers } from "ethers";
import { useDebounce } from "react-use";
import { useRouter } from "next/router";
import {
  BridgeTokenRoutes,
  defaulSwapFee,
  defaultBridgeFee,
} from "@/config/bridge";
import bridgeServices from "@/services/bridge/index";
import { useRequest } from "@/hooks/useHooks";
import { useRefuelStore, usePersistRefuelStore } from "@/stores/refuel";
import { tokenServices } from "@/services/bridge/contract";
import { refuelServices } from "@/services/bridge/contract";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useAccountStore } from "@/stores/account";
import { getTokenMeta } from "@/utils/token";
import { storageStore } from "@/utils/common";
function DataManagementCenter() {
  const {
    wallet,
    isEVMSignedIn,
    accountId: fromAccountAddress,
  } = useEvmWallet();
  const { slippageTolerance, selectedChain, setSwapFee, setBridgeFee } =
    usePersistRefuelStore();
  const { getAccountId } = useAccountStore();
  const toAccountAddress = getAccountId();
  const refuelStore = useRefuelStore();
  const {
    bridgeFromData,
    bridgeToData,
    setBridgeFromData,
    setRequestPrepareResult,
  } = refuelStore;
  const router = useRouter();
  const notLogin = !fromAccountAddress || !toAccountAddress;
  // global window
  useEffect(() => {
    if (wallet?.provider && fromAccountAddress) {
      window.ethProvider = wallet?.provider;
      window.ethWeb3Provider = new ethers.providers.Web3Provider(
        wallet?.provider,
        "any"
      );
    }
  }, [wallet?.provider, fromAccountAddress]);
  // get swapfee and bridgefee from receive contract
  useEffect(() => {
    getAndCacheFeeFromContract();
  }, []);
  // sync selectedChain to bridge page
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url == "/bridge") {
        const storageAPI = storageStore("DELTA_DEFAULT");
        const bridgeFromValue: BridgeModel.BridgeTransferFormData["from"] =
          storageAPI.get("bridgeFromValue");
        // const bridgeToValue: BridgeModel.BridgeTransferFormData["to"] = storageAPI.get("bridgeToValue");
        if (bridgeFromValue?.chain && bridgeFromValue?.chain !== "NEAR") {
          bridgeFromValue.chain = selectedChain;
          storageAPI.set("bridgeFromValue", bridgeFromValue);
        } /*else if (bridgeToValue?.chain && bridgeToValue?.chain !== "NEAR") {
        bridgeToValue.chain = selectedChain;
        storageAPI.set("bridgeToValue", bridgeToValue);
      }*/
      }
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router, selectedChain]);
  useEffect(() => {
    setBridgeFromData({ ...bridgeFromData, chain: selectedChain });
  }, [selectedChain]);
  // get balance of from chain
  const { data: bridgeFromBalance = "0" } = useRequest(
    async () => {
      if (!fromAccountAddress) return "0";
      return tokenServices.getBalance(
        bridgeFromData.chain,
        getTokenMeta(bridgeFromData.tokenMeta.symbol),
        true
      );
    },
    {
      refreshDeps: [
        bridgeFromData.chain,
        bridgeFromData.tokenMeta,
        fromAccountAddress,
        toAccountAddress,
      ],
      before: () =>
        !!bridgeFromData.chain && !!bridgeFromData.tokenMeta && !notLogin,
      debounceOptions: 200,
      pollingInterval: 10000,
    }
  );
  useDebounce(
    () => {
      setBridgeFromData({
        ...bridgeFromData,
        balance: isEVMSignedIn ? bridgeFromBalance : "0",
      });
    },
    500,
    [bridgeFromBalance, isEVMSignedIn]
  );
  // get support channel
  const supportBridgeChannels = useMemo(() => {
    const channels = BridgeTokenRoutes.filter(
      (route) =>
        route.from === bridgeFromData.chain &&
        route.to === bridgeToData.chain &&
        route.symbols.includes(bridgeFromData.tokenMeta?.symbol)
    );
    return channels.map((v) => v.channel);
  }, [
    bridgeFromData.chain,
    bridgeToData.chain,
    bridgeFromData.tokenMeta?.symbol,
  ]);
  // get prepare send data
  const requestPrepareResult = useRequest(
    async () => {
      const result = {} as Record<
        BridgeModel.BridgeSupportChannel,
        Awaited<ReturnType<typeof bridgeServices.query>>
      >;
      if (!fromAccountAddress || Big(bridgeFromData.amount || 0).lte(0))
        return result;
      for (const channel of supportBridgeChannels) {
        result[channel] = await bridgeServices.query({
          tokenIn: bridgeFromData.tokenMeta,
          tokenOut: bridgeFromData.tokenMeta,
          amount: bridgeFromData.amount,
          from: bridgeFromData.chain,
          to: bridgeToData.chain,
          recipient: toAccountAddress,
          sender: fromAccountAddress,
          channel,
          slippage: slippageTolerance,
          mode: 3,
        });
      }
      return result;
    },
    {
      refreshDeps: [
        bridgeFromData.chain,
        bridgeFromData.tokenMeta,
        bridgeFromData.amount,
        supportBridgeChannels,
        slippageTolerance,
        fromAccountAddress,
        toAccountAddress,
      ],
      before: () => !notLogin,
      debounceOptions: { wait: 500 },
    }
  );
  useDebounce(
    () => {
      setRequestPrepareResult(requestPrepareResult);
    },
    500,
    [JSON.stringify(requestPrepareResult || {})]
  );
  // console.log(
  //   "------------------------requestPrepareResult",
  //   requestPrepareResult
  // );
  async function getAndCacheFeeFromContract() {
    let swapFee = defaulSwapFee;
    let bridgeFee = defaultBridgeFee;
    try {
      swapFee = await refuelServices.getSwapfee();
      bridgeFee = await refuelServices.getBridgefee();
    } catch (error) {}
    setSwapFee(swapFee);
    setBridgeFee(bridgeFee);
  }
  return null;
}

export default React.memo(DataManagementCenter);
