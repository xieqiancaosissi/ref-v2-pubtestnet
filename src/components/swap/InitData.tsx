import React, { useEffect } from "react";
import { useRouter } from "next/router";
import getConfigV2 from "@/utils/configV2";
import { usePersistSwapStore, useSwapStore } from "@/stores/swap";
import { useTokenStore, ITokenStore } from "@/stores/token";
import { useAccountStore } from "@/stores/account";
import useAllWhiteTokensWithBalances from "@/hooks/useAllWhiteTokensWithBalances";
import { setSwapTokenAndBalances } from "@/components/common/SelectTokenModal/tokenUtils";
import { IUITokens } from "@/interfaces/tokens";
import { getAllTokenPrices } from "@/services/farm";
import { ftGetTokenMetadata } from "@/services/token";
import { TokenMetadata } from "@/services/ft-contract";
import { getTopTokens } from "@/services/indexer";
const configV2 = getConfigV2();
const { INIT_SWAP_PAIRS } = configV2;
function InitData(props: any) {
  const {
    defaultAccountTokensHook,
    tknAccountTokensHook,
    tknxAccountTokensHook,
    mcAccountTokensHook,
  } = useAllWhiteTokensWithBalances();
  const persistSwapStore = usePersistSwapStore();
  const swapStore = useSwapStore();
  const tokenStore = useTokenStore() as ITokenStore;
  const accountStore = useAccountStore();
  const accountId = accountStore.getAccountId();
  const walletLoading = accountStore.getWalletLoading();
  const global_whitelisted_tokens_ids =
    tokenStore.get_global_whitelisted_tokens_ids();
  const tokenInId = persistSwapStore.getTokenInId();
  const tokenOutId = persistSwapStore.getTokenOutId();
  const router = useRouter();
  useEffect(() => {
    getAllTokenPrices().then((res) => {
      swapStore.setAllTokenPrices(res);
    });
  }, []);
  useEffect(() => {
    if (!walletLoading && global_whitelisted_tokens_ids?.length > 0) {
      initPairData();
    }
  }, [walletLoading, accountId, global_whitelisted_tokens_ids?.length]);
  useEffect(() => {
    if (tokenInId && tokenOutId && accountId) {
      const timerId = setInterval(() => {
        setSwapTokenAndBalances({
          tokenInId,
          tokenOutId,
          accountId,
          swapStore,
          persistSwapStore,
          tokenStore,
          global_whitelisted_tokens_ids,
          doNotshowLoading: true,
        });
      }, 10000);
      if (props.visibilityState == "hidden") {
        clearInterval(timerId);
      } else if (props.visibilityState == "visible") {
        setSwapTokenAndBalances({
          tokenInId,
          tokenOutId,
          accountId,
          swapStore,
          persistSwapStore,
          tokenStore,
          global_whitelisted_tokens_ids,
          doNotshowLoading: true,
        });
      }
      return () => clearInterval(timerId);
    }
  }, [tokenInId, tokenOutId, accountId, props.visibilityState]);
  useEffect(() => {
    tokenStore.setDefaultAccountTokens(
      defaultAccountTokensHook || ({} as IUITokens)
    );
  }, [JSON.stringify(defaultAccountTokensHook || {})]);
  useEffect(() => {
    if (!walletLoading) {
      updateSwapLink(1);
    }
  }, [tokenInId, tokenOutId, walletLoading]);
  useEffect(() => {
    if (!walletLoading) {
      updateSwapLink(2);
    }
  }, [router.pathname, walletLoading]);
  useEffect(() => {
    tokenStore.setTknAccountTokens(tknAccountTokensHook || ({} as IUITokens));
  }, [JSON.stringify(tknAccountTokensHook || {})]);
  useEffect(() => {
    tokenStore.setTknxAccountTokens(tknxAccountTokensHook || ({} as IUITokens));
  }, [JSON.stringify(tknxAccountTokensHook || {})]);
  useEffect(() => {
    tokenStore.setMcAccountTokens(mcAccountTokensHook || ({} as IUITokens));
  }, [JSON.stringify(mcAccountTokensHook || {})]);
  useEffect(() => {
    getTopTokens().then((res) => {
      const map = res.reduce((acc, cur) => {
        return {
          ...acc,
          [cur.token_id]: cur.volume24h,
        };
      }, {});
      tokenStore.setTopTokenVolumeMap(map);
    });
  }, []);
  async function initPairData() {
    const tokenInIdStore = persistSwapStore.getTokenInId();
    const tokenOutIdStore = persistSwapStore.getTokenOutId();
    let [urlTokenIn, urlTokenOut] = decodeURIComponent(
      location.hash.slice(1)
    ).split("|");
    const isSwap = location.pathname == "/";
    if (urlTokenIn) {
      const invalid = await verify_token(urlTokenIn);
      if (invalid || !isSwap) urlTokenIn = "";
    }
    if (urlTokenOut) {
      const invalid = await verify_token(urlTokenOut);
      if (invalid || !isSwap) urlTokenOut = "";
    }

    const tokenInId = getTokenId({
      idFromStore: urlTokenIn || tokenInIdStore,
      isIn: true,
    });
    const tokenOutId = getTokenId({
      idFromStore: urlTokenOut || tokenOutIdStore,
      isIn: false,
    });
    setSwapTokenAndBalances({
      tokenInId,
      tokenOutId,
      accountId,
      swapStore,
      persistSwapStore,
      tokenStore,
      global_whitelisted_tokens_ids,
    });
  }
  async function updateSwapLink(mode: 1 | 2) {
    if (tokenInId && tokenOutId && router.pathname == "/") {
      const currentHash = location.hash;
      if (mode == 1) {
        const newHash = `#${tokenInId}|${tokenOutId}`;
        if (currentHash !== newHash) {
          router.replace(
            `${location.search}/#${tokenInId}|${tokenOutId}`,
            undefined,
            { shallow: true }
          );
        }
      } else if (mode == 2) {
        let [urlTokenIn, urlTokenOut] = decodeURIComponent(
          location.hash.slice(1)
        ).split("|");
        if (urlTokenIn) {
          const invalid = await verify_token(urlTokenIn);
          if (invalid) urlTokenIn = "";
        }
        if (urlTokenOut) {
          const invalid = await verify_token(urlTokenOut);
          if (invalid) urlTokenOut = "";
        }
        const inId = urlTokenIn || tokenInId;
        const outId = urlTokenOut || tokenOutId;
        const newHash = `#${inId}|${outId}`;
        if (currentHash !== newHash) {
          router.replace(`${location.search}/#${inId}|${outId}`, undefined, {
            shallow: true,
          });
        }
      }
    }
  }

  function getTokenId({
    idFromStore,
    isIn,
  }: {
    idFromStore: string;
    isIn: boolean;
  }) {
    const tokenId =
      idFromStore || (isIn ? INIT_SWAP_PAIRS[0] : INIT_SWAP_PAIRS[1]);
    return tokenId;
  }
  async function verify_token(token_id) {
    const token: TokenMetadata = await ftGetTokenMetadata(token_id);
    return token.invalid;
  }
  return null;
}
export default React.memo(InitData);
