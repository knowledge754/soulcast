// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * ChainLog Time Capsule — 星封 (StarSealed)
 *
 * Locks text (IPFS CID), native tokens, ERC-20, ERC-721, and ERC-1155
 * into a time-locked capsule that can only be opened after `unlockTime`.
 *
 * Supports:
 *   - Self capsule  (creator == recipient)
 *   - Gift capsule  (creator != recipient)
 *   - World capsule (recipient = address(0), anyone can read after unlock)
 *   - Early unlock with penalty (configurable)
 */
contract ChainLogCapsule is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ────────────────────────────────────────────────
    enum CapsuleType { Self, Other, World }
    enum CapsuleStatus { Sealed, Ready, Opened, EarlyOpened }

    struct TokenLock {
        address token;   // address(0) = native
        uint256 amount;
    }

    struct NftLock {
        address collection;
        uint256 tokenId;
        bool isERC1155;
        uint256 amount; // 1 for ERC-721
    }

    struct Capsule {
        uint256 id;
        address creator;
        address recipient;
        CapsuleType capsuleType;
        CapsuleStatus status;
        string contentCID;    // IPFS CID of encrypted content
        uint256 sealTime;
        uint256 unlockTime;
        bool allowEarlyUnlock;
        uint256 nativeAmount;
        uint256 tokenCount;
        uint256 nftCount;
    }

    // ── Storage ──────────────────────────────────────────────
    uint256 public nextCapsuleId = 1;
    uint256 public earlyUnlockPenaltyBps = 1000; // 10%
    address public owner;
    address public treasury;

    mapping(uint256 => Capsule) public capsules;
    mapping(uint256 => TokenLock[]) public capsuleTokens;
    mapping(uint256 => NftLock[]) public capsuleNfts;
    mapping(address => uint256[]) public userCapsules;
    mapping(address => uint256[]) public receivedCapsules;

    // ── Events ───────────────────────────────────────────────
    event CapsuleCreated(
        uint256 indexed capsuleId,
        address indexed creator,
        address indexed recipient,
        CapsuleType capsuleType,
        uint256 unlockTime,
        string contentCID
    );
    event CapsuleOpened(uint256 indexed capsuleId, address indexed opener);
    event CapsuleEarlyOpened(uint256 indexed capsuleId, address indexed opener, uint256 penalty);
    event TokensWithdrawn(uint256 indexed capsuleId, address indexed to);
    event NftsWithdrawn(uint256 indexed capsuleId, address indexed to);

    // ── Modifiers ────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
    }

    // ── Core: Create Capsule ─────────────────────────────────
    function createCapsule(
        CapsuleType _type,
        address _recipient,
        string calldata _contentCID,
        uint256 _unlockTime,
        bool _allowEarlyUnlock,
        TokenLock[] calldata _tokens,
        NftLock[] calldata _nfts
    ) external payable nonReentrant returns (uint256) {
        require(_unlockTime > block.timestamp, "Unlock must be in future");
        require(bytes(_contentCID).length > 0, "Content CID required");

        if (_type == CapsuleType.Other) {
            require(_recipient != address(0) && _recipient != msg.sender, "Invalid recipient");
        } else if (_type == CapsuleType.Self) {
            _recipient = msg.sender;
        } else {
            _recipient = address(0); // World capsule
        }

        uint256 capsuleId = nextCapsuleId++;
        uint256 totalNative = 0;

        // Lock ERC-20 tokens
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (_tokens[i].token == address(0)) {
                totalNative += _tokens[i].amount;
            } else {
                IERC20(_tokens[i].token).safeTransferFrom(msg.sender, address(this), _tokens[i].amount);
            }
            capsuleTokens[capsuleId].push(_tokens[i]);
        }
        require(msg.value >= totalNative, "Insufficient native token");

        // Lock NFTs
        for (uint256 i = 0; i < _nfts.length; i++) {
            if (_nfts[i].isERC1155) {
                IERC1155(_nfts[i].collection).safeTransferFrom(
                    msg.sender, address(this), _nfts[i].tokenId, _nfts[i].amount, ""
                );
            } else {
                IERC721(_nfts[i].collection).transferFrom(msg.sender, address(this), _nfts[i].tokenId);
            }
            capsuleNfts[capsuleId].push(_nfts[i]);
        }

        capsules[capsuleId] = Capsule({
            id: capsuleId,
            creator: msg.sender,
            recipient: _recipient,
            capsuleType: _type,
            status: CapsuleStatus.Sealed,
            contentCID: _contentCID,
            sealTime: block.timestamp,
            unlockTime: _unlockTime,
            allowEarlyUnlock: _allowEarlyUnlock,
            nativeAmount: totalNative,
            tokenCount: uint256(_tokens.length),
            nftCount: uint256(_nfts.length)
        });

        userCapsules[msg.sender].push(capsuleId);
        if (_recipient != address(0) && _recipient != msg.sender) {
            receivedCapsules[_recipient].push(capsuleId);
        }

        emit CapsuleCreated(capsuleId, msg.sender, _recipient, _type, _unlockTime, _contentCID);
        return capsuleId;
    }

    // ── Core: Open Capsule ───────────────────────────────────
    function openCapsule(uint256 _capsuleId) external nonReentrant {
        Capsule storage cap = capsules[_capsuleId];
        require(cap.id != 0, "Capsule not found");
        require(cap.status == CapsuleStatus.Sealed, "Already opened");
        require(block.timestamp >= cap.unlockTime, "Not yet unlockable");

        address opener = _resolveOpener(cap);
        require(msg.sender == opener, "Not authorized");

        cap.status = CapsuleStatus.Opened;
        _releaseAssets(_capsuleId, opener);

        emit CapsuleOpened(_capsuleId, opener);
    }

    function earlyOpen(uint256 _capsuleId) external nonReentrant {
        Capsule storage cap = capsules[_capsuleId];
        require(cap.id != 0, "Capsule not found");
        require(cap.status == CapsuleStatus.Sealed, "Already opened");
        require(cap.allowEarlyUnlock, "Early unlock not allowed");
        require(block.timestamp < cap.unlockTime, "Already unlockable, use openCapsule");

        address opener = _resolveOpener(cap);
        require(msg.sender == opener, "Not authorized");

        cap.status = CapsuleStatus.EarlyOpened;
        uint256 penalty = _applyPenalty(_capsuleId);
        _releaseAssets(_capsuleId, opener);

        emit CapsuleEarlyOpened(_capsuleId, opener, penalty);
    }

    // ── View ─────────────────────────────────────────────────
    function getCapsule(uint256 _id) external view returns (Capsule memory) {
        return capsules[_id];
    }

    function getCapsuleTokens(uint256 _id) external view returns (TokenLock[] memory) {
        return capsuleTokens[_id];
    }

    function getCapsuleNfts(uint256 _id) external view returns (NftLock[] memory) {
        return capsuleNfts[_id];
    }

    function getUserCapsules(address _user) external view returns (uint256[] memory) {
        return userCapsules[_user];
    }

    function getReceivedCapsules(address _user) external view returns (uint256[] memory) {
        return receivedCapsules[_user];
    }

    function getCapsuleStatus(uint256 _id) external view returns (CapsuleStatus) {
        Capsule memory cap = capsules[_id];
        if (cap.status == CapsuleStatus.Sealed && block.timestamp >= cap.unlockTime) {
            return CapsuleStatus.Ready;
        }
        return cap.status;
    }

    // ── Internal ─────────────────────────────────────────────
    function _resolveOpener(Capsule memory cap) internal view returns (address) {
        if (cap.capsuleType == CapsuleType.World) return msg.sender;
        if (cap.capsuleType == CapsuleType.Other) return cap.recipient;
        return cap.creator;
    }

    function _releaseAssets(uint256 _capsuleId, address _to) internal {
        TokenLock[] storage tokens = capsuleTokens[_capsuleId];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].token == address(0)) {
                (bool ok, ) = _to.call{value: tokens[i].amount}("");
                require(ok, "Native transfer failed");
            } else {
                IERC20(tokens[i].token).safeTransfer(_to, tokens[i].amount);
            }
        }
        emit TokensWithdrawn(_capsuleId, _to);

        NftLock[] storage nfts = capsuleNfts[_capsuleId];
        for (uint256 i = 0; i < nfts.length; i++) {
            if (nfts[i].isERC1155) {
                IERC1155(nfts[i].collection).safeTransferFrom(
                    address(this), _to, nfts[i].tokenId, nfts[i].amount, ""
                );
            } else {
                IERC721(nfts[i].collection).transferFrom(address(this), _to, nfts[i].tokenId);
            }
        }
        emit NftsWithdrawn(_capsuleId, _to);
    }

    function _applyPenalty(uint256 _capsuleId) internal returns (uint256 totalPenalty) {
        TokenLock[] storage tokens = capsuleTokens[_capsuleId];
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 penalty = (tokens[i].amount * earlyUnlockPenaltyBps) / 10000;
            tokens[i].amount -= penalty;
            if (tokens[i].token == address(0)) {
                (bool ok, ) = treasury.call{value: penalty}("");
                require(ok, "Penalty transfer failed");
            } else {
                IERC20(tokens[i].token).safeTransfer(treasury, penalty);
            }
            totalPenalty += penalty;
        }
    }

    // ── Admin ────────────────────────────────────────────────
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setPenaltyBps(uint256 _bps) external onlyOwner {
        require(_bps <= 5000, "Max 50%");
        earlyUnlockPenaltyBps = _bps;
    }

    function transferOwnership(address _new) external onlyOwner {
        owner = _new;
    }

    // ERC-721/1155 receiver
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    receive() external payable {}
}
