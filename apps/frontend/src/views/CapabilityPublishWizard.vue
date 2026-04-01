<template>
  <div class="wizard-page">
    <div class="page-header">
      <h1>发布向导</h1>
      <p>按能力执行发布任务，支持内置平台与 OpenCLI 动态能力。</p>
    </div>

    <el-card class="wizard-card">
      <el-steps :active="currentStep" finish-status="success">
        <el-step title="选择能力" />
        <el-step title="选择账号" />
        <el-step title="填写内容" />
        <el-step title="预检" />
        <el-step title="执行" />
      </el-steps>

      <div class="step-content">
        <div v-if="currentStep === 0">
          <el-input v-model="filters.keyword" placeholder="搜索能力" clearable />
          <el-radio-group v-model="filters.kind" class="kind-filter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="publish.video">视频</el-radio-button>
            <el-radio-button label="publish.article">图文</el-radio-button>
          </el-radio-group>
          <el-table :data="filteredCapabilities" border>
            <el-table-column prop="name" label="能力" min-width="220" />
            <el-table-column prop="site" label="站点" width="140" />
            <el-table-column prop="kind" label="类型" width="140" />
            <el-table-column prop="source" label="来源" width="120" />
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="primary" @click="selectCapability(scope.row)">选择</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else-if="currentStep === 1">
          <div class="selected-cap">
            当前能力: <strong>{{ selectedCapability?.name }}</strong>
          </div>
          <el-checkbox-group v-model="selectedAccountFiles">
            <el-space wrap>
              <el-checkbox
                v-for="account in matchedAccounts"
                :key="account.filePath"
                :value="account.filePath"
              >
                {{ account.userName }} ({{ account.platformName }})
              </el-checkbox>
            </el-space>
          </el-checkbox-group>
          <el-empty v-if="matchedAccounts.length === 0" description="当前能力暂无可用账号，请先在账号管理中完成登录。" />
        </div>

        <div v-else-if="currentStep === 2">
          <el-form label-width="140px">
            <el-form-item
              v-for="field in schemaFields"
              :key="field.key"
              :label="field.label || field.key"
              :required="field.required"
            >
              <el-input
                v-if="field.type === 'string'"
                v-model="formModel[field.key]"
                :placeholder="field.help || `请输入${field.label || field.key}`"
              />
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="formModel[field.key]"
                :min="0"
              />
              <el-switch v-else-if="field.type === 'boolean'" v-model="formModel[field.key]" />
              <el-input
                v-else
                v-model="arrayInputMap[field.key]"
                :placeholder="`${field.label || field.key}，多个值逗号分隔`"
              />
              <div class="field-help">{{ field.help }}</div>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="currentStep === 3">
          <el-alert title="预检结果" type="info" :closable="false" />
          <ul class="check-list">
            <li :class="{ ok: !!selectedCapability }">能力已选择</li>
            <li :class="{ ok: selectedAccountFiles.length > 0 }">至少一个匹配账号</li>
            <li :class="{ ok: requiredFieldErrors.length === 0 }">必填字段完整</li>
          </ul>
          <el-alert
            v-if="requiredFieldErrors.length > 0"
            type="warning"
            :closable="false"
            :title="`存在未填写的必填项: ${requiredFieldErrors.join(', ')}`"
          />
        </div>

        <div v-else>
          <el-result
            icon="success"
            title="准备完成"
            sub-title="点击下方按钮创建并执行任务。"
          />
          <el-button type="primary" :loading="submitting" @click="submitTask">执行发布</el-button>
        </div>
      </div>

      <div class="wizard-actions">
        <el-button :disabled="currentStep === 0" @click="currentStep--">上一步</el-button>
        <el-button
          v-if="currentStep < 4"
          type="primary"
          :disabled="!canGoNext"
          @click="currentStep++"
        >
          下一步
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { capabilityApi } from '@/api/capability'
import { PLATFORM_NAMES } from '@/core/platformConstants'

const router = useRouter()
const currentStep = ref(0)
const submitting = ref(false)
const capabilities = ref([])
const accounts = ref([])
const selectedCapability = ref(null)
const selectedAccountFiles = ref([])
const formModel = reactive({})
const arrayInputMap = reactive({})
const filters = reactive({
  keyword: '',
  kind: 'all'
})

