import React, { useState } from "react";
import Modal from "react-modal";
import { Button } from "@nextui-org/react";
import { usePersistMixSwapStore } from "../../stores/swapMix";
import { isMobile } from "../../utils/device";
import { ModalCloseIcon } from "../meme/icons";
import { CheckedIcon } from "./icons";
import {
  makeDclSwap_nearUsdt,
  makeV1Swap_nearUsdt,
} from "@/services/swap/executeMixSwap";
import { getAccountId } from "@/utils/wallet";
import failToast from "@/components/common/toast/failToast";
import { IExecutionResult } from "@/interfaces/wallet";
import { checkSwapTx } from "@/services/swap/swapTx";
import { setSwapTokenAndBalances } from "@/components/common/SelectTokenModal/tokenUtils";
import { useSwapStore, usePersistSwapStore } from "@/stores/swap";
import { useTokenStore, ITokenStore } from "@/stores/token";
import { useAppStore } from "@/stores/app";
import { getTokenUIId } from "@/services/swap/swapUtils";
import { BeatLoading } from "@/components/rpc/icon";
import { INEAR_USDT_SWAP_TODOS, IProcess } from "@/interfaces/swapMix";
import { TIME_OUT, TIME_OUT_1 } from "@/utils/constant";
export default function SwapMixModal(props: any) {
  const { isOpen, onRequestClose } = props;
  const [step1Loading, setStep1Loading] = useState(false);
  const [step2Loading, setStep2Loading] = useState(false);
  const {
    near_usdt_swapTodos,
    set_near_usdt_swapTodos_transaction,
    near_usdt_swapTodos_transaction,
  } = usePersistMixSwapStore();
  const swapStore = useSwapStore();
  const appStore = useAppStore();
  const tokenStore = useTokenStore() as ITokenStore;
  const persistSwapStore = usePersistSwapStore();
  const tokenIn = swapStore.getTokenIn();
  const tokenOut = swapStore.getTokenOut();
  const global_whitelisted_tokens_ids =
    tokenStore.get_global_whitelisted_tokens_ids();
  const walletInteractionStatusUpdatedSwap =
    swapStore.getWalletInteractionStatusUpdated();
  const personalDataUpdatedSerialNumber =
    appStore.getPersonalDataUpdatedSerialNumber();
  const cardWidth = isMobile() ? "100vw" : "400px";
  const step1Disabled =
    near_usdt_swapTodos_transaction &&
    near_usdt_swapTodos_transaction.process !== "0";
  const step2Disabled = !step1Disabled;

  function makeDclSwap() {
    if (step1Disabled) return;
    setStep1Loading(true);
    const pending_tx = {
      ...near_usdt_swapTodos,
      accountId: getAccountId(),
    };
    set_near_usdt_swapTodos_transaction(pending_tx);
    const { pools, slippageTolerance, dcl_quote_amout, tokens, tokenInAmount } =
      near_usdt_swapTodos;

    makeDclSwap_nearUsdt({
      dcl_pool_id: pools[0].pool_id,
      slippageTolerance,
      dcl_quote_amout,
      nearMetadata: tokens[0],
      usdcMetadata: tokens[1],
      tokenInAmount,
    }).then(async (res) => {
      handleDataAfterTranstion(res, pending_tx, setStep1Loading, TIME_OUT);
    });
  }
  function makeV1Swap() {
    if (step2Disabled) return;
    setStep2Loading(true);
    const {
      dcl_quote_amout_real,
      tokens,
      nonEstimateOutAmountWithSlippageTolerance,
    } = near_usdt_swapTodos_transaction;
    const pending_tx = {
      ...near_usdt_swapTodos_transaction,
      process: "2" as IProcess,
    };
    set_near_usdt_swapTodos_transaction(pending_tx);
    makeV1Swap_nearUsdt({
      usdcMetadata: tokens[1],
      usdtMetadata: tokens[2],
      amountIn: dcl_quote_amout_real,
      nonEstimateOutAmountWithSlippageTolerance,
    }).then(async (res) => {
      handleDataAfterTranstion(
        res,
        pending_tx,
        setStep2Loading,
        TIME_OUT_1,
        true
      );
    });
  }
  function handleDataAfterTranstion(
    res: IExecutionResult | undefined,
    pending_tx: INEAR_USDT_SWAP_TODOS,
    setLoading: any,
    time_out: number,
    closeModal?: boolean
  ) {
    if (!res) return;
    if (res.status == "success") {
      setTimeout(() => {
        // tx popup
        checkSwapTx(
          res.txHash,
          set_near_usdt_swapTodos_transaction,
          pending_tx
        ).then(() => {
          setLoading(false);
          if (closeModal) {
            onRequestClose();
          }
        });
        // update balances
        setSwapTokenAndBalances({
          tokenInId: getTokenUIId(tokenIn),
          tokenOutId: getTokenUIId(tokenOut),
          accountId: getAccountId(),
          swapStore,
          persistSwapStore,
          tokenStore,
          global_whitelisted_tokens_ids,
        });
      }, time_out);
      swapStore.setWalletInteractionStatusUpdated(
        !walletInteractionStatusUpdatedSwap
      );
      appStore.setPersonalDataUpdatedSerialNumber(
        personalDataUpdatedSerialNumber + 1
      );
    } else if (res.status == "error") {
      failToast(res.errorResult?.message);
      setLoading(false);
    }
  }
  return (
    <Modal
      isOpen={isOpen}
      // onRequestClose={onRequestClose}
      // style={{
      //   overlay: {
      //     overflow: "auto",
      //   },
      //   content: {
      //     outline: "none",
      //     transform: "translate(-50%, -50%)",
      //   },
      // }}
    >
      <div
        className="bg-dark-70 rounded-2xl xsm:rounded-b-none p-4 pb-8"
        style={{ width: cardWidth }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className=" text-lg text-white gotham_bold">Swap</span>
          <ModalCloseIcon onClick={onRequestClose} className="cursor-pointer" />
        </div>
        <div className="flex items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-menuMoreBoxBorderColor text-white text-sm">
              1
            </span>
            <span className="text-sm text-white">Swap from NEAR to USDC</span>
          </div>
          {step1Disabled ? (
            <CheckedIcon />
          ) : (
            <Button
              className="bg-greenGradient text-black"
              onPress={makeDclSwap}
              isDisabled={step1Disabled}
            >
              {step1Loading ? <BeatLoading /> : "Submit"}
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mt-6 gap-8">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-menuMoreBoxBorderColor text-white text-sm">
              2
            </span>
            <span className="text-sm text-white">Swap from USDC to USDt</span>
          </div>
          <Button
            isDisabled={step2Disabled}
            onPress={makeV1Swap}
            className="bg-greenGradient text-black"
          >
            {step2Loading ? <BeatLoading /> : "Submit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
