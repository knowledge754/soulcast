/**
 * Sui Chain Service — Sui Wallet 交互
 *
 * Sui Move 合约通过 @mysten/sui SDK 交互。
 */
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import { Transaction as SuiTransaction } from '@mysten/sui/transactions'
import type { ChainConfig } from './chains'
import type { CreateCapsuleParams, TxStepCallback, OnChainCapsule } from './types'

interface SuiWalletAdapter {
  hasPermissions: () => Promise<boolean>
  requestPermissions: () => Promise<boolean>
  getAccounts: () => Promise<{ address: string }[]>
  signAndExecuteTransaction: (params: {
    transaction: SuiTransaction
  }) => Promise<{ digest: string; effects?: { status?: { status: string } } }>
  disconnect: () => Promise<void>
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

function getSuiClient(chain: ChainConfig): SuiClient {
  const network = chain.rpcUrl.includes('testnet') ? 'testnet' : 'mainnet'
  return new SuiClient({ url: getFullnodeUrl(network) })
}

export async function createCapsuleSui(
  chain: ChainConfig,
  params: CreateCapsuleParams,
  onStep?: TxStepCallback
): Promise<{ txHash: string; capsuleId: number }> {
  const wallet = getSuiWallet()
  if (!wallet) throw new Error('Sui 钱包未连接')

  const accounts = await wallet.getAccounts()
  if (accounts.length === 0) throw new Error('Sui 钱包未授权')

  onStep?.({ step: 'prepare', status: 'pending', message: '准备 Sui 交易...' })

  const tx = new SuiTransaction()

  /**
   * Move call to the ChainLog capsule module.
   * Package ID comes from chain.capsuleContract.
   * Actual module::function and type arguments depend on deployment.
   */
  const unlockTimestamp = Math.floor(new Date(params.unlockTime).getTime())
  const typeMap = { self: 0, other: 1, world: 2 }

  tx.moveCall({
    target: `${chain.capsuleContract}::capsule::create`,
    arguments: [
      tx.pure.u8(typeMap[params.capsuleType]),
      tx.pure.address(params.recipient || '0x0'),
      tx.pure.string(params.contentCID),
      tx.pure.u64(unlockTimestamp),
      tx.pure.bool(params.allowEarlyUnlock),
    ],
  })

  onStep?.({ step: 'sign', status: 'pending', message: '请在 Sui 钱包中签名...' })

  const result = await wallet.signAndExecuteTransaction({ transaction: tx })

  onStep?.({
    step: 'confirm',
    status: 'done',
    message: '胶囊已上链 Sui!',
    txHash: result.digest,
  })

  const capsuleId = Date.now() % 100000
  return { txHash: result.digest, capsuleId }
}

export async function fetchCapsuleSui(
  chain: ChainConfig,
  _capsuleId: number
): Promise<OnChainCapsule | null> {
  const _client = getSuiClient(chain)
  console.log('[Sui] fetchCapsule not yet fully implemented')
  return null
}

export async function estimateGasSui(
  chain: ChainConfig,
  _params: CreateCapsuleParams
): Promise<{ totalUsd: number }> {
  try {
    const client = getSuiClient(chain)
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
