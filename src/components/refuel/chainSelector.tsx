import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import { useRefuelStore, usePersistRefuelStore } from "@/stores/refuel";
import { NEAR_META_DATA } from "@/utils/nearMetaData";
import SvgIcon from "@/components/bridge/SvgIcon";
import { Image } from "@nextui-org/react";
import { formatChainIcon } from "@/utils/format";
import { SupportChains } from "@/config/bridge";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useAccountStore } from "@/stores/account";
import { useAppStore } from "@/stores/app";
import { showWalletSelectorModal } from "@/utils/wallet";
function Selector() {
  return (
    <div className="flex items-center justify-between gap-5 mt-5">
      {/* chain selector */}
      <ChainSelector />
      {/* near block */}
      <NearBlock />
    </div>
  );
}
function ChainSelector() {
  const { isEVMSignedIn, connect } = useEvmWallet();
  const persistRefuelStore = usePersistRefuelStore();
  const { selectedChain: currentChain, setSelectedChain } = persistRefuelStore;
  const supportChains = SupportChains.filter((chain) => chain !== "NEAR");
  function select(c) {
    setSelectedChain(c);
  }
  return (
    <div className="flex flex-col gap-2.5 w-1 flex-grow relative">
      <span className="text-gray-60 text-sm">Transfer from</span>
      <div className="relative w-full">
        {isEVMSignedIn ? (
          <Dropdown className="bg-dark-10">
            <DropdownTrigger className="w-full">
              <Button className="flex items-center justify-between h-[55px] rounded-lg bg-black bg-opacity-20 px-3 pr-4 cursor-pointer">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <Image
                    src={formatChainIcon(currentChain)}
                    width={24}
                    alt=""
                    height={24}
                  />
                  {currentChain}
                </div>
                <SvgIcon
                  name="IconArrowDown"
                  className="text-xs text-gray-60"
                />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              className="h-[300px] overflow-auto bg-dark-10"
              onAction={(s) => {
                select(s);
              }}
            >
              {supportChains.map((option) => (
                <DropdownItem
                  key={option}
                  className="data-[hover=true]:bg-white data-[hover=true]:bg-opacity-10"
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={formatChainIcon(option)}
                      width={24}
                      height={24}
                      classNames={{
                        wrapper: "w-6 h-6 bg-black rounded-md flex-shrink-0",
                      }}
                      alt=""
                    />
                    <div className="min-w-20">{option}</div>
                    {currentChain === option && (
                      <SvgIcon
                        name="IconSuccess"
                        className="inline-block text-primary"
                      />
                    )}
                  </div>
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        ) : (
          <Button
            onClick={() => {
              connect();
            }}
            className="flex items-center justify-center cursor-pointer w-full h-[55px] bg-white bg-opacity-15 rounded-lg"
          >
            <span className="underline text-sm text-primaryGreen font-bold">
              Connect
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
function NearBlock() {
  const accountStore = useAccountStore();
  const appStore = useAppStore();
  const accountId = accountStore.getAccountId();
  function showWalletSelector() {
    showWalletSelectorModal(appStore.setShowRiskModal);
  }
  return (
    <div className="w-1 flex-grow flex flex-col gap-2.5">
      <span className="text-gray-60 text-sm">Transfer to</span>
      {accountId ? (
        <div className="flex flex-col gap-2.5 w-full">
          <div className="flex items-center h-[55px] rounded-lg bg-white bg-opacity-5 px-3 gap-2">
            <Image src={NEAR_META_DATA.icon} width={24} alt="" height={24} />
            <span className="font-bold text-white text-base">NEAR</span>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => {
            showWalletSelector();
          }}
          className="flex items-center justify-center cursor-pointer w-full h-[55px] bg-white bg-opacity-15 rounded-lg"
        >
          <span className="underline text-sm text-primaryGreen font-bold">
            Connect
          </span>
        </Button>
      )}
    </div>
  );
}

export default React.memo(Selector);
