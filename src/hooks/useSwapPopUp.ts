import { useEffect } from "react";
import { useRouter } from "next/router";
import { getURLInfo } from "@/utils/transactionsPopup";
import { useAccountStore } from "@/stores/account";
import { checkSwapTx } from "@/services/swap/swapTx";
import { usePersistMixSwapStore } from "@/stores/swapMix";

const useSwapPopUp = () => {
  const { txHash, pathname, errorType } = getURLInfo();
  const router = useRouter();
  const accountStore = useAccountStore();
  const isSignedIn = accountStore.getIsSignedIn();
  const {
    set_near_usdt_swapTodos_transaction,
    near_usdt_swapTodos_transaction,
  } = usePersistMixSwapStore();
  useEffect(() => {
    if (txHash && isSignedIn) {
      checkSwapTx(
        txHash,
        set_near_usdt_swapTodos_transaction,
        near_usdt_swapTodos_transaction,
        errorType
      ).then(() => {
        router.replace(pathname);
      });
    }
  }, [txHash, isSignedIn]);
};
export default useSwapPopUp;
