import { VersionedTransaction } from "@solana/web3.js";
import { connection, wallet } from "../../config";
import { JitoBundleService } from "./jito/jito";
import { ISwapHashResponse, SwapParam } from "../../utils/types";
import { simulateTxn } from "../../utils/utils";
import { pumpfunSwap } from "./pumpfun/pumpfunSwap";

export async function confirmVtxn(txn: VersionedTransaction) {
  const rawTxn = txn.serialize();
  const jitoBundleInstance = new JitoBundleService();
  const txHash = await jitoBundleInstance.sendTransaction(rawTxn);
  const txRlt = await connection.confirmTransaction(txHash);
  if (txRlt.value.err) return null;
  return { txHash };
}

export const swap = async (
  swapParam: SwapParam
): Promise<ISwapHashResponse | null> => {
  try {
    let vTxn;
    let price_sol = 0;
    let inAmount;
    let outAmount;
    let swapResponse = await pumpfunSwap(swapParam);

    if (swapResponse) {
      vTxn = swapResponse?.vTxn;
      inAmount = swapResponse?.inAmount;
      outAmount = swapResponse?.outAmount;
      price_sol = inAmount / outAmount;
    } else {
      console.log("- failed making swap txn");
      return null;
    }
    if (!vTxn) return null;
    vTxn.sign([wallet]);
    await simulateTxn(vTxn);
    const result = await confirmVtxn(vTxn);
    if (!result) return null;
    const { txHash } = result;
    return {
      txHash,
      price: price_sol,
    };
  } catch (e: any) {
    console.error("- Error while running swap function", e.message);
    return null;
  }
};
