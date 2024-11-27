import React from "react";
import { Web3OnboardProvider } from "@web3-onboard/react";
import Header from "@/components/refuel/header";
import ChainSelector from "@/components/refuel/chainSelector";
import InputContainer from "@/components/refuel/inputBox";
import TransactionDetail from "@/components/refuel/transactionDetail";
import ActionButton from "@/components/refuel/actionButton";
import DataManagementCenter from "@/components/refuel/dataManagementCenter";
import { setupWeb3Onboard } from "@/hooks/useWeb3Onboard";
import HistoryButton from "@/components/refuel/historyButton";
import Breadcrumb from "@/components/refuel/breadcrumb";
const web3Onboard = setupWeb3Onboard();
function RefuelPage() {
  return (
    <main className="lg:w-[428px] xsm:max-w-[90vw] mx-auto mt-[60px] xsm:mt-0">
      <Breadcrumb />
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <main className="rounded-lg bg-dark-10 p-4">
          <Header />
          <ChainSelector />
          <InputContainer />
          <TransactionDetail />
          <ActionButton />
          <DataManagementCenter />
        </main>
      </Web3OnboardProvider>
      <HistoryButton />
    </main>
  );
}
RefuelPage.isClientRender = true;
export default RefuelPage;