const filteredCapabilities = computed(() => {
  return capabilities.value.filter(cap => {
    const matchKind = filters.kind === 'all' || cap.kind === filters.kind
    const keyword = filters.keyword.trim().toLowerCase()
    const matchKeyword = !keyword
      || cap.name.toLowerCase().includes(keyword)
      || cap.site.toLowerCase().includes(keyword)
    return matchKind && matchKeyword
  })
})

const matchedAccounts = computed(() => {
  if (!selectedCapability.value) return []
  return accounts.value.filter(acc => acc.type === selectedCapability.value.platform_id)
})

const schemaFields = computed(() => {
  return selectedCapability.value?.input_schema?.fields || []
})

const requiredFieldErrors = computed(() => {
  return schemaFields.value
    .filter(field => field.required)
    .filter(field => {
      const value = getFieldValue(field)
      if (Array.isArray(value)) return value.length === 0
      return value === undefined || value === null || value === ''
    })
    .map(field => field.label || field.key)
})

const canGoNext = computed(() => {
  if (currentStep.value === 0) return !!selectedCapability.value
  if (currentStep.value === 1) return selectedAccountFiles.value.length > 0
  if (currentStep.value === 2) return requiredFieldErrors.value.length === 0
  if (currentStep.value === 3) return requiredFieldErrors.value.length === 0 && selectedAccountFiles.value.length > 0
  return false
})

const normalizeArrayInput = (raw) => {
  if (Array.isArray(raw)) return raw
  return String(raw || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

const getFieldValue = (field) => {
  if (field.type === 'string[]' || field.type === 'file[]') {
    return normalizeArrayInput(arrayInputMap[field.key])
  }
  return formModel[field.key]
}

const selectCapability = (capability) => {
  selectedCapability.value = capability
  selectedAccountFiles.value = []
  Object.keys(formModel).forEach(key => delete formModel[key])
  Object.keys(arrayInputMap).forEach(key => delete arrayInputMap[key])
  schemaFields.value.forEach(field => {
    if (field.default !== undefined) {
      if (field.type === 'string[]' || field.type === 'file[]') {
        arrayInputMap[field.key] = Array.isArray(field.default) ? field.default.join(',') : String(field.default)
      } else {
        formModel[field.key] = field.default
      }
    }
  })
  ElMessage.success(`已选择能力: ${capability.name}`)
}

const loadCapabilities = async () => {
  const res = await capabilityApi.getCapabilities()
  capabilities.value = res.data || []
}

const loadAccounts = async () => {
  const res = await request.get('/getAccounts')
  const rows = Array.isArray(res.data) ? res.data : []
  accounts.value = rows.map(item => ({
    id: item[0],
    type: item[1],
    filePath: item[2],
    userName: item[3],
    platformName: PLATFORM_NAMES[item[1]] || '未知'
  }))
}

const buildInputs = () => {
  const payload = {}
  schemaFields.value.forEach(field => {
    payload[field.key] = getFieldValue(field)
  })
  return payload
}

const submitTask = async () => {
  if (!selectedCapability.value) return
  submitting.value = true
  try {
    const payload = {
      capability_id: selectedCapability.value.id,
      accountList: selectedAccountFiles.value,
      inputs: buildInputs()
    }
    const res = await capabilityApi.publishByCapability(payload)
    ElMessage.success(`任务已创建: ${res.data.taskId}`)
    router.push('/task-management')
  } catch {
    ElMessage.error('任务创建失败')
  } finally {
    submitting.value = false
  }
}

watch(selectedCapability, () => {
  if (currentStep.value > 0) currentStep.value = 1
})

onMounted(async () => {
  await Promise.all([loadCapabilities(), loadAccounts()])
})
</script>

<style scoped>
.wizard-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0 0 8px 0;
}

.wizard-card {
  padding: 8px;
}

.step-content {
  margin-top: 24px;
  min-height: 360px;
}

.kind-filter {
  margin: 12px 0;
}

.wizard-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
}

.field-help {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
}

.check-list {
  margin-top: 12px;
  color: #ef4444;
}

.check-list .ok {
  color: #16a34a;
}

.selected-cap {
  margin-bottom: 12px;
}
</style>
