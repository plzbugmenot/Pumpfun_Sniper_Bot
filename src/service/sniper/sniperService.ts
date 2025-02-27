import { Commitment, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import chalk from "chalk";
import { swap } from "../swap/swap";
import logger from "../../logs/logger";
import { excuteSellSwap } from "./sellService";
import { getCachedSolPrice } from "./getBlock";
import { connection, START_TXT } from "../../config";
import { SwapParam, PumpData } from "../../utils/types";

const PUMP_WALLET = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);
const COMMITMENT_LEVEL = "confirmed" as Commitment;
let isSwaping = false;
//------------------------- swap --------------------------//
const excuteBuySwap = async (mint: string, pumpData: PumpData) => {
  isSwaping = true;
  try {
    logger.info(
      chalk.blueBright(`[sniperService] Token ${mint} is valid. Buying...`)
    );
    const amt_sol = 0.00_1;
    const slippage = 100;
    const tip_sol = 0.000_01;
    const swapParam: SwapParam = {
      mint: mint,
      amount: amt_sol,
      tip: tip_sol,
      slippage: slippage,
      is_buy: true,
      isPumpfun: true,
      pumpData: {
        price: Number(pumpData.price),
        bondingCurve: pumpData.bondingCurve,
        associatedBondingCurve: pumpData.associatedBondingCurve,
        virtualSolReserves: pumpData.virtualSolReserves,
        virtualTokenReserves: pumpData.virtualTokenReserves,
      },
    };

    const swapResponse = await swap(swapParam);
    // const swapResponse = null;
    if (swapResponse) {
      const { txHash, price } = swapResponse;
      logger.info(chalk.green(`[ - ] 🚀 https://solscan.io/tx/${txHash}`));
      await excuteSellSwap(mint, pumpData, price);
    }
    isSwaping = false;
  } catch (error) {
    logger.error(`[sniperService] Token ${mint} buy error: ${error}`);
    isSwaping = false;
  }
};

export async function sniperService() {
  logger.info(START_TXT.sniper);
  try {
    connection.onLogs(
      PUMP_WALLET,
      async ({ logs, err, signature }) => {
        try {
          if (err) return;
          if (isSwaping) return;
            if (
              logs &&
              logs.some((log) =>
                log.includes("Program log: Instruction: InitializeMint2")
              )
            ) {
              const txn = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
                commitment: "confirmed",
              });

              //@ts-ignore
              const accountKeys = txn?.transaction.message.instructions.find((ix) => ix.programId.toString() === PUMP_WALLET.toBase58())?.accounts as PublicKey[];

              if (accountKeys) {
                const mint = accountKeys[0];
                const user = accountKeys[7]; // dev address
                const bondingCurve = accountKeys[2];
                const associatedBondingCurve = accountKeys[3]; // dev address
                let virtualSolReserves = 30 * LAMPORTS_PER_SOL;
                let virtualTokenReserves = 1000000000 * 10 ** 6;

                if (txn && txn.meta) {
                  const solSpent =
                    Math.abs(
                      txn.meta.postBalances[0] - txn.meta.preBalances[0]
                    ) / LAMPORTS_PER_SOL;

                  const price =
                    (getCachedSolPrice() *
                      (virtualSolReserves / LAMPORTS_PER_SOL)) /
                    (virtualTokenReserves / 10 ** 6);
                  virtualTokenReserves -= (solSpent * 10 ** 6) / price;
                  virtualSolReserves += solSpent * LAMPORTS_PER_SOL;

                  const pumpData: PumpData = {
                    bondingCurve,
                    associatedBondingCurve,
                    virtualSolReserves,
                    virtualTokenReserves,
                    price,
                    progress: 0,
                    totalSupply: 1000000000,
                    marketCap: price * 1000000000,
                  };
                  console.log(`[ sniper ] 🎯 New token ${mint.toBase58()}`);
                  excuteBuySwap(mint.toBase58(), pumpData);
                }
              }
            }
        } catch (e: any) {
          logger.error("* onLogs 1 error: " + e.message);
        }
      },
      COMMITMENT_LEVEL
    );
  } catch (e: any) {
    logger.error("* onLogs 2 error: " + e.message);
  }
}
