/**
 * EVM Chain Service — 处理所有 EVM 兼容链的合约交互
 * BSC, Ethereum, Base, Avalanche, Chainlink(Ethereum)
 */
import { ethers } from 'ethers'
import { CAPSULE_ABI, ERC20_ABI, ERC721_ABI, ERC1155_ABI } from './abi'
import type { ChainConfig } from './chains'
import { getRpcUrl, getContractAddress } from './chains'
import type { CreateCapsuleParams, OnChainCapsule, TxStepCallback } from './types'
import { getConnectedProvider } from './provider-bridge'

function getProvider(chain: ChainConfig): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getRpcUrl(chain))
}

function getBrowserProvider(): ethers.BrowserProvider | null {
  const verified = getConnectedProvider()
  if (verified) {
    return new ethers.BrowserProvider(verified as ethers.Eip1193Provider)
  }
  if (typeof window === 'undefined' || !window.ethereum) return null
  return new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider)
}

async function getSigner(): Promise<ethers.JsonRpcSigner> {
  const bp = getBrowserProvider()
  if (!bp) throw new Error('No wallet connected')
  return bp.getSigner()
}

function getCapsuleContract(chain: ChainConfig, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(getContractAddress(chain), CAPSULE_ABI, signerOrProvider)
}

export async function switchToChain(chain: ChainConfig): Promise<void> {
  if (!chain.chainId) return
  const provider = getConnectedProvider() || window.ethereum
  if (!provider) return

  const chainIdHex = '0x' + chain.chainId.toString(16)

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (err: unknown) {
    const e = err as { code?: number }
    if (e.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: chainIdHex,
          chainName: chain.name,
          rpcUrls: [getRpcUrl(chain)],
          nativeCurrency: chain.nativeCurrency,
          blockExplorerUrls: [chain.explorerUrl],
        }],
      })
    } else {
      throw err
    }
  }
}

export async function estimateGas(
  chain: ChainConfig,
  params: CreateCapsuleParams
): Promise<{ gasLimit: bigint; gasPrice: bigint; totalWei: bigint; totalUsd: number }> {
  const provider = getProvider(chain)

  try {
    const feeData = await provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? ethers.parseUnits('5', 'gwei')

    let baseGas = 200000n
    baseGas += BigInt(params.tokens.length) * 60000n  // each token approval + lock
    baseGas += BigInt(params.nfts.length) * 80000n    // each NFT approval + lock
    if (params.tokens.length > 0) baseGas += 50000n   // native token handling
    baseGas += BigInt(Math.ceil(params.contentCID.length / 32)) * 2000n

    const totalWei = baseGas * gasPrice
    const totalEth = Number(ethers.formatEther(totalWei))
    const nativePrice = await _getNativePrice(chain.symbol)
    const totalUsd = totalEth * nativePrice

    return { gasLimit: baseGas, gasPrice, totalWei, totalUsd }
  } catch {
    return {
      gasLimit: 300000n,
      gasPrice: ethers.parseUnits('5', 'gwei'),
      totalWei: ethers.parseUnits('0.0015', 'ether'),
      totalUsd: 0.5,
    }
  }
}

