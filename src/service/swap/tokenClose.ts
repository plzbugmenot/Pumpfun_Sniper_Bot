import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { wallet } from "../../config";
import { JitoAccounts } from "./jito/jito";
import {
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { TOKEN_DECIMALS } from "../../utils/constants";
import { getLastValidBlockhash } from "../sniper/getBlock";

export const tokenClose = async (
  mint: string,
  amount: number,
  isSellAll: boolean
): Promise<VersionedTransaction | null> => {
  if (!mint) return null;
  let instructions: TransactionInstruction[] = [];

  const tip = 0.000_001;
  const feeInstructions = SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: new PublicKey(JitoAccounts[1]),
    lamports: tip * LAMPORTS_PER_SOL,
  });
  instructions.push(feeInstructions);
  const splAta = getAssociatedTokenAddressSync(
    new PublicKey(mint),
    wallet.publicKey,
    true
  );
  if (amount > 0) {
    // console.log("amount is larger than 0", amount);
    instructions.push(
      createBurnCheckedInstruction(
        splAta,
        new PublicKey(mint),
        wallet.publicKey,
        amount, // with lamport
        TOKEN_DECIMALS
      )
    );
  }
  if(isSellAll) {

    instructions.push(
      createCloseAccountInstruction(
        splAta,
        wallet.publicKey,
        wallet.publicKey
      )
    )
  }
  const blockhash = getLastValidBlockhash();

  const messageV0 = new TransactionMessage({
    payerKey: wallet.publicKey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const vTxn = new VersionedTransaction(messageV0);
  return vTxn;
};
