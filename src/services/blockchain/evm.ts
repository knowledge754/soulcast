/**
 * EVM Chain Service — 处理所有 EVM 兼容链的合约交互
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

function getRawProvider() {
  return getConnectedProvider() || (window as Record<string, unknown>).ethereum as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  } | null
}

function getBrowserProvider(): ethers.BrowserProvider | null {
  const raw = getRawProvider()
  if (!raw) return null
  return new ethers.BrowserProvider(raw as ethers.Eip1193Provider)
}

function getLocalhostSigner(): ethers.JsonRpcSigner | null {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
    return new ethers.JsonRpcSigner(provider, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  } catch {
    return null
  }
}

async function getSigner(chain?: ChainConfig): Promise<ethers.Signer> {
  if (chain?.key === 'localhost') {
    const localhostSigner = getLocalhostSigner()
    if (localhostSigner) return localhostSigner
    throw new Error('Hardhat 本地节点未运行。请先执行: npx hardhat node')
  }
  const bp = getBrowserProvider()
  if (!bp) throw new Error('未连接钱包')
  return bp.getSigner()
}

function getCapsuleContract(chain: ChainConfig, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(getContractAddress(chain), CAPSULE_ABI, signerOrProvider)
}

async function hasContractCode(provider: ethers.Provider, address: string): Promise<boolean> {
  try {
    const code = await provider.getCode(address)
    return code !== '0x' && code !== '0x0' && code.length > 2
  } catch {
    return false
  }
}

export async function switchToChain(chain: ChainConfig): Promise<void> {
  if (!chain.chainId) return
  const provider = getRawProvider()
  if (!provider) throw new Error('未找到钱包 Provider')

  const targetHex = '0x' + chain.chainId.toString(16)

  const getCurrentChainId = async () => {
    const res = await provider.request({ method: 'eth_chainId' })
    return (res as string).toLowerCase()
  }

  const currentChain = await getCurrentChainId()
  if (currentChain === targetHex.toLowerCase()) return

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetHex }],
    })
  } catch (err: unknown) {
    const e = err as { code?: number }
    if (e.code === 4902 || e.code === -32603) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: targetHex,
            chainName: chain.name,
            rpcUrls: [getRpcUrl(chain)],
            nativeCurrency: chain.nativeCurrency,
            blockExplorerUrls: chain.explorerUrl ? [chain.explorerUrl] : undefined,
          }],
        })
      } catch (addErr: unknown) {
        const ae = addErr as { code?: number; message?: string }
        if (ae.code === 4001) {
          throw new Error(`你拒绝了添加 ${chain.name} 网络的请求。请在 MetaMask 中手动添加该网络后重试。`)
        }
        throw new Error(`无法添加 ${chain.name} 网络: ${ae.message || '未知错误'}`)
      }
    } else if (e.code === 4001) {
      throw new Error(`你拒绝了切换到 ${chain.name} 网络。请手动切换后重试。`)
    } else {
      throw new Error(`切换到 ${chain.name} 失败: ${(err as { message?: string }).message || '未知错误'}`)
    }
  }

  await new Promise(r => setTimeout(r, 500))

  const afterChain = await getCurrentChainId()
  if (afterChain !== targetHex.toLowerCase()) {
    throw new Error(
      `MetaMask 当前网络 (${afterChain}) 与目标 ${chain.name} (${targetHex}) 不匹配。` +
      `请在 MetaMask 中手动切换到 ${chain.name} 后重试。`
    )
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
    baseGas += BigInt(params.tokens.length) * 60000n
    baseGas += BigInt(params.nfts.length) * 80000n
    if (params.tokens.length > 0) baseGas += 50000n
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
  const contractAddr = getContractAddress(chain)
  if (!contractAddr || contractAddr === ethers.ZeroAddress) {
    throw new Error(`${chain.name} 上的时光胶囊合约尚未部署。请切换到已部署合约的链（如 Localhost）。`)
  }

  // Step 1: Switch chain (skip for localhost — uses direct RPC)
  if (chain.key === 'localhost') {
    onStep?.({ step: 'switch_chain', status: 'done', message: '使用 Hardhat 本地节点（直连）' })
  } else {
    onStep?.({ step: 'switch_chain', status: 'pending', message: `切换到 ${chain.name}...` })
    await switchToChain(chain)
    onStep?.({ step: 'switch_chain', status: 'done', message: `已切换到 ${chain.name}` })
  }

  const signer = await getSigner(chain)
  const contract = getCapsuleContract(chain, signer)
  const userAddr = await signer.getAddress()
  const ethProvider = signer.provider! as ethers.Provider

  // Verify capsule contract actually exists
  const capsuleExists = await hasContractCode(ethProvider, contractAddr)
  if (!capsuleExists) {
    throw new Error(
      `在 ${chain.name} 的地址 ${contractAddr.slice(0, 10)}... 没有找到合约。` +
      (chain.key === 'localhost' ? ' 请确认 Hardhat 节点正在运行，且合约已部署。' : ' 请先部署合约。')
    )
  }

  // Helper: normalize address checksum
  const safe = (addr: string) => ethers.getAddress(addr.toLowerCase())

  // Step 2: Process tokens — separate native from ERC-20, check contracts exist
  let nativeTotal = 0n
  const realTokens: typeof params.tokens = []

  for (let i = 0; i < params.tokens.length; i++) {
    const tk = params.tokens[i]
    if (tk.address === 'native' || tk.address === ethers.ZeroAddress) {
      nativeTotal += ethers.parseUnits(tk.amount, tk.decimals)
      realTokens.push(tk)
      continue
    }

    const addr = safe(tk.address)
    const tokenHasCode = await hasContractCode(ethProvider, addr)
    if (!tokenHasCode) {
      onStep?.({ step: 'approve_token', status: 'done', message: `${tk.symbol} 仅记录到 IPFS（链上无合约）`, index: i })
      continue
    }

    onStep?.({ step: 'approve_token', status: 'pending', message: `授权 ${tk.symbol}... (${i + 1}/${params.tokens.length})`, index: i })

    const erc20 = new ethers.Contract(addr, ERC20_ABI, signer)
    const amount = ethers.parseUnits(tk.amount, tk.decimals)
    const allowance: bigint = await erc20.allowance(userAddr, contractAddr)

    if (allowance < amount) {
      const approveTx = await erc20.approve(contractAddr, amount)
      await approveTx.wait()
    }

    realTokens.push({ ...tk, address: addr })
    onStep?.({ step: 'approve_token', status: 'done', message: `${tk.symbol} 已授权`, index: i })
  }

  // Step 3: Process NFTs — check contracts exist
  const realNfts: typeof params.nfts = []

  for (let i = 0; i < params.nfts.length; i++) {
    const nft = params.nfts[i]
    const addr = safe(nft.contractAddress)
    const nftHasCode = await hasContractCode(ethProvider, addr)

    if (!nftHasCode) {
      onStep?.({ step: 'approve_nft', status: 'done', message: `NFT ${nft.name} 仅记录到 IPFS（链上无合约）`, index: i })
      continue
    }

    onStep?.({ step: 'approve_nft', status: 'pending', message: `授权 NFT ${nft.name}... (${i + 1}/${params.nfts.length})`, index: i })

    if (nft.standard === 'ERC-1155' || nft.standard === 'BEP-1155') {
      const erc1155 = new ethers.Contract(addr, ERC1155_ABI, signer)
      const approved: boolean = await erc1155.isApprovedForAll(userAddr, contractAddr)
      if (!approved) {
        const tx = await erc1155.setApprovalForAll(contractAddr, true)
        await tx.wait()
      }
    } else {
      const erc721 = new ethers.Contract(addr, ERC721_ABI, signer)
      const approved: boolean = await erc721.isApprovedForAll(userAddr, contractAddr)
      if (!approved) {
        const tx = await erc721.setApprovalForAll(contractAddr, true)
        await tx.wait()
      }
    }

    realNfts.push({ ...nft, contractAddress: addr })
    onStep?.({ step: 'approve_nft', status: 'done', message: `NFT ${nft.name} 已授权`, index: i })
  }

  // Step 4: Create capsule on-chain (only with real tokens/NFTs that exist on-chain)
  onStep?.({ step: 'create_capsule', status: 'pending', message: '创建胶囊合约交易...' })

  const capsuleTypeMap = { self: 0, other: 1, world: 2 } as const
  const tokenLocks = realTokens.map(tk => ({
    token: (tk.address === 'native') ? ethers.ZeroAddress : safe(tk.address),
    amount: ethers.parseUnits(tk.amount, tk.decimals),
  }))
  const nftLocks = realNfts.map(nft => ({
    collection: safe(nft.contractAddress),
    tokenId: BigInt(nft.tokenId),
    isERC1155: nft.standard === 'ERC-1155' || nft.standard === 'BEP-1155',
    amount: 1n,
  }))

  const tx = await contract.createCapsule(
    capsuleTypeMap[params.capsuleType],
    params.recipient ? ethers.getAddress(params.recipient.toLowerCase()) : ethers.ZeroAddress,
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

  onStep?.({ step: 'create_capsule', status: 'done', message: `胶囊 #${capsuleId} 已上链!`, txHash: tx.hash })

  return { txHash: tx.hash, capsuleId }
}

export async function openCapsule(
  chain: ChainConfig,
  capsuleId: number,
  onStep?: TxStepCallback
): Promise<string> {
  if (chain.key !== 'localhost') {
    onStep?.({ step: 'switch_chain', status: 'pending', message: `切换到 ${chain.name}...` })
    await switchToChain(chain)
    onStep?.({ step: 'switch_chain', status: 'done', message: `已切换到 ${chain.name}` })
  }

  const signer = await getSigner(chain)
  const contract = getCapsuleContract(chain, signer)

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
  if (chain.key !== 'localhost') await switchToChain(chain)

  const signer = await getSigner(chain)
  const contract = getCapsuleContract(chain, signer)

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
