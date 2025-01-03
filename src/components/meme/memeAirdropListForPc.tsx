import React, { useEffect, useState } from "react";
import { memeComingSoonJson } from "./AirdropConfig";
import Modal from "react-modal";
import CustomTooltip from "../customTooltip/customTooltip";
import { RuleIcon, RuleTips, TriangleDown, TriangleUp } from "./icons";
import { ftGetTokenMetadata } from "@/services/token";
import { ModalClose } from "../farm/icon";

export default function MemeAirdropListForPc({ onRequestClose, isOpen }: any) {
  // show rules
  const [isShowRules, setShowRules] = useState<Array<any>>([]);
  const [icons, setIcons] = useState<{ [key: string]: string }>({});
  useEffect(() => {
    const waitDealedData = new Array(memeComingSoonJson.length).fill(false);
    setShowRules(waitDealedData);
  }, []);
  // deal rules show/hide
  const setShowRulesIndex = (index: number, flag: boolean) => {
    //shallow copy
    const updatedWaitDealedData = [...isShowRules];
    updatedWaitDealedData[index] = flag;
    setShowRules(updatedWaitDealedData);
  };

  useEffect(() => {
    setShowRules(new Array(memeComingSoonJson.length).fill(false));
    fetchIcons();
  }, []);
  const fetchIcons = async () => {
    const newIcons: { [key: string]: string } = {};
    const promises = memeComingSoonJson.map(async (item) => {
      const iconData = await ftGetTokenMetadata(item.id);
      newIcons[item.id] = iconData.icon;
    });

    await Promise.all(promises);
    setIcons(newIcons);
  };
  const Tip = `
    <div class="text-navHighLightText text-xs text-left w-42">
    The airdropped tokens below are not investment advice.
    </div>`;
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          outline: "none",
          transform: "translate(-50%, -50%)",
        },
      }}
    >
      <div className="rounded-2xl bg-dark-10" style={{ maxHeight: "36rem" }}>
        {/* header */}
        <div className="px-5 xs:px-3 md:px-3 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <label className="text-white text-xl paceGrotesk-Bold">
              Airdrop Announcement
            </label>
            <div
              className="text-white text-right ml-1.5 inline-block cursor-pointer"
              data-class="reactTip"
              data-tooltip-id="ruleId"
              data-place="left"
              data-tooltip-html={Tip}
            >
              <RuleTips />
              <CustomTooltip id="ruleId" />
            </div>
          </div>
          <ModalClose className="cursor-pointer" onClick={onRequestClose} />
        </div>

        {/* body */}
        <div
          style={{ maxHeight: "32rem" }}
          className="overflow-auto rounded-br-2xl rounded-bl-2xl"
        >
          <div className={`bg-dark-60 py-6 px-6 overflow-auto`}>
            {/* map */}
            {memeComingSoonJson.map((item, index) => {
              return (
                <div
                  key={item.title + index}
                  style={{
                    width: "51rem",
                    maxHeight: "27.375rem",
                    minHeight: "13.25rem",
                  }}
                  className=" bg-dark-40 rounded-2xl mb-4 py-6 px-6 flex"
                >
                  {/* left */}
                  {icons[item.id] ? (
                    <img
                      src={icons[item.id]}
                      alt="Icon"
                      style={{ width: "4rem", height: "4rem" }}
                    />
                  ) : null}

                  {/* right */}
                  <div
                    style={{ width: "36.525rem" }}
                    className="gotham text-white ml-6"
                  >
                    {/* title */}
                    <div>
                      <h3 className="paceGrotesk-Bold text-xl">{item.title}</h3>
                      <p className="text-gray-60 text-sm">{item.introduce}</p>
                    </div>

                    {/* amount & droptime */}
                    <div className="flex items-center justify-between my-2">
                      {/* left */}
                      <div>
                        <h5 className="text-sm">Amount</h5>
                        <p>
                          <span className="text-xl paceGrotesk-Bold text-primaryGreen">
                            {item.amount}
                          </span>
                          {/* <span className="ml-1 text-xs">
                            {item.amountDollar}
                          </span> */}
                        </p>
                      </div>

                      {/* right */}
                      <div>
                        <div>
                          <h5 className="text-sm">Airdrop time</h5>
                          <p className="text-xl paceGrotesk-Bold text-primaryGreen">
                            {item.airdropTime}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* rule change */}
                    <div className=" select-none">
                      <div className="flex items-center">
                        <RuleIcon />
                        <span className="mx-2 my-2 text-base">Rules</span>
                        <div
                          className=" w-5 h-5 rounded-md bg-dark-60 fccc cursor-pointer"
                          onClick={() =>
                            setShowRulesIndex(index, !isShowRules[index])
                          }
                        >
                          {isShowRules[index] ? (
                            <TriangleUp />
                          ) : (
                            <TriangleDown />
                          )}
                        </div>
                      </div>

                      {/* collase */}
                      {isShowRules[index] ? (
                        <div className="h-min overflow-auto p-6 text-sm text-gray-60 border border-dark-90 rounded-lg bg-dark-10 whitespace-pre-wrap leading-6">
                          {item.rules}
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
