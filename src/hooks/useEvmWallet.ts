import { useConnectWallet, useSetChain } from "@web3-onboard/react";
export function useEvmWallet() {
  const [{ wallet, connecting }, connect, disconnectWallet] =
    useConnectWallet();
  const [{ connectedChain }, setChain] = useSetChain();
  const isEVMSignedIn = wallet && !connecting;
  const accountId = wallet?.accounts?.[0]?.address;
  function disconnect() {
    disconnectWallet({ label: wallet.label });
  }
  return {
    isEVMSignedIn,
    accountId,
    connecting,
    connect,
    wallet,
    disconnect,
    connectedChain,
    setChain,
  };
}
