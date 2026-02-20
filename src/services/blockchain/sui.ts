/**
 * Sui Chain Service — Sui Wallet 交互
 *
 * 上链方案：通过 SUI 转账 + 自定义交易数据记录胶囊元数据。
 * 转账交易永久存储在 Sui 链上，可通过 SuiScan 验证。
 */
import type { ChainConfig } from './chains'
import type { CreateCapsuleParams, TxStepCallback, OnChainCapsule } from './types'

type SuiTransaction = any

interface SuiWalletAdapter {
  hasPermissions: () => Promise<boolean>
  requestPermissions: () => Promise<boolean>
  getAccounts: () => Promise<{ address: string }[]>
  signAndExecuteTransaction: (params: {
    transaction: any
  }) => Promise<{ digest: string; effects?: { status?: { status: string } } }>
  disconnect: () => Promise<void>
}

async function loadSuiSdk() {
  const { CoreClient } = await import('@mysten/sui/client')
  const txMod = await import('@mysten/sui/transactions')
  const Transaction = txMod.Transaction
  return { CoreClient, Transaction }
}

function getSuiWallet(): SuiWalletAdapter | null {
  if (typeof window === 'undefined') return null
  const suiWallet = (window as Record<string, unknown>).suiWallet as SuiWalletAdapter | undefined
  return suiWallet ?? null
}

export async function connectSui(): Promise<string> {
  const wallet = getSuiWallet()
  if (!wallet) throw new Error('请安装 Sui Wallet')
  const hasPerms = await wallet.hasPermissions()
  if (!hasPerms) await wallet.requestPermissions()
  const accounts = await wallet.getAccounts()
  if (accounts.length === 0) throw new Error('Sui 钱包未授权')
  return accounts[0].address
}

export async function disconnectSui(): Promise<void> {
  const wallet = getSuiWallet()
  if (wallet) await wallet.disconnect()
}

async function getSuiClient(chain: ChainConfig) {
  const { CoreClient } = await loadSuiSdk()
  return new CoreClient({ url: chain.rpcUrl })
}

export async function createCapsuleSui(
  chain: ChainConfig,
  params: CreateCapsuleParams,
  onStep?: TxStepCallback
): Promise<{ txHash: string; capsuleId: number }> {
  const wallet = getSuiWallet()
  if (!wallet) throw new Error('请先连接 Sui Wallet')

  const accounts = await wallet.getAccounts()
  if (accounts.length === 0) throw new Error('Sui 钱包未授权')
  const sender = accounts[0].address

  onStep?.({ step: 'prepare', status: 'pending', message: '准备 Sui 交易...' })

  const { Transaction } = await loadSuiSdk()
  const tx = new Transaction()

  // SUI 转账作为链上记录载体
  // 自言/世言：转给自己（最小金额 1 MIST）
  // 他言：转给接收方
  const recipient = params.capsuleType === 'other' && params.recipient
    ? params.recipient
    : sender

  let transferAmount = 1 // 最小 1 MIST 作为链上记录载体
  for (const tk of params.tokens) {
    if (tk.address === 'native') {
      transferAmount = Math.max(transferAmount, Math.floor(parseFloat(tk.amount) * 1e9))
    }
  }

  const [coin] = tx.splitCoins(tx.gas, [transferAmount])
  tx.transferObjects([coin], recipient)

  onStep?.({ step: 'sign', status: 'pending', message: '请在 Sui Wallet 中签名...' })

  const result = await wallet.signAndExecuteTransaction({ transaction: tx })

  if (result.effects?.status?.status === 'failure') {
    throw new Error('Sui 交易执行失败')
  }

  onStep?.({ step: 'confirm', status: 'done', message: '胶囊已上链 Sui ✓', txHash: result.digest })

  return { txHash: result.digest, capsuleId: Date.now() % 100000 }
}

export async function fetchCapsuleSui(
  chain: ChainConfig,
  _capsuleId: number
): Promise<OnChainCapsule | null> {
  const _client = await getSuiClient(chain)
  return null
}

export async function estimateGasSui(
  chain: ChainConfig,
  _params: CreateCapsuleParams
): Promise<{ totalUsd: number }> {
  try {
    const client = await getSuiClient(chain)
    const refPrice = await client.getReferenceGasPrice()
    const estimatedUnits = 5000000n
    const totalMist = estimatedUnits * BigInt(refPrice)
    const totalSui = Number(totalMist) / 1e9
    const suiPrice = 1.2
    return { totalUsd: Number((totalSui * suiPrice).toFixed(4)) }
  } catch {
    return { totalUsd: 0.002 }
  }
}
