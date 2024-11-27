import { create, StateCreator } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INEAR_USDT_SWAP_TODOS } from "../interfaces/swapMix";

export interface IPersistMixSwap {
  near_usdt_swapTodos: INEAR_USDT_SWAP_TODOS;
  near_usdt_swapTodos_transaction: INEAR_USDT_SWAP_TODOS;
  set_near_usdt_swapTodos: (near_usdt_swapTodos: INEAR_USDT_SWAP_TODOS) => void;
  set_near_usdt_swapTodos_transaction: (
    near_usdt_swapTodos_transaction: INEAR_USDT_SWAP_TODOS
  ) => void;
}
type IPersistMixSwapState = IPersistMixSwap;
type IPersistMixSwapStore = StateCreator<
  IPersistMixSwapState,
  [],
  [],
  IPersistMixSwapState
>;
export const usePersistMixSwapStore = create<IPersistMixSwapState>()(
  persist(
    (set) => ({
      near_usdt_swapTodos: null,
      near_usdt_swapTodos_transaction: null,
      set_near_usdt_swapTodos: (near_usdt_swapTodos: INEAR_USDT_SWAP_TODOS) =>
        set({ near_usdt_swapTodos }),
      set_near_usdt_swapTodos_transaction: (
        near_usdt_swapTodos_transaction: INEAR_USDT_SWAP_TODOS
      ) => set({ near_usdt_swapTodos_transaction }),
    }),
    {
      name: "_cached_mix_swap",
      version: 0.1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
