import React from "react";
import SlippageSelector from "@/components/bridge/StableSlipSelector";
import Button from "@/components/bridge/Button";
import SvgIcon from "@/components/bridge/SvgIcon";
import { QuestionMark } from "@/components/farm/icon";
import { useRefuelStore, usePersistRefuelStore } from "@/stores/refuel";
import CopyToClipboard from "react-copy-to-clipboard";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { formatSortAddress } from "@/utils/format";
import { useAutoResetState } from "@/hooks/useHooks";
function Header() {
  const [showToast, setShowToast] = useAutoResetState(false, 1000);
  const { requestPrepareResult } = useRefuelStore();
  const persistRefuelStore = usePersistRefuelStore();
  const { slippageTolerance, setSlippageTolerance } = persistRefuelStore;
  const { disconnect, accountId } = useEvmWallet();
  const { loading, run } = requestPrepareResult;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 text-xl text-white font-SpaceGroteskBold font-bold bridge-primary-label">
        Refuel Gas
        <QuestionMark
          className="cursor-pointer"
          onClick={() => {
            window.open("https://guide.ref.finance");
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        {accountId ? (
          <Button rounded size="small">
            <span className="inline-flex w-2 h-2 rounded-full bg-primary mr-2"></span>
            <span className="relative text-white mr-2">
              <CopyToClipboard
                text={accountId}
                onCopy={() => setShowToast(true)}
              >
                <span> {formatSortAddress(accountId)}</span>
              </CopyToClipboard>
              {showToast && (
                <span className="text-xs text-white rounded-lg px-2.5 py-1.5 absolute -top-10 left-0 bg-black z-50">
                  Copied!
                </span>
              )}
            </span>
            {
              <div
                className="inline-flex transform hover:opacity-80 hover:shadow-lg hover:scale-125"
                onClick={(e) => {
                  disconnect();
                }}
              >
                <SvgIcon name="IconDisconnect" />
              </div>
            }
          </Button>
        ) : null}

        <Button
          size="small"
          plain
          onClick={() => {
            if (loading) return;
            run();
          }}
        >
          <SvgIcon
            name="IconRefresh"
            className={loading ? "animate-spin text-primary" : ""}
          />
        </Button>
        <SlippageSelector
          slippageTolerance={(slippageTolerance || 0) * 100}
          onChange={(val) => setSlippageTolerance((val || 0) / 100)}
          validSlippageList={[1, 1.2, 1.5]}
        >
          <Button size="small" plain>
            <SvgIcon name="IconSetting" />
          </Button>
        </SlippageSelector>
      </div>
    </div>
  );
}

export default React.memo(Header);
