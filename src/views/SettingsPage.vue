<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../components/icons/Icon.vue'
import { useProfileStore } from '../stores/profile'

const profile = useProfileStore()
const newTag = ref('')
const saved = ref(false)
const avatarInput = ref<HTMLInputElement>()

function handleAddTag() {
  const label = newTag.value.trim()
  if (!label) return
  profile.addTag(label)
  newTag.value = ''
}

function handleTagKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    handleAddTag()
  }
}

function handleAvatarClick() {
  avatarInput.value?.click()
}

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    profile.setAvatar(reader.result as string)
  }
  reader.readAsDataURL(file)
}

function handleSave() {
  profile.saveToStorage()
  saved.value = true
  setTimeout(() => { saved.value = false }, 2000)
}
</script>

<template>
  <div class="settings-page">
    <!-- 保存成功提示 -->
    <Transition name="toast">
      <div v-if="saved" class="save-toast">
        <Icon name="check" :size="14" color="var(--accent-green)" />
        设置已保存
      </div>
    </Transition>

    <div class="settings-grid">
      <!-- 左：资料设置 -->
      <div class="settings-main">
        <!-- 头像 -->
        <div class="setting-section">
          <div class="setting-label">头像</div>
          <div class="avatar-upload" @click="handleAvatarClick">
            <div class="avatar-preview">
              <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="avatar" class="avatar-img" />
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/>
              </svg>
            </div>
            <div class="avatar-upload-info">
              <div class="avatar-upload-title">点击上传头像</div>
              <div class="avatar-upload-hint">支持 JPG、PNG，建议 200×200 以上</div>
            </div>
            <div class="avatar-upload-btn">
              <Icon name="image" :size="14" />
              选择图片
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              style="display:none"
              @change="handleAvatarChange"
            />
          </div>
        </div>

        <!-- 昵称 -->
        <div class="setting-section">
          <div class="setting-label">昵称</div>
          <input
            v-model="profile.nickname"
            class="setting-input"
            placeholder="你的显示名称"
            maxlength="20"
          />
          <div class="setting-hint">最多 20 个字符</div>
        </div>

        <!-- 个人签名 -->
        <div class="setting-section">
          <div class="setting-label">个人签名</div>
          <input
            v-model="profile.quote"
            class="setting-input"
            placeholder="一句话介绍自己..."
            maxlength="50"
          />
          <div class="setting-hint">显示在侧边栏资料卡上</div>
        </div>

        <!-- 个人介绍 -->
        <div class="setting-section">
          <div class="setting-label">个人介绍</div>
          <textarea
            v-model="profile.bio"
            class="setting-textarea"
            placeholder="详细介绍一下自己..."
            maxlength="200"
            rows="3"
          ></textarea>
          <div class="setting-hint">{{ profile.bio.length }}/200</div>
        </div>

        <!-- 标签 -->
        <div class="setting-section">
          <div class="setting-label">个人标签</div>
          <div class="tags-display">
            <span
              v-for="tag in profile.tags"
              :key="tag.id"
              class="tag-item"
            >
              {{ tag.label }}
              <button class="tag-remove" @click="profile.removeTag(tag.id)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </span>
            <div v-if="profile.tags.length < 6" class="tag-add">
              <input
                v-model="newTag"
                class="tag-input"
                placeholder="+ 添加标签"
                maxlength="10"
                @keydown="handleTagKeydown"
              />
              <button v-if="newTag.trim()" class="tag-add-btn" @click="handleAddTag">
                <Icon name="plus" :size="12" />
              </button>
            </div>
          </div>
          <div class="setting-hint">最多 6 个标签，按回车添加</div>
        </div>

        <!-- 社交链接 -->
        <div class="setting-section">
          <div class="setting-label">社交链接</div>
          <div class="social-links">
            <div class="social-row">
              <span class="social-icon">𝕏</span>
              <input v-model="profile.socialLinks.twitter" class="setting-input" placeholder="Twitter / X 用户名" />
            </div>
            <div class="social-row">
              <Icon name="link" :size="14" color="var(--text-muted)" class="social-icon-svg" />
              <input v-model="profile.socialLinks.github" class="setting-input" placeholder="GitHub 用户名" />
            </div>
            <div class="social-row">
              <Icon name="edit" :size="14" color="var(--text-muted)" class="social-icon-svg" />
              <input v-model="profile.socialLinks.mirror" class="setting-input" placeholder="Mirror.xyz 地址" />
            </div>
            <div class="social-row">
              <Icon name="hexagon" :size="14" color="var(--text-muted)" class="social-icon-svg" />
              <input v-model="profile.socialLinks.ens" class="setting-input" placeholder="ENS 域名 (yourname.eth)" />
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <button class="save-btn" @click="handleSave">
          <Icon name="check" :size="14" />
          保存设置
        </button>
      </div>

      <!-- 右：预览 -->
      <div class="settings-preview">
        <div class="preview-label">资料卡预览</div>
        <div class="preview-card">
          <div class="preview-avatar">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" class="preview-avatar-img" />
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/>
            </svg>
            <span class="preview-dot"></span>
          </div>
          <div class="preview-name">{{ profile.nickname || '未设置昵称' }}</div>
          <div class="preview-addr">0x7a3F...8cB2</div>
          <div class="preview-quote">"{{ profile.quote || '...' }}"</div>
          <div v-if="profile.tags.length" class="preview-tags">
            <span v-for="t in profile.tags" :key="t.id" class="preview-tag">{{ t.label }}</span>
          </div>
          <div class="preview-stats">
            <div class="ps"><span class="ps-n">42</span> 文章</div>
            <div class="ps-sep"></div>
            <div class="ps"><span class="ps-n">18</span> NFT</div>
            <div class="ps-sep"></div>
            <div class="ps"><span class="ps-n">1.2K</span> 读者</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  animation: fadeIn 0.35s ease;
  position: relative;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 24px;
  align-items: flex-start;
}

