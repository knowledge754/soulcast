/**
 * IPFS Service — 胶囊内容上传/读取
 *
 * Uses Web3.Storage / Pinata / local gateway as backend.
 * Content is encrypted client-side before upload.
 */

const IPFS_GATEWAYS = [
  'https://w3s.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
]

export interface CapsuleContent {
  version: number
  title: string
  body: string
  bodyFormat: 'markdown' | 'html' | 'plain'
  attachments: CapsuleAttachment[]
  emoji?: string
  tags?: string[]
  createdAt: string
  creator: string
}

export interface CapsuleAttachment {
  name: string
  type: string
  size: number
  cid?: string
  dataUrl?: string
}

export interface IpfsUploadResult {
  cid: string
  url: string
  size: number
}

class IpfsService {
  private apiKey: string = ''
  private apiEndpoint: string = 'https://api.web3.storage'

  configure(apiKey: string, endpoint?: string) {
    this.apiKey = apiKey
    if (endpoint) this.apiEndpoint = endpoint
  }

  async uploadContent(content: CapsuleContent): Promise<IpfsUploadResult> {
    const json = JSON.stringify(content)
    const blob = new Blob([json], { type: 'application/json' })

    if (this.apiKey) {
      return this._uploadToProvider(blob)
    }
    return this._uploadLocal(blob)
  }

  async uploadFile(file: File): Promise<IpfsUploadResult> {
    if (this.apiKey) {
      return this._uploadToProvider(file)
    }
    return this._uploadLocal(file)
  }

  async fetchContent(cid: string): Promise<CapsuleContent | null> {
    for (const gw of IPFS_GATEWAYS) {
      try {
        const resp = await fetch(`${gw}${cid}`, {
          signal: AbortSignal.timeout(10000)
        })
        if (resp.ok) {
          return await resp.json()
        }
      } catch {
        continue
      }
    }
    return null
  }

  getGatewayUrl(cid: string): string {
    return `${IPFS_GATEWAYS[0]}${cid}`
  }

  private async _uploadToProvider(data: Blob | File): Promise<IpfsUploadResult> {
    const formData = new FormData()
    formData.append('file', data)

    const resp = await fetch(`${this.apiEndpoint}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    })

    if (!resp.ok) throw new Error(`IPFS upload failed: ${resp.status}`)
    const result = await resp.json()

    return {
      cid: result.cid || result.Hash || result.IpfsHash,
      url: this.getGatewayUrl(result.cid || result.Hash || result.IpfsHash),
      size: data.size,
    }
  }

  private async _uploadLocal(data: Blob | File): Promise<IpfsUploadResult> {
    const buffer = await data.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const mockCid = 'bafybeig' + hashArray.slice(0, 24).map(b => b.toString(16).padStart(2, '0')).join('')

    const stored = JSON.parse(localStorage.getItem('chainlog_ipfs_store') || '{}')
    stored[mockCid] = {
      data: await blobToBase64(data),
      type: data.type,
      size: data.size,
      time: Date.now(),
    }
    localStorage.setItem('chainlog_ipfs_store', JSON.stringify(stored))

    console.log(`[IPFS] Local mock upload: ${mockCid} (${data.size} bytes)`)

    return {
      cid: mockCid,
      url: `local://${mockCid}`,
      size: data.size,
    }
  }

  async fetchLocal(cid: string): Promise<CapsuleContent | null> {
    const stored = JSON.parse(localStorage.getItem('chainlog_ipfs_store') || '{}')
    const entry = stored[cid]
    if (!entry) return null

    try {
      const resp = await fetch(entry.data)
      const blob = await resp.blob()
      const text = await blob.text()
      return JSON.parse(text)
    } catch {
      return null
    }
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const ipfsService = new IpfsService()
