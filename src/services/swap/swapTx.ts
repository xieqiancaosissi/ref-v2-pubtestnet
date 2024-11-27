import { getErrorMessage } from "@/utils/transactionsPopup";
import { checkTransaction } from "@/utils/contract";
import swapToast from "@/components/swap/swapToast";
import swapFailToast from "@/components/swap/swapFailToast";
import { token_usdc_id } from "@/utils/constant";
import { getAccountId } from "@/utils/wallet";
import { parsedArgs } from "@/utils/transactionsPopup";
import { safeJSONParse } from "@/utils/common";
export async function checkSwapTx(
  txHash: string,
  set_near_usdt_swapTodos_transaction?: any,
  near_usdt_swapTodos_transaction?: any,
  errorType?: any
) {
  if (
    near_usdt_swapTodos_transaction &&
    near_usdt_swapTodos_transaction?.process !== "0"
  ) {
    set_near_usdt_swapTodos_transaction(null);
  }
  const res: any = await checkTransaction(txHash);
  const byNeth =
    res?.transaction?.actions?.[0]?.FunctionCall?.method_name === "execute";
  const byEvm =
    res?.transaction?.actions?.[0]?.FunctionCall?.method_name === "rlp_execute";
  const isPackage = byNeth || byEvm;
  const transaction = res.transaction;
  const isSwapReceipt = res?.receipts.find((r) => {
    return !!(
      r?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name ===
        "ft_transfer_call" ||
      r?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name ===
        "near_withdraw" ||
      r?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name === "swap" ||
      r?.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name ===
        "near_deposit"
    );
  });
  const isSwap =
    transaction?.actions[1]?.FunctionCall?.method_name === "ft_transfer_call" ||
    transaction?.actions[0]?.FunctionCall?.method_name === "ft_transfer_call" ||
    transaction?.actions[0]?.FunctionCall?.method_name === "swap" ||
    transaction?.actions[0]?.FunctionCall?.method_name === "near_deposit" ||
    transaction?.actions[0]?.FunctionCall?.method_name === "near_withdraw" ||
    isSwapReceipt;
  if (isSwap) {
    const transactionErrorType = getErrorMessage(res);
    if (!transactionErrorType && !errorType) {
      if (near_usdt_swapTodos_transaction?.process == "0") {
        handle_near_usdt_swap(
          res,
          set_near_usdt_swapTodos_transaction,
          near_usdt_swapTodos_transaction
        );
      } else {
        if (near_usdt_swapTodos_transaction) {
          set_near_usdt_swapTodos_transaction(null);
        }
        swapToast(txHash);
      }
    } else if (transactionErrorType) {
      swapFailToast(txHash, transactionErrorType);
    }
  }
}
function handle_near_usdt_swap(
  res: any,
  set_near_usdt_swapTodos_transaction,
  near_usdt_swapTodos_transaction
) {
  const accountId = getAccountId();
  const targetReceipt = res.receipts.find((receipt) => {
    return (
      receipt.receiver_id == token_usdc_id &&
      receipt.receipt?.Action?.actions?.[0]?.FunctionCall?.method_name ==
        "ft_transfer"
    );
  });
  if (!targetReceipt) {
    return;
  }
  const args = parsedArgs(
    targetReceipt.receipt?.Action?.actions?.[0]?.FunctionCall?.args
  );
  const argsObj: {
    receiver_id: string;
    amount: string;
  } = safeJSONParse(args);
  if (argsObj?.amount && argsObj?.receiver_id == accountId) {
    set_near_usdt_swapTodos_transaction({
      ...near_usdt_swapTodos_transaction,
      process: "1",
      dcl_quote_amout_real: argsObj?.amount,
    });
  } else {
    set_near_usdt_swapTodos_transaction(null);
  }
}
