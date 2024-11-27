import { StablePool } from "@/interfaces/swap";
import { PoolInfo } from "@/services/swapV3";
import { TokenMetadata } from "@/services/ft-contract";
export type IProcess = "0" | "1" | "2" | "3"; // "0": dcl transaction has been processing, "1": "The dcl transaction has been completed", "2": "The v1 transaction has been processing", "3": "The v1 transaction has been completed"
export interface INEAR_USDT_SWAP_TODOS {
  tokenInAmount: string;
  estimateOutAmount: string;
  estimateOutAmountWithSlippageTolerance: string;
  dcl_quote_amout: string;
  dcl_quote_amout_real?: string;
  nonEstimateOutAmount: string;
  nonEstimateOutAmountWithSlippageTolerance: string;
  mixTag: string;
  quoteDone: boolean;
  canSwap: boolean;
  pools: [PoolInfo, StablePool];
  tokens: [TokenMetadata, TokenMetadata, TokenMetadata];
  slippageTolerance: number;
  mixError: Error;
  fee: number;
  priceImpact: string;
  accountId?: string;
  process: IProcess;
}
