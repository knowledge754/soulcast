/**
 * Solana Chain Service — Phantom / Solflare 钱包
 *
 * 上链方案：Memo Program 记录胶囊元数据（IPFS CID、类型、解锁时间），
 * 交易永久存储在 Solana 账本上，可通过区块浏览器验证。
 * 如有 SOL 锁入则通过 SystemProgram.transfer 发送给接收方或自身。
 */
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import type { ChainConfig } from './chains'
import { getRpcUrl } from './chains'
import type { CreateCapsuleParams, TxStepCallback, OnChainCapsule } from './types'

interface SolanaWallet {
  publicKey: PublicKey | null
  signTransaction: (tx: Transaction) => Promise<Transaction>
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>
  connect: () => Promise<{ publicKey: PublicKey }>
  disconnect: () => Promise<void>
  isConnected: boolean
}

function getPhantom(): SolanaWallet | null {
  if (typeof window === 'undefined') return null
  const phantom = (window as Record<string, unknown>).phantom as
    { solana?: SolanaWallet } | undefined
  return phantom?.solana ?? null
}

function getSolflare(): SolanaWallet | null {
  if (typeof window === 'undefined') return null
  return (window as Record<string, unknown>).solflare as SolanaWallet | null
}

export function getSolanaWallet(): SolanaWallet | null {
  return getPhantom() || getSolflare()
}

export async function connectSolana(): Promise<string> {
  const wallet = getSolanaWallet()
  if (!wallet) throw new Error('请安装 Phantom 或 Solflare 钱包')
  if (!wallet.isConnected) await wallet.connect()
  if (!wallet.publicKey) throw new Error('Solana 钱包连接失败')
  return wallet.publicKey.toBase58()
}

export async function disconnectSolana(): Promise<void> {
  const wallet = getSolanaWallet()
  if (wallet?.isConnected) await wallet.disconnect()
}

export async function createCapsuleSolana(
  chain: ChainConfig,
  params: CreateCapsuleParams,
  onStep?: TxStepCallback
): Promise<{ txHash: string; capsuleId: number }> {
  const wallet = getSolanaWallet()
  if (!wallet?.publicKey) throw new Error('请先连接 Phantom 钱包')

  const rpcUrl = getRpcUrl(chain)
  const connection = new Connection(rpcUrl, 'confirmed')

  onStep?.({ step: 'prepare', status: 'pending', message: '准备 Solana 交易...' })

  const tx = new Transaction()

  // 1. SOL 锁入：转给接收方（他言）或自身（自言/世言）
  let totalLamports = 0
  for (const tk of params.tokens) {
    if (tk.address === 'native' || tk.address === 'So11111111111111111111111111111111') {
      totalLamports += Math.floor(parseFloat(tk.amount) * LAMPORTS_PER_SOL)
    }
  }
  if (totalLamports > 0) {
    const recipient = params.capsuleType === 'other' && params.recipient
      ? new PublicKey(params.recipient)
      : wallet.publicKey
    tx.add(SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: totalLamports,
    }))
  }

  // 2. Memo Program 写入胶囊元数据（永久上链）
  const memo = JSON.stringify({
    app: 'chainlog',
    v: 1,
    cid: params.contentCID,
    type: params.capsuleType,
    unlock: params.unlockTime,
    early: params.allowEarlyUnlock,
    sol: totalLamports > 0 ? (totalLamports / LAMPORTS_PER_SOL).toString() : undefined,
  })
  tx.add({
    keys: [],
    programId: new PublicKey('MemoSQ4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: new TextEncoder().encode(memo),
  })

  onStep?.({ step: 'sign', status: 'pending', message: '请在 Phantom 中签名...' })

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
  tx.recentBlockhash = blockhash
  tx.feePayer = wallet.publicKey

  const signed = await wallet.signTransaction(tx)

  onStep?.({ step: 'broadcast', status: 'pending', message: '广播交易到 Solana 网络...' })
  const txHash = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false })

  onStep?.({ step: 'confirm', status: 'confirming', message: '等待 Solana 确认...', txHash })
  await connection.confirmTransaction({ signature: txHash, blockhash, lastValidBlockHeight }, 'confirmed')

  onStep?.({ step: 'confirm', status: 'done', message: '胶囊已上链 Solana ✓', txHash })

  return { txHash, capsuleId: Date.now() % 100000 }
}

export async function fetchCapsuleSolana(
  chain: ChainConfig,
  _capsuleId: number
): Promise<OnChainCapsule | null> {
  const _conn = new Connection(getRpcUrl(chain), 'confirmed')
  return null
}

export async function estimateGasSolana(
  _chain: ChainConfig,
  params: CreateCapsuleParams
): Promise<{ totalUsd: number }> {
  const baseFee = 5000
  const totalLamports = baseFee + params.tokens.length * 5000 + params.nfts.length * 5000
  const totalSol = totalLamports / LAMPORTS_PER_SOL
  const solPrice = 145
  return { totalUsd: Number((totalSol * solPrice).toFixed(4)) || 0.001 }
}