/* ── Main Form ── */
.settings-main {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 28px;
  min-width: 0;
}

.setting-section {
  margin-bottom: 24px;
}
.setting-section:last-of-type {
  margin-bottom: 28px;
}
.setting-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.setting-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.setting-input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-body);
  transition: border-color 0.2s;
}
.setting-input:focus {
  border-color: var(--border-hover);
}
.setting-input::placeholder {
  color: var(--text-muted);
}

.setting-textarea {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  font-family: var(--font-body);
  resize: vertical;
  min-height: 70px;
  transition: border-color 0.2s;
}
.setting-textarea:focus {
  border-color: var(--border-hover);
}
.setting-textarea::placeholder {
  color: var(--text-muted);
}

/* Avatar Upload */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.avatar-upload:hover {
  border-color: var(--border-hover);
  background: rgba(99, 179, 237, 0.03);
}
.avatar-preview {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.avatar-upload-info {
  flex: 1;
}
.avatar-upload-title {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}
.avatar-upload-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.avatar-upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: rgba(99, 179, 237, 0.08);
  border: 1px solid rgba(99, 179, 237, 0.2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--accent-blue);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.avatar-upload-btn:hover {
  background: rgba(99, 179, 237, 0.15);
}

/* Tags */
.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: rgba(99, 179, 237, 0.08);
  border: 1px solid rgba(99, 179, 237, 0.2);
  color: var(--accent-blue);
  font-size: 12px;
  font-family: var(--font-mono);
}
.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.tag-remove:hover {
  color: var(--accent-pink);
  background: rgba(246, 135, 179, 0.15);
}
.tag-add {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tag-input {
  width: 100px;
  padding: 5px 8px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-primary);
  background: transparent;
  font-family: var(--font-mono);
  transition: border-color 0.2s;
}
.tag-input:focus {
  border-color: var(--accent-blue);
  border-style: solid;
}
.tag-input::placeholder {
  color: var(--text-muted);
}
.tag-add-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(99, 179, 237, 0.1);
  color: var(--accent-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.tag-add-btn:hover {
  background: rgba(99, 179, 237, 0.2);
}

/* Social Links */
.social-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.social-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.social-icon {
  width: 28px;
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.social-icon-svg {
  width: 28px;
  text-align: center;
  flex-shrink: 0;
}
.social-row .setting-input {
  flex: 1;
}

/* Save Button */
.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 20px rgba(99, 179, 237, 0.25);
}
.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 25px rgba(99, 179, 237, 0.4);
}

/* ── Preview Card ── */
.settings-preview {
  position: sticky;
  top: 100px;
}
.preview-label {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.preview-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px 16px 14px;
  text-align: center;
}
.preview-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(99, 179, 237, 0.2);
}
.preview-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2px solid var(--bg-card);
}
.preview-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 3px;
}
.preview-addr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-blue);
  margin-bottom: 8px;
}
.preview-quote {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
  font-family: var(--font-display);
  line-height: 1.5;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
}
.preview-tags {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.preview-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.preview-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}
.ps {
  flex: 1;
  text-align: center;
  font-size: 9px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
.ps-n {
  font-weight: 700;
  font-size: 12px;
  color: var(--text-primary);
  margin-right: 2px;
}
.ps-sep {
  width: 1px;
  height: 14px;
  background: var(--border);
}

/* ── Toast ── */
.save-toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-deep);
  border: 1px solid rgba(104, 211, 145, 0.3);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  color: var(--accent-green);
  font-size: 13px;
  font-weight: 500;
}
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

@media (max-width: 960px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
  .settings-preview {
    position: static;
  }
}
</style>
