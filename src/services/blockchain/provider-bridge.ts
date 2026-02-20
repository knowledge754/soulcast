/**
 * Provider Bridge — 桥接 useWallet 的已验证 provider 和区块链服务
 *
 * 解决 OKX 劫持 window.ethereum 的问题：
 * 当用户用 MetaMask 连接后，useWallet 拿到的是真正的 MetaMask provider，
 * 但 evm.ts 如果直接用 window.ethereum 就会被 OKX 截获。
 * 通过这个 bridge，evm.ts 使用已验证的 provider。
 */

type EIP1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
}

let _connectedProvider: EIP1193Provider | null = null

export function setConnectedProvider(provider: EIP1193Provider | null) {
  _connectedProvider = provider
}

export function getConnectedProvider(): EIP1193Provider | null {
  return _connectedProvider
}
