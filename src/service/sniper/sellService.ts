import chalk from "chalk";
import { wallet } from "../../config";
import logger from "../../logs/logger";
import { swap } from "../swap/swap";
import { getPumpPrice } from "../../utils/getPumpPrice";
import { PumpData, SwapParam } from "../../utils/types";
import { getTokenBalance, sleepTime } from "../../utils/utils";

export const excuteSellSwap = async (mint: string, pumpData: PumpData, buyPrice_sol: number) => {
  const slippage = 100;
  const tip_sol = 0.000_001;
  const curTokenAmount = await getTokenBalance(
    // with decimals
    wallet.publicKey.toBase58(),
    mint
  );
  sleepTime(500);
  const swapParam: SwapParam = {
    mint: mint,
    amount: curTokenAmount, // no decimals
    tip: tip_sol, // no decimals
    slippage: slippage, // 0.1 ~ 100
    is_buy: false,
    isSellAll: true,
    pumpData,
  };
  // while (true) {
  //   const curPrice = await getPumpPrice(pumpData.bondingCurve.toBase58());
  //   const delta = Math.abs(buyPrice_sol - curPrice);
  //   if(delta / (buyPrice_sol / 100) >= 10) {
      const swapResponse = await swap(swapParam);
      if (swapResponse) {
        const txHash = swapResponse.txHash;
        logger.info(chalk.green(`[ - ] 💰 https://solscan.io/tx/${txHash}`));
        return;
      }
  //   }
  // }
};
