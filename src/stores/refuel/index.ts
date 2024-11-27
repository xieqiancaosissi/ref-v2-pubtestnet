import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  SupportChains,
  defaulSwapFee,
  defaultBridgeFee,
} from "@/config/bridge";
import { getTokenMeta } from "@/utils/token";
import bridgeServices from "@/services/bridge/index";
interface IRequestPrepareResult {
  data: Record<
    BridgeModel.BridgeSupportChannel,
    Awaited<ReturnType<typeof bridgeServices.query>>
  >;
  loading: boolean;
  run: () => void;
  error: Error;
}
export interface IRefuel {
  bridgeFromData: BridgeModel.BridgeTransferFormData["from"];
  bridgeToData: BridgeModel.BridgeTransferFormData["to"];
  requestPrepareResult: IRequestPrepareResult;
  setRequestPrepareResult: (
    requestPrepareResult: IRequestPrepareResult
  ) => void;
  setBridgeFromData: (
    bridgeFromData: BridgeModel.BridgeTransferFormData["from"]
  ) => void;
}
export interface IPersistRefuel {
  slippageTolerance: number;
  selectedChain: BridgeModel.BridgeSupportChain;
  swapFee: number;
  bridgeFee: number;
  setSlippageTolerance: (slippageTolerance: number) => void;
  setSelectedChain: (selectedChain: BridgeModel.BridgeSupportChain) => void;
  setSwapFee: (swapFee: number) => void;
  setBridgeFee: (bridgeFee: number) => void;
}
type PersistRefuelState = IPersistRefuel;
type PersistRefuelStore = StateCreator<
  PersistRefuelState,
  [],
  [],
  PersistRefuelState
>;
export const useRefuelStore = create<IRefuel>((set: any) => ({
  bridgeFromData: {
    chain: SupportChains.filter((chain) => chain !== "NEAR")[0],
    tokenMeta: getTokenMeta("USDC"),
    amount: undefined,
  },
  bridgeToData: {
    chain: "NEAR",
  },
  requestPrepareResult: {} as IRequestPrepareResult,
  setBridgeFromData: (
    bridgeFromData: BridgeModel.BridgeTransferFormData["from"]
  ) => set({ bridgeFromData }),
  setRequestPrepareResult: (requestPrepareResult: IRequestPrepareResult) =>
    set({ requestPrepareResult }),
}));

export const usePersistRefuelStore = create<PersistRefuelState>()(
  persist(
    ((set) => ({
      slippageTolerance: 0.01,
      selectedChain: "Arbitrum",
      swapFee: defaulSwapFee,
      bridgeFee: defaultBridgeFee,
      setSlippageTolerance: (slippageTolerance: number) =>
        set({ slippageTolerance }),
      setSelectedChain: (selectedChain: BridgeModel.BridgeSupportChain) =>
        set({ selectedChain }),
      setSwapFee: (swapFee: number) => set({ swapFee }),
      setBridgeFee: (bridgeFee: number) => set({ bridgeFee }),
    })) as PersistRefuelStore,
    {
      name: "_cached_refuel",
      version: 0.1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
