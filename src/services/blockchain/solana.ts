/**
 * Solana Chain Service — Phantom / Solflare 钱包交互
 *
 * Solana 程序 (Program) 使用 Anchor 框架部署，
 * 前端通过 @solana/web3.js 与之交互。
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

  if (!wallet.isConnected) {
    await wallet.connect()
  }

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
  if (!wallet?.publicKey) throw new Error('Solana 钱包未连接')

  const connection = new Connection(getRpcUrl(chain), 'confirmed')

  onStep?.({ step: 'prepare', status: 'pending', message: '准备 Solana 交易...' })

  /**
   * Solana Program 交互需要用 Anchor IDL。
   * 这里使用 SystemProgram.transfer 作为演示 —
   * 实际部署后替换为真实的 Program instruction。
   */
  const tx = new Transaction()

  let totalLamports = 0
  for (const tk of params.tokens) {
    if (tk.address === 'native' || tk.address === 'So11111111111111111111111111111111') {
      totalLamports += Math.floor(parseFloat(tk.amount) * LAMPORTS_PER_SOL)
    }
  }

  if (totalLamports > 0) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(chain.capsuleContract),
        lamports: totalLamports,
      })
    )
  }

  // Memo: store CID reference on-chain
  const memoData = Buffer.from(JSON.stringify({
    type: 'chainlog_capsule',
    cid: params.contentCID,
    unlockTime: params.unlockTime,
    capsuleType: params.capsuleType,
  }))
  tx.add({
    keys: [],
    programId: new PublicKey('MemoSQ4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: memoData,
  })

  onStep?.({ step: 'sign', status: 'pending', message: '请在钱包中签名...' })

  const { blockhash } = await connection.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = wallet.publicKey

  const signed = await wallet.signTransaction(tx)
  onStep?.({ step: 'broadcast', status: 'pending', message: '广播交易到 Solana...' })

  const txHash = await connection.sendRawTransaction(signed.serialize())
  onStep?.({ step: 'confirm', status: 'confirming', message: '等待确认...', txHash })

  await connection.confirmTransaction(txHash, 'confirmed')
  onStep?.({ step: 'confirm', status: 'done', message: '胶囊已上链 Solana!', txHash })

  const capsuleId = Date.now() % 100000
  return { txHash, capsuleId }
}

export async function fetchCapsuleSolana(
  _chain: ChainConfig,
  _capsuleId: number
): Promise<OnChainCapsule | null> {
  console.log('[Solana] fetchCapsule not yet implemented for program accounts')
  return null
}

export async function estimateGasSolana(
  chain: ChainConfig,
  params: CreateCapsuleParams
): Promise<{ totalUsd: number }> {
  try {
    const connection = new Connection(getRpcUrl(chain), 'confirmed')
    const feeCalculator = await connection.getMinimumBalanceForRentExemption(0)
    const baseFee = 5000 // ~0.000005 SOL
    const totalLamports = baseFee + params.tokens.length * 5000 + params.nfts.length * 5000
    const totalSol = totalLamports / LAMPORTS_PER_SOL
    const price = 145 // SOL price in USD
    return { totalUsd: Number((totalSol * price + feeCalculator * 0).toFixed(4)) }
  } catch {
    return { totalUsd: 0.001 }
  }
}
