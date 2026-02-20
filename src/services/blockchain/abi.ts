export const CAPSULE_ABI = [
  // ── Write ──
  {
    name: 'createCapsule',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_type', type: 'uint8' },
      { name: '_recipient', type: 'address' },
      { name: '_contentCID', type: 'string' },
      { name: '_unlockTime', type: 'uint256' },
      { name: '_allowEarlyUnlock', type: 'bool' },
      {
        name: '_tokens', type: 'tuple[]',
        components: [
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ]
      },
      {
        name: '_nfts', type: 'tuple[]',
        components: [
          { name: 'collection', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'isERC1155', type: 'bool' },
          { name: 'amount', type: 'uint256' },
        ]
      },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'openCapsule',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_capsuleId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'earlyOpen',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_capsuleId', type: 'uint256' }],
    outputs: [],
  },

  // ── Read ──
  {
    name: 'getCapsule',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'creator', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'capsuleType', type: 'uint8' },
        { name: 'status', type: 'uint8' },
        { name: 'contentCID', type: 'string' },
        { name: 'sealTime', type: 'uint256' },
        { name: 'unlockTime', type: 'uint256' },
        { name: 'allowEarlyUnlock', type: 'bool' },
        { name: 'nativeAmount', type: 'uint256' },
        { name: 'tokenCount', type: 'uint256' },
        { name: 'nftCount', type: 'uint256' },
      ]
    }],
  },
  {
    name: 'getCapsuleTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple[]',
      components: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ]
    }],
  },
  {
    name: 'getCapsuleNfts',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple[]',
      components: [
        { name: 'collection', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'isERC1155', type: 'bool' },
        { name: 'amount', type: 'uint256' },
      ]
    }],
  },
  {
    name: 'getUserCapsules',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getReceivedCapsules',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    name: 'getCapsuleStatus',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'nextCapsuleId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },

  // ── Events ──
  {
    name: 'CapsuleCreated',
    type: 'event',
    inputs: [
      { name: 'capsuleId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'capsuleType', type: 'uint8', indexed: false },
      { name: 'unlockTime', type: 'uint256', indexed: false },
      { name: 'contentCID', type: 'string', indexed: false },
    ],
  },
  {
    name: 'CapsuleOpened',
    type: 'event',
    inputs: [
      { name: 'capsuleId', type: 'uint256', indexed: true },
      { name: 'opener', type: 'address', indexed: true },
    ],
  },
  {
    name: 'CapsuleEarlyOpened',
    type: 'event',
    inputs: [
      { name: 'capsuleId', type: 'uint256', indexed: true },
      { name: 'opener', type: 'address', indexed: true },
      { name: 'penalty', type: 'uint256', indexed: false },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const

export const ERC721_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getApproved',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export const ERC1155_ABI = [
  {
    name: 'setApprovalForAll',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
