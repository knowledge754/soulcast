<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '../components/icons/Icon.vue'

const activeChatIdx = ref(0)

const chatList = ref([
  {
    name: 'Vitalik',
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)',
    preview: '你那篇 DeFi 文章写得...',
    time: '14:32',
    badge: 2
  },
  {
    name: 'NightCoder',
    avatar: 'linear-gradient(135deg, #68d391, #4fd1c5)',
    preview: '有空合作一个项目吗？',
    time: '昨天',
    badge: 0
  },
  {
    name: 'SoulWriter',
    avatar: 'linear-gradient(135deg, #76e4f7, #b794f4)',
    preview: '谢谢你转发了我的文章',
    time: '3天前',
    badge: 0
  }
])

const activeChat = computed(() => chatList.value[activeChatIdx.value])

const messages = [
  {
    isMe: false,
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)',
    text: '你那篇「漫游在 DeFi 的星河里」写得太好了，我转发给了好几个朋友',
    time: '14:28',
    chain: '链上可验证'
  },
  {
    isMe: true,
    avatar: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
    text: '谢谢！那是我花了三个晚上写的，你能看到真的太开心了 🥹',
    time: '14:30',
    chain: '已签名'
  },
  {
    isMe: false,
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)',
    text: '有没有兴趣在 Devcon 做个分享？我来帮你安排 😊',
    time: '14:32',
    chain: '链上可验证'
  }
]

function selectChat(idx: number) {
  activeChatIdx.value = idx
  if (chatList.value[idx]?.badge) {
    chatList.value[idx].badge = 0
  }
}
</script>

<template>
  <div class="chat-page">
    <!-- Section Header -->
    <div class="section-header">
      <div class="section-title">
        <span class="section-dot green"></span>
        链上私信
      </div>
    </div>

    <!-- Chat Layout -->
    <div class="chat-layout">
      <!-- Chat List -->
      <div class="chat-list">
        <div class="chat-list-header">消息</div>
        <div
          v-for="(chat, idx) in chatList"
          :key="idx"
          class="chat-list-item"
          :class="{ active: activeChatIdx === idx }"
          @click="selectChat(idx)"
        >
          <div class="chat-item-avatar" :style="{ background: chat.avatar }">
            <Icon name="wallet" :size="14" color="white" />
          </div>
          <div class="chat-item-info">
            <div class="chat-item-name">{{ chat.name }}</div>
            <div class="chat-item-preview">{{ chat.preview }}</div>
          </div>
          <div class="chat-item-right">
            <div class="chat-item-time">{{ chat.time }}</div>
            <div v-if="chat.badge" class="chat-item-badge">{{ chat.badge }}</div>
          </div>
        </div>
      </div>

      <!-- Chat Window -->
      <div class="chat-window">
        <div class="chat-header">
          <div class="chat-header-avatar" :style="{ background: activeChat?.avatar }">
            <Icon name="wallet" :size="14" color="white" />
          </div>
          <div>
            <div class="chat-header-name">{{ activeChat?.name }}</div>
            <div class="chat-header-addr">0x3F2A...4B1E · vitalik.eth</div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-header-btn">
              <Icon name="link" :size="12" /> 查看主页
            </button>
            <button class="chat-header-btn">
              <Icon name="hexagon" :size="12" /> 发送 Token
            </button>
          </div>
        </div>

        <div class="chat-messages">
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="msg"
            :class="{ me: msg.isMe }"
          >
            <div class="msg-avatar" :style="{ background: msg.avatar }">
              <Icon name="wallet" :size="12" color="white" />
            </div>
            <div class="msg-body">
              <div class="msg-bubble">{{ msg.text }}</div>
              <div class="msg-time" :style="{ justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }">
                {{ msg.time }}
                <span class="msg-chain">
                  <Icon name="check" :size="9" color="var(--accent-green)" /> {{ msg.chain }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <input
            class="chat-input"
            type="text"
            placeholder="发送消息... (将由钱包签名加密)"
          >
          <button class="chat-send">
            <Icon name="send" :size="14" color="white" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  animation: fadeIn 0.35s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.section-dot.green {
  background: var(--accent-green);
}

/* ── Chat Layout ── */
.chat-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 0;
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  height: 540px;
  overflow: hidden;
}

/* Chat List */
.chat-list {
  border-right: 1px solid var(--border);
  overflow-y: auto;
}
.chat-list-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
}
.chat-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.chat-list-item:hover {
  background: rgba(99, 179, 237, 0.05);
}
.chat-list-item.active {
  background: rgba(99, 179, 237, 0.1);
}

.chat-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-item-info {
  flex: 1;
  min-width: 0;
}
.chat-item-name {
  font-size: 13px;
  font-weight: 500;
}
.chat-item-preview {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.chat-item-time {
  font-size: 10px;
  color: var(--text-muted);
}
.chat-item-badge {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-blue);
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Chat Window */
.chat-window {
  display: flex;
  flex-direction: column;
}
.chat-header {
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
}
.chat-header-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-header-name {
  font-size: 14px;
  font-weight: 600;
}
.chat-header-addr {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent-blue);
}
.chat-header-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.chat-header-btn {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.chat-header-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

/* Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.msg {
  display: flex;
  gap: 10px;
}
.msg.me {
  flex-direction: row-reverse;
}
.msg-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.msg-body {
  max-width: 60%;
}
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  background: var(--bg-deep);
}
.msg.me .msg-bubble {
  background: rgba(99, 179, 237, 0.12);
  border-color: rgba(99, 179, 237, 0.2);
  color: var(--text-primary);
}
.msg-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
}
.msg-chain {
  font-size: 9px;
  color: var(--accent-green);
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Input */
.chat-input-area {
  border-top: 1px solid var(--border);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.chat-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 9px 16px;
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-body);
  outline: none;
  transition: border-color 0.2s;
}
.chat-input:focus {
  border-color: var(--border-hover);
}
.chat-input::placeholder {
  color: var(--text-muted);
}
.chat-send {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.chat-send:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(99, 179, 237, 0.4);
}

@media (max-width: 768px) {
  .chat-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .chat-list {
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 200px;
  }
}
</style>