export async function createCapsule(
  chain: ChainConfig,
  params: CreateCapsuleParams,
  onStep?: TxStepCallback
): Promise<{ txHash: string; capsuleId: number }> {
  const signer = await getSigner()
  const contract = getCapsuleContract(chain, signer)
  const userAddr = await signer.getAddress()

  // Step 1: Switch chain
  onStep?.({ step: 'switch_chain', status: 'pending', message: `切换到 ${chain.name}...` })
  await switchToChain(chain)
  onStep?.({ step: 'switch_chain', status: 'done', message: `已切换到 ${chain.name}` })

  // Step 2: Approve ERC-20 tokens
  let nativeTotal = 0n
  for (let i = 0; i < params.tokens.length; i++) {
    const tk = params.tokens[i]
    if (tk.address === 'native' || tk.address === ethers.ZeroAddress) {
      nativeTotal += ethers.parseUnits(tk.amount, tk.decimals)
      continue
    }

    onStep?.({
      step: 'approve_token',
      status: 'pending',
      message: `授权 ${tk.symbol}... (${i + 1}/${params.tokens.length})`,
      index: i,
    })

    const erc20 = new ethers.Contract(tk.address, ERC20_ABI, signer)
    const amount = ethers.parseUnits(tk.amount, tk.decimals)
    const allowance: bigint = await erc20.allowance(userAddr, getContractAddress(chain))

    if (allowance < amount) {
      const approveTx = await erc20.approve(getContractAddress(chain), amount)
      await approveTx.wait()
    }

    onStep?.({
      step: 'approve_token',
      status: 'done',
      message: `${tk.symbol} 已授权`,
      index: i,
    })
  }

  // Step 3: Approve NFTs
  for (let i = 0; i < params.nfts.length; i++) {
    const nft = params.nfts[i]
    onStep?.({
      step: 'approve_nft',
      status: 'pending',
      message: `授权 NFT ${nft.name}... (${i + 1}/${params.nfts.length})`,
      index: i,
    })

    if (nft.standard === 'ERC-1155' || nft.standard === 'BEP-1155') {
      const erc1155 = new ethers.Contract(nft.contractAddress, ERC1155_ABI, signer)
      const approved: boolean = await erc1155.isApprovedForAll(userAddr, getContractAddress(chain))
      if (!approved) {
        const tx = await erc1155.setApprovalForAll(getContractAddress(chain), true)
        await tx.wait()
      }
    } else {
      const erc721 = new ethers.Contract(nft.contractAddress, ERC721_ABI, signer)
      const approved: boolean = await erc721.isApprovedForAll(userAddr, getContractAddress(chain))
      if (!approved) {
        const tx = await erc721.setApprovalForAll(getContractAddress(chain), true)
        await tx.wait()
      }
    }

    onStep?.({
      step: 'approve_nft',
      status: 'done',
      message: `NFT ${nft.name} 已授权`,
      index: i,
    })
  }

  // Step 4: Create capsule on-chain
  onStep?.({ step: 'create_capsule', status: 'pending', message: '创建胶囊合约交易...' })

  const capsuleTypeMap = { self: 0, other: 1, world: 2 } as const
  const tokenLocks = params.tokens.map(tk => ({
    token: (tk.address === 'native') ? ethers.ZeroAddress : tk.address,
    amount: ethers.parseUnits(tk.amount, tk.decimals),
  }))
  const nftLocks = params.nfts.map(nft => ({
    collection: nft.contractAddress,
    tokenId: BigInt(nft.tokenId),
    isERC1155: nft.standard === 'ERC-1155' || nft.standard === 'BEP-1155',
    amount: 1n,
  }))

  const tx = await contract.createCapsule(
    capsuleTypeMap[params.capsuleType],
    params.recipient || ethers.ZeroAddress,
    params.contentCID,
    BigInt(Math.floor(new Date(params.unlockTime).getTime() / 1000)),
    params.allowEarlyUnlock,
    tokenLocks,
    nftLocks,
    { value: nativeTotal }
  )

  onStep?.({ step: 'create_capsule', status: 'confirming', message: '等待链上确认...', txHash: tx.hash })

  const receipt = await tx.wait()
  const capsuleCreatedEvent = receipt?.logs.find((log: ethers.Log) => {
    try {
      const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data })
      return parsed?.name === 'CapsuleCreated'
    } catch { return false }
  })

  let capsuleId = 0
  if (capsuleCreatedEvent) {
    const parsed = contract.interface.parseLog({
      topics: [...capsuleCreatedEvent.topics],
      data: capsuleCreatedEvent.data,
    })
    capsuleId = Number(parsed?.args[0] ?? 0)
  }

  onStep?.({
    step: 'create_capsule',
    status: 'done',
    message: `胶囊 #${capsuleId} 已上链!`,
    txHash: tx.hash,
  })

  return { txHash: tx.hash, capsuleId }
}

