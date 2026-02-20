export interface TokenParam {
  symbol: string
  name: string
  address: string
  amount: string
  decimals: number
  usdPrice?: number
}

export interface NftParam {
  contractAddress: string
  tokenId: string
  name: string
  collection: string
  image: string
  standard: string
}

export interface CreateCapsuleParams {
  capsuleType: 'self' | 'other' | 'world'
  recipient: string
  contentCID: string
  unlockTime: string
  allowEarlyUnlock: boolean
  tokens: TokenParam[]
  nfts: NftParam[]
}

export interface TxStep {
  step: string
  status: 'pending' | 'confirming' | 'done' | 'error'
  message: string
  txHash?: string
  index?: number
}

export type TxStepCallback = (step: TxStep) => void

export interface OnChainCapsule {
  id: number
  creator: string
  recipient: string
  capsuleType: 'self' | 'other' | 'world'
  status: 'sealed' | 'ready' | 'opened' | 'early_opened'
  contentCID: string
  sealTime: number
  unlockTime: number
  allowEarlyUnlock: boolean
  nativeAmount: string
  tokens: { address: string; amount: string }[]
  nfts: { contractAddress: string; tokenId: string; isERC1155: boolean }[]
  chain: string
}

export interface SealResult {
  txHash: string
  capsuleId: number
  chain: string
  contentCID: string
  explorerUrl: string
}
