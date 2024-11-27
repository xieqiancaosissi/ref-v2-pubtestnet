import {
  auroraAddr,
  auroraCallToAction,
  buildInput,
  toAddress,
} from "@/services/aurora";
import {
  auroraServices,
  evmServices,
  nearServices,
  tokenServices,
} from "./contract";
import StargateAbi from "./abi/stargate.json";

import { BridgeTransferParams } from ".";
import { BigNumber, ethers } from "ethers";
import { formatAmount, parseAmount } from "@/utils/format";
import { logger } from "@/utils/common";
import { Optional, Transaction } from "@near-wallet-selector/core";
import {
  BridgeConfig,
  BridgeTokenRoutes,
  uniswapV2Router02SwapPath,
  minSwapAmountInUniswapV2Router02,
  defaulSwapFee,
  defaultBridgeFee,
} from "@/config/bridge";
import { uniswapV2Router02Services } from "@/services/bridge/contract";
import {
  getChainMainToken,
  getTokenDecimals,
  getTokenMeta,
} from "@/utils/token";
import Big from "big.js";
import { chain, startCase } from "lodash";

const stargateBridgeService = {
  auroraReceiveContract: null as any,
  async initAuroraReceiveContract() {
    if (!stargateBridgeService.auroraReceiveContract) {
      stargateBridgeService.auroraReceiveContract =
        await auroraServices.getAuroraContract(
          BridgeConfig.Stargate.bridgeParams.Aurora.receive,
          StargateAbi
        );
    }
    return stargateBridgeService.auroraReceiveContract;
  },

  transfer(params: BridgeTransferParams) {
    if (params.to === "NEAR") {
      return stargateBridgeService.evmToNear(params);
    } else {
      return stargateBridgeService.nearToEvm(params);
    }
  },
  async query(params: BridgeTransferParams): Promise<{
    //not contain slippage
    minAmount: string;
    readableMinAmount: string;
    //contain slippage
    minAmountWithSlippage: string;
    readableMinAmountWithSlippage: string;

    feeAmount: string;
    readableFeeAmount: string;
    usdFee: string;
    protocolFee: string;
    readableProtocolFee?: string;
    discounted: boolean;
    sendParam: any;
    messagingFee: any;
    valueToSend: string;
    insufficientFeeBalance?: boolean;
    swapFeeUsd?: string;
    readableSwapOutAmountMin?: string;
    readableSwapOutAmountMinWithSlippage?: string;
    bridgeFeeUsed?: string;
    queryParamsTag?: {
      chain: string;
      amount: string;
      slippage: number;
      mode: BridgeModel.BridgeMode;
    };
  }> {
    if (!params.amount) return;
    const queryParamsTag = {
      chain: params.from,
      amount: params.amount,
      slippage: params.slippage,
      mode: params.mode,
    };
    const protocolFeeRatio = BridgeTokenRoutes.find(
      (item) =>
        item.from.toLowerCase() === params.from.toLowerCase() &&
        item.to.toLowerCase() === params.to.toLowerCase()
    )?.protocolFeeRatio;
    if (params.from === "NEAR") {
      const { discountedFeeUSD, fullFeeUSD } =
        await stargateBridgeService.queryFeeUSD(params);
      const { discounted } = await stargateBridgeService.queryDiscount(params);
      const feeAmount = discounted
        ? discountedFeeUSD.toString()
        : fullFeeUSD.toString();
      logger.log("feeAmount", feeAmount);
      const readableFeeAmount = new Big(
        formatAmount(
          feeAmount,
          getTokenDecimals(params.tokenIn.symbol, params.from)
        )
      )
        .round(6, Big.roundDown)
        .toString();
      logger.log("readableFeeAmount", readableFeeAmount);
      const usdFee = readableFeeAmount;
      if (Number(params.amount) < Number(readableFeeAmount))
        return {
          minAmount: "0",
          readableMinAmount: "0",
          minAmountWithSlippage: "0",
          readableMinAmountWithSlippage: "0",
          feeAmount,
          readableFeeAmount,
          usdFee,
          protocolFee: "0",
          readableProtocolFee: "0",
          discounted,
          sendParam: {},
          messagingFee: {},
          valueToSend: "0",
          swapFeeUsd: "0",
          queryParamsTag,
        };
      else {
        const { sendParam, messagingFee, valueToSend } =
          await stargateBridgeService.prepareTakeTaxiStargate(
            params,
            discounted ? "prepareDiscountTransaction" : "orchestrateTransaction"
          );
        const sendContract =
          await stargateBridgeService.initAuroraReceiveContract();
        const contractFeeBalance = await sendContract.getContractEthBalance();
        logger.log("contractFeeBalance", formatAmount(contractFeeBalance, 18));
        logger.log("messagingFee", formatAmount(messagingFee.nativeFee, 18));
        const insufficientFeeBalance = contractFeeBalance.lt(
          messagingFee.nativeFee
        );
        const minAmount = new Big(sendParam.amountLD.toString())
          .times(1 - protocolFeeRatio)
          .toFixed(0);
        const protocolFee = new Big(sendParam.amountLD.toString())
          .times(protocolFeeRatio)
          .toFixed(0);
        const readableProtocolFee = new Big(
          formatAmount(
            protocolFee,
            getTokenDecimals(params.tokenIn.symbol, params.from)
          )
        )
          .round(6, Big.roundDown)
          .toString();
        const minAmountWithSlippage = new Big(sendParam.minAmountLD.toString())
          .times(1 - params.slippage)
          .toFixed(0);
        logger.log("amountLD", sendParam.amountLD.toString());
        logger.log("minAmount", minAmount);
        logger.log("minAmountWithSlippage", minAmountWithSlippage);
        logger.log("origin minAmountLD", sendParam.minAmountLD.toString());
        const newSendParam = { ...sendParam };
        newSendParam.minAmountLD = BigNumber.from(minAmountWithSlippage);
        const readableMinAmount = new Big(
          formatAmount(
            minAmount,
            getTokenDecimals(params.tokenIn.symbol, params.from)
          )
        )
          .round(6, Big.roundDown)
          .toString();
        const readableMinAmountWithSlippage = new Big(
          formatAmount(
            minAmountWithSlippage,
            getTokenDecimals(params.tokenIn.symbol, params.from)
          )
        )
          .round(6, Big.roundDown)
          .toString();
        return {
          minAmount,
          readableMinAmount,
          minAmountWithSlippage,
          readableMinAmountWithSlippage,
          feeAmount,
          readableFeeAmount,
          usdFee,
          protocolFee,
          readableProtocolFee,
          discounted,
          sendParam: newSendParam,
          messagingFee,
          valueToSend,
          insufficientFeeBalance,
          queryParamsTag,
        };
      }
    } else {
      const { sendParam, messagingFee, valueToSend } =
        await stargateBridgeService.prepareTakeTaxiStargate(params);
      const { nativeFee, lzTokenFee } = messagingFee;
      const feeAmount = new Big(nativeFee).plus(lzTokenFee).toString();
      const mainToken = getChainMainToken(params.from);
      const tokenDecimalsFromChain = getTokenDecimals(
        params.tokenIn.symbol,
        params.from
      );
      const readableFeeAmount = new Big(
        formatAmount(feeAmount, getTokenDecimals(mainToken.symbol, params.from))
      )
        .round(6, Big.roundDown)
        .toString();
      const ethPriceInUSD = await tokenServices.getEvmPrice(mainToken.symbol);
      const usdFee = new Big(readableFeeAmount).times(ethPriceInUSD).toString();
      const rawSwapAmount = parseAmount(
        minSwapAmountInUniswapV2Router02,
        tokenDecimalsFromChain
      );
      const newSendParam = { ...sendParam };
      let minAmount = new Big(sendParam.amountLD.toString())
        .times(1 - protocolFeeRatio)
        .toFixed(0);
      const minminAmount = Big(minAmount).mul(1 - defaultBridgeFee / 10000);
      if (params.mode == 2) {
        const noSwapAmount = Big(minminAmount).minus(rawSwapAmount);
        minAmount = noSwapAmount.gt(0) ? noSwapAmount.toFixed() : "0";
      }
      const protocolFee = new Big(sendParam.amountLD.toString())
        .times(protocolFeeRatio)
        .toFixed(0);
      const readableProtocolFee = new Big(
        formatAmount(protocolFee, tokenDecimalsFromChain)
      )
        .round(6, Big.roundDown)
        .toString();
      const minAmountWithSlippage = new Big(sendParam.minAmountLD.toString())
        .times(1 - params.slippage)
        .toFixed(0);
      newSendParam.minAmountLD = BigNumber.from(minAmountWithSlippage);
      const readableMinAmount = new Big(
        formatAmount(minAmount, tokenDecimalsFromChain)
      )
        .round(6, Big.roundDown)
        .toString();

      const readableMinAmountWithSlippage = new Big(
        formatAmount(minAmountWithSlippage, tokenDecimalsFromChain)
      )
        .minus(params.mode == 2 ? minSwapAmountInUniswapV2Router02 : 0)
        .round(6, Big.roundDown)
        .toString();
      const readableMinAmountLD = new Big(
        formatAmount(sendParam.minAmountLD.toString(), tokenDecimalsFromChain)
      )
        .round(6, Big.roundDown)
        .toString();
      const bridgeFeeUsed = Big(readableMinAmountLD || "0")
        .mul(defaultBridgeFee)
        .div(10000)
        .toFixed();
      let swapFeeUsd = "0";
      if (params.mode == 2) {
        swapFeeUsd = Big(minSwapAmountInUniswapV2Router02)
          .mul(defaulSwapFee)
          .div(10000)
          .toString();
      } else if (params.mode == 3) {
        swapFeeUsd = Big(readableMinAmountLD)
          .mul(defaulSwapFee)
          .div(10000)
          .toString();
      }
      let readableAdjustedAmountIn = "0";
      if (params.mode == 2) {
        readableAdjustedAmountIn = Big(minSwapAmountInUniswapV2Router02)
          .mul(10000 - defaulSwapFee)
          .div(10000)
          .toFixed();
      } else if (params.mode == 3) {
        readableAdjustedAmountIn = Big(readableMinAmount)
          .mul(10000 - defaulSwapFee)
          .div(10000)
          .toFixed();
      }
      let readableSwapOutAmountMin = "0";
      let readableSwapOutAmountMinWithSlippage = "0";
      if (
        (params.mode == 2 || params.mode == 3) &&
        Big(readableAdjustedAmountIn).gt(0)
      ) {
        const rawAdjustedAmountIn = parseAmount(readableAdjustedAmountIn, 6);
        const amountOutMin = await uniswapV2Router02Services.getAmountsOut(
          rawAdjustedAmountIn
        );
        readableSwapOutAmountMin = new Big(
          formatAmount(amountOutMin.toString(), 24)
        )
          .round(6, Big.roundDown)
          .toString();

        readableSwapOutAmountMinWithSlippage = new Big(readableSwapOutAmountMin)
          .times(1 - params.slippage)
          .round(6, Big.roundDown)
          .toString();
      }
      logger.log("-----amountLD", sendParam.amountLD.toString());
      logger.log("-----minAmount", minAmount);
      logger.log("-----minAmountWithSlippage", minAmountWithSlippage);
      logger.log("-----origin minAmountLD", sendParam.minAmountLD.toString());
      logger.log("-----swapFeeUsd", swapFeeUsd);
      logger.log("-----readableSwapOutAmountMin", readableSwapOutAmountMin);
      logger.log(
        "-----readableSwapOutAmountMinWithSlippage",
        readableSwapOutAmountMinWithSlippage
      );
      return {
        minAmount,
        readableMinAmount,
        minAmountWithSlippage,
        readableMinAmountWithSlippage,
        feeAmount,
        readableFeeAmount,
        usdFee,
        protocolFee,
        readableProtocolFee,
        discounted: false,
        sendParam: newSendParam,
        messagingFee,
        valueToSend,
        swapFeeUsd,
        readableSwapOutAmountMin,
        readableSwapOutAmountMinWithSlippage,
        bridgeFeeUsed,
        queryParamsTag,
      };
    }
  },
  //cacheFeeUSD key fromChain_toChain_symbol
  cacheFeeUSD: {} as Record<
    string,
    { discountedFeeUSD: string; fullFeeUSD: string } | undefined
  >,
  async queryFeeUSD(params: BridgeTransferParams) {
    const cacheKey = `${params.from}_${params.to}_${params.tokenIn.symbol}`;
    if (stargateBridgeService.cacheFeeUSD[cacheKey])
      return { ...stargateBridgeService.cacheFeeUSD[cacheKey] };
    const { messagingFee } =
      await stargateBridgeService.prepareTakeTaxiStargate(params);

    const chainId = BridgeConfig.Stargate.bridgeParams[params.to].eid;
    const sendContract =
      await stargateBridgeService.initAuroraReceiveContract();
    const { discountedFeeUSD, fullFeeUSD } = await sendContract.calculateFee(
      messagingFee.nativeFee,
      chainId
    );
    logger.log("discountedFeeUSD", discountedFeeUSD.toString());
    logger.log("fullFeeUSD", fullFeeUSD.toString());

    stargateBridgeService.cacheFeeUSD[cacheKey] = {
      discountedFeeUSD,
      fullFeeUSD,
    };

    return { discountedFeeUSD, fullFeeUSD };
  },
  //cacheDiscount key fromChain_toChain_symbol
  cacheDiscount: {} as Record<string, { discounted: boolean }>,
  async queryDiscount(params: BridgeTransferParams) {
    const cacheKey = `${params.from}_${params.to}_${params.tokenIn.symbol}`;
    if (stargateBridgeService.cacheDiscount[cacheKey])
      return stargateBridgeService.cacheDiscount[cacheKey];

    const chainId = BridgeConfig.Stargate.bridgeParams[params.to].eid;
    const sendContract =
      await stargateBridgeService.initAuroraReceiveContract();
    const [discountPools, { messagingFee }] = await Promise.all([
      sendContract.discountPools(chainId),
      stargateBridgeService.prepareTakeTaxiStargate(
        params,
        "prepareDiscountTransaction"
      ),
    ]);
    const calculateDiscount = await sendContract.calculateDiscount(
      messagingFee.nativeFee,
      chainId
    );
    logger.log("discountPools", discountPools.toString());
    logger.log("calculateDiscount", calculateDiscount.toString());

    const discounted = discountPools.gt(calculateDiscount);
    logger.log("discounted", discounted);
    stargateBridgeService.cacheDiscount[cacheKey] = { discounted };
    return { discounted };
  },

  async prepareTakeTaxiStargate(
    params: BridgeTransferParams,
    method:
      | "prepareTakeTaxiStargate"
      | "prepareDiscountTransaction"
      | "orchestrateTransaction" = "prepareTakeTaxiStargate"
  ) {
    const { from, to, tokenIn, amount, recipient, mode = 1 } = params;
    const rawAmount = parseAmount(
      amount,
      getTokenDecimals(tokenIn.symbol, params.from)
    );
    if (from === "NEAR") {
      try {
        const chainId = BridgeConfig.Stargate.bridgeParams[to].eid;
        const sendContract =
          await stargateBridgeService.initAuroraReceiveContract();
        logger.log(`${method} params`, [chainId, rawAmount, recipient, `0x`]);
        const params = await sendContract[method](
          chainId,
          rawAmount,
          recipient || BridgeConfig.Stargate.bridgeParams.Aurora.receive,
          `0x`
        );
        if (method === "prepareTakeTaxiStargate") {
          const { valueToSend, sendParam, messagingFee } = params;
          return { valueToSend, sendParam, messagingFee };
        } else {
          const [valueToSend, sendParam, messagingFee] = params;
          return { valueToSend, sendParam, messagingFee };
        }
      } catch (error) {
        // console.error(method, error);
        return {};
      }
    } else {
      const sendContract = await evmServices.getEvmContract(
        BridgeConfig.Stargate.bridgeParams[from].send,
        StargateAbi,
        "view",
        from
      );
      let encodedComposeMsg;
      if (mode == 1 || mode == 3) {
        const message = `0x${Buffer.from(
          recipient + (mode == 3 ? ":unwrap" : "") || "",
          "utf-8"
        ).toString("hex")}`;
        const amountIn = 0;
        const amountOutMin = 0;
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        encodedComposeMsg = ethers.utils.defaultAbiCoder.encode(
          ["bytes", "uint256", "uint256", "address[]", "uint256", "uint8"],
          [
            message,
            amountIn,
            amountOutMin,
            uniswapV2Router02SwapPath,
            deadline,
            mode,
          ]
        );
      } else if (mode == 2) {
        const rawAmount = parseAmount(
          minSwapAmountInUniswapV2Router02,
          getTokenDecimals(tokenIn.symbol, params.from)
        );
        const adjustedRawAmount = Big(rawAmount)
          .mul(10000 - defaulSwapFee)
          .div(10000)
          .toFixed(0);
        const amountOutMin = await uniswapV2Router02Services.getAmountsOut(
          adjustedRawAmount
        );
        const amountOutMinWithSlippage = Big(amountOutMin)
          .mul(1 - params.slippage)
          .toFixed(0);
        const message = `0x${Buffer.from(
          recipient + ":unwrap" || "",
          "utf-8"
        ).toString("hex")}`;
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        encodedComposeMsg = ethers.utils.defaultAbiCoder.encode(
          ["bytes", "uint256", "uint256", "address[]", "uint256", "uint8"],
          [
            message,
            adjustedRawAmount,
            amountOutMinWithSlippage,
            uniswapV2Router02SwapPath,
            deadline,
            mode,
          ]
        );
      }
      const receiveAddress = BridgeConfig.Stargate.bridgeParams.Aurora.receive;
      const { valueToSend, sendParam, messagingFee } =
        await sendContract.prepareTakeTaxiStargate(
          BridgeConfig.Stargate.bridgeParams.Aurora.eid,
          rawAmount,
          receiveAddress,
          encodedComposeMsg
        );
      logger.log("prepareTakeTaxiStargate", {
        valueToSend,
        sendParam,
        messagingFee,
      });
      return { valueToSend, sendParam, messagingFee };
    }
  },
  async nearToEvm(params: BridgeTransferParams) {
    const wallet = await window.selector.wallet();
    if (
      ["near-mobile-wallet", "okx-wallet", "mintbase-wallet", "neth"].includes(
        wallet.id
      )
    ) {
      throw new Error(
        `${startCase(
          wallet.id
        )} is not supported for this bridge, please use other wallet.`
      );
    }
    try {
      const { from, tokenIn, amount, sender } = params;
      const auroraAccount = auroraAddr(sender);
      const nearTokenAddress = tokenIn.addresses.NEAR;
      const auroraTokenAddress = tokenIn.addresses.Aurora;
      const rawTotalAmount = parseAmount(
        amount,
        getTokenDecimals(tokenIn.symbol, params.from)
      );

      const transferTransaction = {
        receiverId: nearTokenAddress,
        signerId: sender,
        actions: [
          {
            type: "FunctionCall",
            params: {
              methodName: "ft_transfer_call",
              args: {
                receiver_id: "aurora",
                amount: rawTotalAmount,
                msg:
                  (tokenIn.symbol === "ETH"
                    ? `${auroraAccount}:${"0".repeat(64)}`
                    : "") + `${auroraAccount.substring(2)}`,
              },
              gas: "300000000000000",
              deposit: "1",
            },
          },
        ],
      } as Transaction;

      const auroraTransaction: Optional<Transaction, "signerId"> = {
        receiverId: "aurora",
        signerId: sender,
        actions: [],
      };
      if (tokenIn.symbol !== "ETH") {
        const actionParams = await auroraServices.checkErc20Approve(
          auroraAccount,
          auroraTokenAddress,
          BridgeConfig.Stargate.bridgeParams.Aurora.receive,
          formatAmount(
            rawTotalAmount,
            getTokenDecimals(tokenIn.symbol, params.from)
          ),
          getTokenDecimals(tokenIn.symbol, params.from)
        );
        if (actionParams)
          auroraTransaction.actions.push({
            type: "FunctionCall",
            params: actionParams as any,
          });
      }

      const { discounted, messagingFee, sendParam } =
        await stargateBridgeService.query(params);

      const sendInput = buildInput(
        StargateAbi,
        discounted ? "sendStargateWithDiscount" : "sendStargate",
        [sendParam, messagingFee, auroraAccount, rawTotalAmount]
      );
      const sendActionParams = auroraCallToAction(
        toAddress(BridgeConfig.Stargate.bridgeParams.Aurora.receive),
        sendInput
        // valueToSend
      );
      auroraTransaction.actions.push({
        type: "FunctionCall",
        params: sendActionParams as any,
      });
      logger.log("bridge: send params", {
        transactions: [transferTransaction, auroraTransaction].filter(Boolean),
      });
      const res = await wallet.signAndSendTransactions({
        transactions: [transferTransaction, auroraTransaction],
      });
      // console.log("bridge: send success", res);
      if (Array.isArray(res)) {
        let transaction = res.find(
          (item) =>
            item.transaction.receiver_id === "aurora" &&
            item.transaction.actions?.[0]?.FunctionCall?.method_name === "call"
        );
        logger.log("bridge: send success", res);
        logger.log("bridge: send success2", transaction);
        if (
          !transaction &&
          window.selector?.store?.getState()?.selectedWalletId ==
            "ethereum-wallets"
        ) {
          transaction = res.pop();
        }
        return transaction?.transaction.hash;
      }
    } catch (error) {
      // console.error("bridge: send error", error);
    }
  },
  async evmToNear(params: BridgeTransferParams) {
    const { tokenIn, tokenOut, amount, sender, recipient, from } = params;
    const registerTokenTransaction = await nearServices.checkFTStorageBalance(
      tokenOut.addresses.NEAR,
      recipient
    );
    if (registerTokenTransaction) {
      await nearServices.sendTransaction(registerTokenTransaction);
    }
    const erc20Address = tokenIn.addresses[from];

    const poolAddress =
      BridgeConfig.Stargate.bridgeParams[from]?.pool?.[tokenOut.symbol] ||
      BridgeConfig.Stargate.bridgeParams[from]?.oft?.[tokenOut.symbol];
    const poolContractAbi =
      BridgeConfig.Stargate.bridgeParams[from]?.pool?.[
        tokenOut.symbol + "ABI"
      ] ||
      BridgeConfig.Stargate.bridgeParams[from]?.oft?.[tokenOut.symbol + "ABI"];
    if (!poolAddress) throw new Error("Invalid pool address");

    await evmServices.checkErc20Approve({
      token: erc20Address,
      amount,
      owner: sender,
      spender: poolAddress,
    });
    const { valueToSend, sendParam, messagingFee } =
      await stargateBridgeService.query(params);
    logger.log("bridge: send params", {
      valueToSend,
      sendParam,
      messagingFee,
      sender,
      poolAddress,
    });

    const stargatePoolContract = await evmServices.getEvmContract(
      poolAddress,
      poolContractAbi,
      "call"
    );
    logger.log("stargatePoolContract", stargatePoolContract);
    const tx = await stargatePoolContract.send(
      sendParam,
      messagingFee,
      sender,
      { value: valueToSend, gasLimit: ethers.utils.hexlify(1000000) }
    );
    await tx.wait();
    // console.log("bridge: send success", tx);
    return tx?.hash as string;
  },
};

export default stargateBridgeService;
