import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { RefuelIcon } from "./icons";
import { getSelectedWalletId } from "@/utils/wallet";
import { usePersistRefuelStore } from "@/stores/refuel";
import { storageStore } from "@/utils/common";
import { useAccountStore } from "@/stores/account";
function RefuelEntryButton() {
  const { setSelectedChain } = usePersistRefuelStore();
  const accountStore = useAccountStore();
  const selectedWalletId = getSelectedWalletId();
  const accountId = accountStore.getAccountId();
  const router = useRouter();
  function jump() {
    if (router.pathname == "/bridge") {
      const storageAPI = storageStore("DELTA_DEFAULT");
      const bridgeFromValue: BridgeModel.BridgeTransferFormData["from"] =
        storageAPI.get("bridgeFromValue");
      if (bridgeFromValue?.chain && bridgeFromValue.chain !== "NEAR") {
        setSelectedChain(bridgeFromValue.chain);
      }
    }
    router.push("/refuel");
  }
  const hiddenEntry = useMemo(() => {
    return !!(
      accountId &&
      selectedWalletId !== "ethereum-wallets" &&
      !router.pathname.includes("bridge")
    );
  }, [accountId, router.pathname]);
  if (hiddenEntry || !accountId) return null;
  return (
    <div
      onClick={jump}
      className="flex items-center fixed right-10 top-[58px] xsm:top-[45px] xsm:right-5 h-[34px] rounded-[124px] border border-gray-320 bg-dark-320 gap-2 text-white text-sm  px-2.5 xsm:z-50 lg:z-[51] cursor-pointer hover:border-primaryGreen"
    >
      <RefuelIcon />
      Refuel Gas
    </div>
  );
}

export default React.memo(RefuelEntryButton);
