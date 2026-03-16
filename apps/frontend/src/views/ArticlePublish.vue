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
            <el-checkbox label="ZHIHU">知乎</el-checkbox>
            <el-checkbox label="JUEJIN">掘金</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="账号选择">
          <el-select v-model="form.account_id" placeholder="请选择发布账号" style="width: 100%">
            <el-option
              v-for="acc in availableAccounts"
              :key="acc.id"
              :label="`${acc.name} (${acc.platform})`"
              :value="acc.id"
            />
          </el-select>
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
import { reactive, ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAccountStore } from '@/stores/account'
import { useBrowserStore } from '@/stores/browser'
import axios from 'axios'

const accountStore = useAccountStore()
const browserStore = useBrowserStore()

const form = reactive({
  title: '',
  content: '',
  tags: [],
  platforms: ['ZHIHU'],
  account_id: '',
  browser_profile_id: null
})

const publishing = ref(false)
const existingTags = ref(['技术', '自动化', '工具'])

const availableAccounts = computed(() => {
  return accountStore.accounts.filter(acc => 
    form.platforms.includes(acc.platform.toUpperCase()) || 
    acc.platform === '知乎' || acc.platform === '掘金'
  )
})

onMounted(async () => {
  await browserStore.fetchProfiles()
})

const handlePublish = async () => {
  if (!form.title || !form.content || !form.account_id) {
    ElMessage.error('请填写完整信息')
    return
  }

  publishing.value = true
  try {
    // 1. Create Article
    const articleRes = await axios.post('/api/articles', {
      title: form.title,
      content: form.content,
      tags: form.tags
    })
    const articleId = articleRes.data.id

    // 2. Publish to selected platforms
    for (const platform of form.platforms) {
      await axios.post('/api/publish/article', {
        article_id: articleId,
        account_id: form.account_id,
        platform: platform,
        browser_profile_id: form.browser_profile_id
      })
    }

    ElMessage.success('发布任务已提交')
  } catch {
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
</style>
