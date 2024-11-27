import { four_stable_pool_id } from "@/utils/constant";
import { TokenMetadata, ftGetStorageBalance } from "@/services/ft-contract";
import { getSelectedWalletId, getAccountId } from "@/utils/wallet";
import { v3Swap } from "@/services/swapV3";
import { STORAGE_TO_REGISTER_WITH_MFT } from "@/services/creator/storage";
import {
  ONE_YOCTO_NEAR,
  REF_FI_CONTRACT_ID,
  RefFiFunctionCallOptions,
} from "@/utils/contract";
import { executeMultipleTransactions } from "@/utils/near";
import { percentLess, toReadableNumber } from "@/utils/numbers";
import { Transaction } from "@/services/farm";
const swapFromFourPool = async ({
  tokenIn,
  tokenOut,
  amountIn, // NonDivisibleNumber
  pool_id,
  min_amount_out,
}) => {
  const transactions: Transaction[] = [];
  const tokenOutActions: RefFiFunctionCallOptions[] = [];
  const walletId = getSelectedWalletId();
  const gas = walletId == "neth" ? "250000000000000" : "300000000000000";
  const registerToken = async (token: TokenMetadata) => {
    const tokenRegistered = await ftGetStorageBalance(token.id).catch(() => {
      throw new Error(`${token.id} doesn't exist.`);
    });
    if (tokenRegistered === null) {
      tokenOutActions.push({
        methodName: "storage_deposit",
        args: {
          registration_only: true,
          account_id: getAccountId(),
        },
        gas,
        amount: STORAGE_TO_REGISTER_WITH_MFT,
      });
      transactions.push({
        receiverId: token.id,
        functionCalls: tokenOutActions,
      });
    }
  };
  await registerToken(tokenOut);
  const actionsList = [
    {
      pool_id: +pool_id,
      token_in: tokenIn.id,
      token_out: tokenOut.id,
      amount_in: amountIn,
      min_amount_out,
    },
  ];
  transactions.push({
    receiverId: tokenIn.id,
    functionCalls: [
      {
        methodName: "ft_transfer_call",
        args: {
          receiver_id: REF_FI_CONTRACT_ID,
          amount: amountIn,
          msg: JSON.stringify({
            force: 0,
            actions: actionsList,
          }),
        },
        gas,
        amount: ONE_YOCTO_NEAR,
      },
    ],
  });

  return executeMultipleTransactions(transactions, false);
};
export async function makeDclSwap_nearUsdt({
  dcl_pool_id,
  slippageTolerance,
  dcl_quote_amout,
  nearMetadata,
  usdcMetadata,
  tokenInAmount,
}: {
  dcl_pool_id: string;
  slippageTolerance: number;
  dcl_quote_amout: string;
  nearMetadata: TokenMetadata;
  usdcMetadata: TokenMetadata;
  tokenInAmount: string;
}) {
  return v3Swap({
    Swap: {
      pool_ids: [dcl_pool_id],
      min_output_amount: percentLess(slippageTolerance, dcl_quote_amout),
    },
    swapInfo: {
      tokenA: nearMetadata,
      tokenB: usdcMetadata,
      amountA: tokenInAmount,
      amountB: toReadableNumber(usdcMetadata.decimals, dcl_quote_amout),
    },
    isRefresh: false,
  });
}
export async function makeV1Swap_nearUsdt({
  usdcMetadata,
  usdtMetadata,
  amountIn,
  nonEstimateOutAmountWithSlippageTolerance,
}: {
  usdcMetadata: TokenMetadata;
  usdtMetadata: TokenMetadata;
  amountIn: string;
  nonEstimateOutAmountWithSlippageTolerance: string;
}) {
  return swapFromFourPool({
    tokenIn: usdcMetadata,
    tokenOut: usdtMetadata,
    amountIn, // NonDivisibleNumber
    pool_id: four_stable_pool_id,
    min_amount_out: nonEstimateOutAmountWithSlippageTolerance,
  });
}
