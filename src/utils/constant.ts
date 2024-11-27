import BN from "bn.js";
const isTest = process.env.NEXT_PUBLIC_NEAR_ENV == "pub-testnet";
export const MIN_RETAINED_NEAR_AMOUNT = 0.2;
export const POOL_REFRESH_INTERVAL = 20 * 1000;
export const BALANCE_REFRESH_INTERVAL = 20 * 1000;
export const INIT_SLIPPAGE_VALUE = "0.5";
export const DEFAULT_PAGE_LIMIT = 500;
export const TOP_POOLS_TOKEN_REFRESH_INTERVAL = 60 * 2;
export const FEE_DIVISOR = 10000;
export const STABLE_LP_TOKEN_DECIMALS = 18;
export const RATED_POOL_LP_TOKEN_DECIMALS = 24;
export const V3_POOL_FEE_LIST = [100, 400, 2000, 10000];
export const LOW_POOL_TVL_BOUND = 3;
export const PRICE_IMPACT_WARN_VALUE = 1;
export const PRICE_IMPACT_RED_VALUE = 2;
export const STORAGE_PER_TOKEN = "0.005";
export const STORAGE_TO_REGISTER_WITH_FT = "0.1";
export const STORAGE_TO_REGISTER_WITH_MFT = "0.1";
export const MIN_DEPOSIT_PER_TOKEN = new BN("5000000000000000000000");
export const MIN_DEPOSIT_PER_TOKEN_FARM = new BN("45000000000000000000000");
export const ONE_MORE_DEPOSIT_AMOUNT = "0.01";
export const LOG_BASE = 1.0001;
export const V3_POOL_SPLITER = "|";
export const POINTLEFTRANGE = -800000;
export const POINTRIGHTRANGE = 800000;
export const TIMESTAMP_DIVISOR = 1000000000;
export const TKN_SUFFIX = "tkn";
export const TKNX_SUFFIX = "tknx";
export const MC_SUFFIX = "meme-cooking";
export const PUBLIC_BLOCK_FEATURE = true;
export const STORAGE_TO_REGISTER_TOKEN = 0.00125;
export const token_near_id = isTest ? "wrap.testnet" : "wrap.near";
export const token_usdt_id = isTest
  ? "usdt.fakes.testnet"
  : "usdt.tether-token.near";
export const token_usdc_id = isTest
  ? "usdc.fakes.testnet"
  : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1";
export const near_udsc_pool_id = isTest
  ? "usdc.fakes.testnet|wrap.testnet|2000"
  : "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1|wrap.near|2000";
export const four_stable_pool_id = isTest ? 218 : 4179;
export const TIME_OUT = 3000;
export const TIME_OUT_1 = 1500;
