import Big from "big.js";
import { twMerge } from "tailwind-merge";
import { isInvalid } from "@/utils/uiNumber";
const efficientDigit = 5;
export function beautifyNumber({
  num,
  className,
  subClassName,
  isUsd,
}: {
  num: string | number;
  className?: string;
  subClassName?: string;
  isUsd?: boolean;
}) {
  if (isInvalid(num))
    return <Wrap className={className}>{isUsd ? "$-" : num}</Wrap>;
  const is_integer = !Big(num).toFixed().includes(".");
  if (is_integer)
    return <Wrap className={className}>{(isUsd ? "$" : "") + num}</Wrap>;
  const arr = num.toString().split(".");
  const interPart = arr[0];
  const floatPart = arr[1];
  if (+interPart == 0 && num.toString().length <= efficientDigit + 2)
    return <Wrap className={className}>{(isUsd ? "$" : "") + num}</Wrap>;
  if (+interPart !== 0 && num.toString().length <= efficientDigit + 1)
    return <Wrap className={className}>{(isUsd ? "$" : "") + num}</Wrap>;

  if (+interPart == 0) {
    const nonZeroIndex = floatPart.split("").findIndex((n) => +n !== 0);
    const pendingNum = Big(num).toFixed(nonZeroIndex + 5);
    if (nonZeroIndex <= 1)
      return (
        <Wrap className={className}>
          {(isUsd ? "$" : "") + "0." + removeFootZero(pendingNum.split(".")[1])}
        </Wrap>
      );
    const nonZeroPart = removeHeadAndFootZero(pendingNum.split(".")[1]);
    return (
      <Wrap className={className}>
        {isUsd ? "$" : ""}0.0
        <span className={twMerge("text-[8px] px-px", subClassName || "")}>
          {nonZeroIndex}
        </span>
        {nonZeroPart}
      </Wrap>
    );
  } else {
    const floatPartLength = Math.max(efficientDigit - interPart.length, 2);
    const pendingNum = Big(num).toFixed(floatPartLength);
    const [onePart, twoPart] = pendingNum.split(".");
    const twoPartRemoveZreo = removeFootZero(twoPart);
    if (twoPartRemoveZreo) {
      return (
        <Wrap className={className}>
          {isUsd ? "$" : ""}
          {onePart}.{twoPartRemoveZreo}
        </Wrap>
      );
    }
    return <Wrap className={className}>{(isUsd ? "$" : "") + onePart}</Wrap>;
  }
}

function removeHeadAndFootZero(str: string) {
  return str.replace(/^0+/, "").replace(/0+$/, "");
}
function removeFootZero(str: string) {
  return str.replace(/0+$/, "");
}
function Wrap({ children, className }: any) {
  return (
    <span className={twMerge("text-sm text-white", className || "")}>
      {children}
    </span>
  );
}

export const beautifyPrice = (num: number): string => {
  if (num === 0) return "0";

  let numStr = num.toString();
  if (numStr.includes("e")) {
    const [base, exp] = numStr.split("e");
    const expNum = parseInt(exp);
    if (expNum < 0) {
      const absExp = Math.abs(expNum);
      numStr = "0." + "0".repeat(absExp - 1) + base.replace(".", "");
    }
  }

  const [integerPart, decimalPart = ""] = numStr.split(".");

  if (+integerPart !== 0) {
    return numStr;
  }

  const firstNonZero = decimalPart.split("").findIndex((n) => n !== "0");
  if (firstNonZero === -1) return "0";

  const significantPart = decimalPart.slice(firstNonZero, firstNonZero + 3);

  if (firstNonZero <= 3) {
    return `0.${decimalPart.slice(0, firstNonZero + 4)}`;
  }

  return `0.0(${firstNonZero})${significantPart}`;
};

export const beautifyPriceWithE = (num: number) => {
  //
  let numStr = num.toString();
  if (numStr.includes("e")) {
    const [base, exp] = numStr.split("e");
    const expNum = parseInt(exp);
    if (expNum < 0) {
      const absExp = Math.abs(expNum);
      numStr = "0." + "0".repeat(absExp - 1) + base.replace(".", "");
    } else {
      numStr = base.replace(".", "") + "0".repeat(expNum);
    }
  }

  const arr = numStr.split(".");
  const integerPart = arr[0];
  const decimalPart = arr[1] || "";

  if (!decimalPart) {
    //
    const digits = integerPart.slice(0, 5);
    //
    return (
      <span key={num} className="animate-flipIn">
        {digits.endsWith("0") ? digits.slice(0, 4) : digits}
      </span>
    );
  }

  if (+integerPart === 0) {
    const nonZeroIndex = decimalPart.split("").findIndex((n) => +n !== 0);
    if (nonZeroIndex <= 1) {
      //
      let significantDigits = decimalPart.replace(/0+$/, "").slice(0, 5);
      if (significantDigits.endsWith("0")) {
        significantDigits = significantDigits.slice(0, 4);
      }
      return (
        <span key={num} className="animate-flipIn">
          ${"0." + significantDigits}
        </span>
      );
    }
    const nonZeroPart = decimalPart.substring(nonZeroIndex);
    let digits = nonZeroPart.slice(0, 4);
    if (digits.endsWith("0")) {
      digits = digits.slice(0, 3);
    }
    return (
      <span key={num} className="animate-flipIn">
        0.0
        <span className="text-[8px] px-px">{nonZeroIndex}</span>
        {digits}
      </span>
    );
  }

  //
  const floatPartLength = Math.max(5 - integerPart.length, 2);
  let formattedDecimal = decimalPart
    .slice(0, floatPartLength)
    .replace(/0+$/, "");

  //
  const fullNumber = integerPart + (formattedDecimal ? formattedDecimal : "");
  if (fullNumber.endsWith("0")) {
    if (formattedDecimal) {
      formattedDecimal = formattedDecimal.slice(0, -1);
    } else {
      return (
        <span key={num} className="animate-flipIn">
          ${integerPart.slice(0, -1)}
        </span>
      );
    }
  }

  return (
    <span key={num} className="animate-flipIn">
      {integerPart}
      {formattedDecimal ? `.${formattedDecimal}` : ""}
    </span>
  );
};