export async function openCapsule(
  chain: ChainConfig,
  capsuleId: number,
  onStep?: TxStepCallback
): Promise<string> {
  const signer = await getSigner()
  const contract = getCapsuleContract(chain, signer)

  onStep?.({ step: 'switch_chain', status: 'pending', message: `切换到 ${chain.name}...` })
  await switchToChain(chain)
  onStep?.({ step: 'switch_chain', status: 'done', message: `已切换到 ${chain.name}` })

  onStep?.({ step: 'open_capsule', status: 'pending', message: '发送解封交易...' })
  const tx = await contract.openCapsule(capsuleId)
  onStep?.({ step: 'open_capsule', status: 'confirming', message: '等待确认...', txHash: tx.hash })

  await tx.wait()
  onStep?.({ step: 'open_capsule', status: 'done', message: '胶囊已解封!', txHash: tx.hash })

  return tx.hash
}

export async function earlyOpenCapsule(
  chain: ChainConfig,
  capsuleId: number,
  onStep?: TxStepCallback
): Promise<string> {
  const signer = await getSigner()
  const contract = getCapsuleContract(chain, signer)

  await switchToChain(chain)

  onStep?.({ step: 'early_open', status: 'pending', message: '发送提前解封交易 (10% 惩罚)...' })
  const tx = await contract.earlyOpen(capsuleId)
  onStep?.({ step: 'early_open', status: 'confirming', message: '等待确认...', txHash: tx.hash })

  await tx.wait()
  onStep?.({ step: 'early_open', status: 'done', message: '胶囊已提前解封', txHash: tx.hash })

  return tx.hash
}

export async function fetchCapsule(chain: ChainConfig, capsuleId: number): Promise<OnChainCapsule | null> {
  const provider = getProvider(chain)
  const contract = getCapsuleContract(chain, provider)

  try {
    const raw = await contract.getCapsule(capsuleId)
    const tokens = await contract.getCapsuleTokens(capsuleId)
    const nfts = await contract.getCapsuleNfts(capsuleId)

    return {
      id: Number(raw.id),
      creator: raw.creator,
      recipient: raw.recipient,
      capsuleType: (['self', 'other', 'world'] as const)[Number(raw.capsuleType)],
      status: (['sealed', 'ready', 'opened', 'early_opened'] as const)[Number(raw.status)],
      contentCID: raw.contentCID,
      sealTime: Number(raw.sealTime) * 1000,
      unlockTime: Number(raw.unlockTime) * 1000,
      allowEarlyUnlock: raw.allowEarlyUnlock,
      nativeAmount: ethers.formatEther(raw.nativeAmount),
      tokens: tokens.map((t: { token: string; amount: bigint }) => ({
        address: t.token,
        amount: ethers.formatEther(t.amount),
      })),
      nfts: nfts.map((n: { collection: string; tokenId: bigint; isERC1155: boolean }) => ({
        contractAddress: n.collection,
        tokenId: n.tokenId.toString(),
        isERC1155: n.isERC1155,
      })),
      chain: chain.key,
    }
  } catch {
    return null
  }
}

export async function fetchUserCapsuleIds(chain: ChainConfig, userAddress: string): Promise<number[]> {
  const provider = getProvider(chain)
  const contract = getCapsuleContract(chain, provider)

  try {
    const ids: bigint[] = await contract.getUserCapsules(userAddress)
    return ids.map(id => Number(id))
  } catch {
    return []
  }
}

async function _getNativePrice(symbol: string): Promise<number> {
  const prices: Record<string, number> = {
    BNB: 312, ETH: 2800, AVAX: 28, SOL: 145, SUI: 1.2, LINK: 15,
  }
  return prices[symbol] || 100
}
