<template>
  <div class="article-publish">
    <el-card class="publish-card">
      <template #header>
        <div class="card-header">
          <span>发布文章</span>
        </div>
      </template>

      <el-form :model="form" label-width="80px" ref="articleFormRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" />
        </el-form-item>

        <el-form-item label="正文" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入 Markdown 内容"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入标签"
          >
            <el-option
              v-for="item in existingTags"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="发布平台">
          <el-checkbox-group v-model="form.platforms">
            <el-checkbox
              v-for="item in articlePlatforms"
              :key="item.key"
              :label="item.key"
            >
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="账号选择">
          <div class="platform-account-list">
            <div
              v-for="platform in form.platforms"
              :key="platform"
              class="platform-account-item"
            >
              <div class="platform-account-label">{{ platformLabel(platform) }}</div>
              <el-select
                v-model="form.account_ids[platform]"
                placeholder="请选择发布账号"
                style="width: 100%"
              >
                <el-option
                  v-for="acc in getAccountsForPlatform(platform)"
                  :key="`${platform}-${acc.id}`"
                  :label="`${acc.name} (${platformLabel(platform)})`"
                  :value="acc.id"
                />
              </el-select>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="浏览器配置">
          <el-select v-model="form.browser_profile_id" placeholder="选择本地配置 (可选)" clearable style="width: 100%">
            <el-option
              v-for="item in browserStore.profiles"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handlePublish" :loading="publishing">立即发布</el-button>
          <el-button @click="handleSave">存为草稿</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore } from '@/stores/account'
import { useBrowserStore } from '@/stores/browser'
import { usePlatformStore } from '@/stores/platform'
import { PlatformType } from '@/core/platformConstants'
import { http } from '@/utils/request'

const accountStore = useAccountStore()
const browserStore = useBrowserStore()
const platformStore = usePlatformStore()

const form = reactive({
  title: '',
  content: '',
  tags: [],
  platforms: [PlatformType.ZHIHU],
  account_ids: {},
  browser_profile_id: null
})

const publishing = ref(false)
const existingTags = ref(['技术', '自动化', '工具'])

const ARTICLE_BASE_PLATFORMS = [
  { key: PlatformType.ZHIHU, name: '知乎' },
  { key: PlatformType.JUEJIN, name: '掘金' }
]

const supportsArticlePublishing = (platformKey) => {
  if (platformKey === PlatformType.ZHIHU || platformKey === PlatformType.JUEJIN) return true
  const ext = platformStore.customExtensions.find(item => item.platform_id === platformKey)
  return Boolean(ext?.manifest?.actions?.publish_article)
}

const articlePlatforms = computed(() => {
  const platformMap = new Map()
  ARTICLE_BASE_PLATFORMS.forEach(item => {
    platformMap.set(item.key, item)
  })
  platformStore.customExtensions.forEach(ext => {
    const platformKey = Number(ext.platform_id)
    if (supportsArticlePublishing(platformKey)) {
      platformMap.set(platformKey, { key: platformKey, name: ext.name })
    }
  })
  return Array.from(platformMap.values())
})

const platformLabel = (platformKey) => {
  const found = articlePlatforms.value.find(item => item.key === Number(platformKey))
  return found?.name || `平台 ${platformKey}`
}

const getAccountsForPlatform = (platformKey) => {
  return accountStore.accounts.filter(acc => Number(acc.type) === Number(platformKey))
}

onMounted(async () => {
  await Promise.all([
    browserStore.fetchProfiles(),
    platformStore.fetchExtensions()
  ])

  const availablePlatformKeys = articlePlatforms.value.map(item => item.key)
  form.platforms = form.platforms.filter(platformKey => availablePlatformKeys.includes(Number(platformKey)))
  if (form.platforms.length === 0 && availablePlatformKeys.length > 0) {
    form.platforms = [availablePlatformKeys[0]]
  }
})

watch(
  () => [...form.platforms],
  (selectedPlatforms) => {
    for (const platform of Object.keys(form.account_ids)) {
      if (!selectedPlatforms.includes(Number(platform))) {
        delete form.account_ids[platform]
      }
    }
  }
)

const handlePublish = async () => {
  if (!form.title || !form.content || form.platforms.length === 0) {
    ElMessage.error('请填写完整信息')
    return
  }
  for (const platform of form.platforms) {
    if (!form.account_ids[platform]) {
      ElMessage.error(`请选择${platformLabel(platform)}账号`)
      return
    }
  }

  publishing.value = true
  try {
    // 1. Create Article
    const articleRes = await http.post('/articles', {
      title: form.title,
      content: form.content,
      tags: form.tags
    })
    const articleId = articleRes.data.id

    // 2. Publish to selected platforms
    for (const platform of form.platforms) {
      await http.post('/publish/article', {
        article_id: articleId,
        account_id: form.account_ids[platform],
        platform_id: Number(platform),
        browser_profile_id: form.browser_profile_id
      })
    }

    ElMessage.success('发布任务已提交')
  } catch (error) {
    console.error('Publish failed:', error)
    ElMessage.error('发布失败')
  } finally {
    publishing.value = false
  }
}

const handleSave = () => {
  ElMessage.success('已保存草稿 (模拟)')
}
</script>

<style scoped>
.article-publish {
  padding: 20px;
}
.publish-card {
  max-width: 1000px;
  margin: 0 auto;
}
.platform-account-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.platform-account-label {
  margin-bottom: 6px;
  color: #606266;
  font-size: 13px;
}
</style>
