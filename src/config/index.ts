import { Metaplex } from "@metaplex-foundation/js";
import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

export const config = {

  // Logging configuration
  logPath: "src/logs/logs",
  logLevel: "info",

  lastBlock_Update_cycle: 1 * 1000, // 1 s
};

const SOLANA_RPC_URL: string =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
export const SOLANA_WSS_URL: string =
  process.env.SOLANA_WSS_URL || "ws://api.mainnet-beta.solana.com";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

export const connection = new Connection(SOLANA_RPC_URL, {
  wsEndpoint: SOLANA_WSS_URL,
});
export const metaplex = new Metaplex(connection);

export const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY));

export enum START_TXT {
  log = "🧹 Log files swept clean...",
  server = "🚀 Server is running...",
  sniper = "🎯 Sniper service started...",
  db = "🌟 MongoDB connected...",
  sell = "💰 Sell monitor started...",
}
