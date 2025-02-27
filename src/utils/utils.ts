import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import logger from "../logs/logger";
import { connection, wallet } from "../config";
import {
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from "@raydium-io/raydium-sdk";
import {
  IDexScreenerResponse,
} from "./types";

import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import chalk from "chalk";

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const calculateTotalPercentage = (holders: any[]) => {
  return holders.reduce((total, holder) => total + holder.percentage, 0);
};

export async function sleepTime(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
    array.slice(i * size, i * size + size)
  );
}

export function bufferFromUInt64(value: number | string) {
  let buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(value));
  return buffer;
}

export function readBigUintLE(
  buf: Buffer,
  offset: number,
  length: number
): number {
  switch (length) {
    case 1:
      return buf.readUint8(offset);
    case 2:
      return buf.readUint16LE(offset);
    case 4:
      return buf.readUint32LE(offset);
    case 8:
      return Number(buf.readBigUint64LE(offset));
  }
  throw new Error(`unsupported data size (${length} bytes)`);
}

export const getTokenPriceFromJupiter = async (mint: string) => {
  try {
    const BaseURL = `https://api.jup.ag/price/v2?ids=${mint}`;

    const response = await fetch(BaseURL);
    const data = await response.json();
    const price = data.data[mint]?.price;
    return price;
  } catch (error) {
    logger.error("Error fetching token price from Jupiter: " + error);
    return 0;
  }
};

export const getSolPrice = async () => {
  const WSOL = "So11111111111111111111111111111111111111112";
  const SOL_URL = `https://api.jup.ag/price/v2?ids=${WSOL}`;
  try {
    const BaseURL = SOL_URL;
    const response = await fetch(BaseURL);
    const data = await response.json();
    const price = data.data[WSOL]?.price;
    return price;
  } catch (error) {
    // logger.error("Error fetching SOL price: " + error);
    return 0;
  }
};

export async function simulateTxn(txn: VersionedTransaction) {
  const { value: simulatedTransactionResponse } =
    await connection.simulateTransaction(txn, {
      replaceRecentBlockhash: true,
      commitment: "processed",
    });
  const { err, logs } = simulatedTransactionResponse;
  // console.log("\n🚀 Simulate ~", Date.now());
  if (err) {
    // console.error("* Simulation Error:", err, logs);
    console.log(chalk.red("[ - ] 💥 Simulation Error"));
    throw new Error(
      "Simulation txn. Please check your wallet balance and slippage." +
        err
    );
  }
}

export async function getWalletTokenAccount(): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(
    wallet.publicKey,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export async function getDexscreenerData(
  mint: string
): Promise<IDexScreenerResponse | null> {
  try {
    const url = `https://api.dexscreener.com/token-pairs/v1/solana/${mint}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress: string
) {
  try {
    // Get associated token account
    const associatedTokenAddress = getAssociatedTokenAddressSync(
      new PublicKey(tokenMintAddress),
      new PublicKey(walletAddress)
    );
    const tokenAccountInfo = await connection.getTokenAccountBalance(
      associatedTokenAddress
    );

    return Number(tokenAccountInfo.value.amount);
  } catch (error) {
    return 0;
  }
}
