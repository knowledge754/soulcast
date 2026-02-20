/**
 * Blockchain Service — 统一入口
 * 自动根据链类型 (EVM / Solana / Sui) 调用对应的服务
 */
export * from './types'
export * from './chains'

import { CHAINS, type ChainConfig } from './chains'
import type { CreateCapsuleParams, TxStepCallback, OnChainCapsule, SealResult } from './types'
import { ipfsService, type CapsuleContent } from '../ipfs'

import * as evm from './evm'
import * as solana from './solana'
import * as sui from './sui'

export interface FullCreateParams {
  chain: string
  capsuleType: 'self' | 'other' | 'world'
  recipient: string
  title: string
  body: string
  bodyFormat: 'markdown' | 'html' | 'plain'
  attachments: { name: string; type: string; size: number; dataUrl?: string }[]
  emoji?: string
  tags?: string[]
  unlockTime: string
  allowEarlyUnlock: boolean
  tokens: CreateCapsuleParams['tokens']
  nfts: CreateCapsuleParams['nfts']
  creator: string
}

export async function fullCreateCapsule(
  params: FullCreateParams,
  onStep?: TxStepCallback
): Promise<SealResult> {
  const chain = CHAINS[params.chain]
  if (!chain) throw new Error(`Unknown chain: ${params.chain}`)

  // Step 1: Upload content to IPFS
  onStep?.({ step: 'ipfs_upload', status: 'pending', message: '上传内容到 IPFS...' })

  const content: CapsuleContent = {
    version: 1,
    title: params.title,
    body: params.body,
    bodyFormat: params.bodyFormat,
    attachments: params.attachments.map(a => ({
      name: a.name, type: a.type, size: a.size, dataUrl: a.dataUrl,
    })),
    emoji: params.emoji,
    tags: params.tags,
    createdAt: new Date().toISOString(),
    creator: params.creator,
  }

  const ipfsResult = await ipfsService.uploadContent(content)
  onStep?.({ step: 'ipfs_upload', status: 'done', message: `内容已上传 (CID: ${ipfsResult.cid.slice(0, 12)}...)` })

  // Step 2: Create on-chain capsule based on chain type
  const contractParams: CreateCapsuleParams = {
    capsuleType: params.capsuleType,
    recipient: params.recipient,
    contentCID: ipfsResult.cid,
    unlockTime: params.unlockTime,
    allowEarlyUnlock: params.allowEarlyUnlock,
    tokens: params.tokens,
    nfts: params.nfts,
  }

  let result: { txHash: string; capsuleId: number }

  switch (chain.type) {
    case 'evm':
      result = await evm.createCapsule(chain, contractParams, onStep)
      break
    case 'solana':
      result = await solana.createCapsuleSolana(chain, contractParams, onStep)
      break
    case 'sui':
      result = await sui.createCapsuleSui(chain, contractParams, onStep)
      break
    default:
      throw new Error(`Unsupported chain type: ${chain.type}`)
  }

  return {
    txHash: result.txHash,
    capsuleId: result.capsuleId,
    chain: chain.key,
    contentCID: ipfsResult.cid,
    explorerUrl: `${chain.explorerUrl}/tx/${result.txHash}`,
  }
}

export async function openCapsuleOnChain(
  chainKey: string,
  capsuleId: number,
  onStep?: TxStepCallback
): Promise<string> {
  const chain = CHAINS[chainKey]
  if (!chain) throw new Error(`Unknown chain: ${chainKey}`)

  switch (chain.type) {
    case 'evm':
      return evm.openCapsule(chain, capsuleId, onStep)
    case 'solana':
      throw new Error('Solana 开启功能开发中')
    case 'sui':
      throw new Error('Sui 开启功能开发中')
    default:
      throw new Error(`Unsupported chain type`)
  }
}

export async function earlyOpenCapsuleOnChain(
  chainKey: string,
  capsuleId: number,
  onStep?: TxStepCallback
): Promise<string> {
  const chain = CHAINS[chainKey]
  if (!chain) throw new Error(`Unknown chain: ${chainKey}`)

  switch (chain.type) {
    case 'evm':
      return evm.earlyOpenCapsule(chain, capsuleId, onStep)
    default:
      throw new Error('提前解封仅支持 EVM 链')
  }
}

export async function fetchCapsuleFromChain(
  chainKey: string,
  capsuleId: number
): Promise<OnChainCapsule | null> {
  const chain = CHAINS[chainKey]
  if (!chain) return null

  switch (chain.type) {
    case 'evm':
      return evm.fetchCapsule(chain, capsuleId)
    case 'solana':
      return solana.fetchCapsuleSolana(chain, capsuleId)
    case 'sui':
      return sui.fetchCapsuleSui(chain, capsuleId)
    default:
      return null
  }
}

export async function estimateGasForChain(
  chainKey: string,
  params: CreateCapsuleParams
): Promise<{ totalUsd: number; breakdown?: Record<string, number> }> {
  const chain = CHAINS[chainKey]
  if (!chain) return { totalUsd: 0 }

  switch (chain.type) {
    case 'evm': {
      const est = await evm.estimateGas(chain, params)
      return {
        totalUsd: est.totalUsd,
        breakdown: {
          contract: est.totalUsd * 0.6,
          ipfs: 0.01,
          tokenApproval: params.tokens.length * est.totalUsd * 0.15,
          nftApproval: params.nfts.length * est.totalUsd * 0.1,
        },
      }
    }
    case 'solana':
      return solana.estimateGasSolana(chain, params)
    case 'sui':
      return sui.estimateGasSui(chain, params)
    default:
      return { totalUsd: 0 }
  }
}

export function getExplorerTxUrl(chainKey: string, txHash: string): string {
  const chain = CHAINS[chainKey]
  if (!chain) return '#'
  if (chain.type === 'solana') return `${chain.explorerUrl}/tx/${txHash}`
  if (chain.type === 'sui') return `${chain.explorerUrl}/txblock/${txHash}`
  return `${chain.explorerUrl}/tx/${txHash}`
}

export function getExplorerAddressUrl(chainKey: string, address: string): string {
  const chain = CHAINS[chainKey]
  if (!chain) return '#'
  if (chain.type === 'solana') return `${chain.explorerUrl}/account/${address}`
  if (chain.type === 'sui') return `${chain.explorerUrl}/account/${address}`
  return `${chain.explorerUrl}/address/${address}`
}
