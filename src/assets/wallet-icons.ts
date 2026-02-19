/**
 * 钱包品牌图标 — SVG data URI
 * 使用各钱包官方品牌色 + 简化版标志性图形
 * EIP-6963 发现的钱包会优先使用扩展自带的官方图标
 */

function svg(content: string, bg: string): string {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" rx="16" fill="${bg}"/>${content}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(raw)}`
}

export const walletIcons: Record<string, string> = {
  /* MetaMask — 橙色狐狸几何头像 */
  metamask: svg(
    `<g fill="white" fill-opacity=".92">` +
    `<polygon points="56,18 40,28 44,18"/>` +
    `<polygon points="24,18 40,28 36,18"/>` +
    `<polygon points="40,28 52,38 48,50 40,46 32,50 28,38"/>` +
    `<polygon points="24,18 28,38 18,30"/>` +
    `<polygon points="56,18 52,38 62,30"/>` +
    `<polygon points="32,50 40,46 48,50 44,62 36,62" fill-opacity=".75"/>` +
    `</g>`,
    '#E2761B'
  ),

  /* TokenPocket — 蓝色 TP 盾牌 */
  tokenpocket: svg(
    `<text x="40" y="52" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="900" font-size="32" fill="white">TP</text>`,
    '#2980FE'
  ),

  /* OKX — 黑色方格（OKX 标志性六宫格） */
  okx: svg(
    `<rect x="18" y="18" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="34" y="18" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="50" y="18" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="18" y="34" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="50" y="34" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="18" y="50" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="34" y="50" width="12" height="12" rx="2" fill="white"/>` +
    `<rect x="50" y="50" width="12" height="12" rx="2" fill="white"/>`,
    '#000000'
  ),

  /* Binance — 金色菱形排列 */
  binance: svg(
    `<g fill="white">` +
    `<polygon points="40,14 46,20 40,26 34,20"/>` +
    `<polygon points="24,30 30,36 24,42 18,36"/>` +
    `<polygon points="56,30 62,36 56,42 50,36"/>` +
    `<polygon points="40,46 46,52 40,58 34,52"/>` +
    `<polygon points="40,30 46,36 40,42 34,36"/>` +
    `</g>`,
    '#F0B90B'
  ),

  /* Trust Wallet — 蓝色盾牌 + 对勾 */
  trust: svg(
    `<path d="M40,14 C30,14 22,20 22,20 L22,36 C22,50 40,64 40,64 C40,64 58,50 58,36 L58,20 C58,20 50,14 40,14Z" fill="none" stroke="white" stroke-width="3.5"/>` +
    `<polyline points="30,38 37,46 52,30" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    '#3375BB'
  ),

  /* imToken — 青色圆 + i 字母 */
  imtoken: svg(
    `<circle cx="40" cy="40" r="22" fill="none" stroke="white" stroke-width="3.5"/>` +
    `<circle cx="40" cy="28" r="3" fill="white"/>` +
    `<rect x="37" y="35" width="6" height="18" rx="3" fill="white"/>`,
    '#11C4D1'
  ),

  /* Coinbase — 蓝色圆 + C 内嵌方块 */
  coinbase: svg(
    `<circle cx="40" cy="40" r="24" fill="white"/>` +
    `<circle cx="40" cy="40" r="20" fill="#0052FF"/>` +
    `<rect x="32" y="34" width="16" height="12" rx="2" fill="white"/>`,
    '#0052FF'
  ),

  /* 火币/HTX — 绿色火焰 */
  huobi: svg(
    `<path d="M40,12 C36,20 28,26 28,38 A12,12 0 0 0 52,38 C52,26 44,20 40,12Z" fill="white" fill-opacity=".9"/>` +
    `<path d="M40,30 C38,34 34,36 34,42 A6,6 0 0 0 46,42 C46,36 42,34 40,30Z" fill="#2DAF68"/>`,
    '#2DAF68'
  ),

  /* OneKey — 深色 + 圆形指示灯 */
  onekey: svg(
    `<rect x="20" y="12" width="40" height="56" rx="10" fill="white" fill-opacity=".15" stroke="white" stroke-width="3"/>` +
    `<circle cx="40" cy="36" r="10" fill="none" stroke="white" stroke-width="3"/>` +
    `<circle cx="40" cy="56" r="4" fill="#44FF44"/>`,
    '#1A1A1A'
  ),

  /* Ledger — 深灰设备外形 */
  ledger: svg(
    `<rect x="14" y="22" width="52" height="36" rx="4" fill="none" stroke="white" stroke-width="3"/>` +
    `<path d="M14,42 L38,42 L38,58" fill="none" stroke="white" stroke-width="3"/>` +
    `<path d="M42,22 L42,36 L66,36" fill="none" stroke="white" stroke-width="3"/>`,
    '#333333'
  ),

  /* Trezor — 深绿锁型 */
  trezor: svg(
    `<path d="M28,34 L28,26 A12,12 0 0 1 52,26 L52,34" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round"/>` +
    `<rect x="22" y="34" width="36" height="30" rx="5" fill="none" stroke="white" stroke-width="3.5"/>` +
    `<circle cx="40" cy="48" r="5" fill="white"/>`,
    '#00854D'
  ),
}
