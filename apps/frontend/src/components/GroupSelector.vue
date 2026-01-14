<template>
  <div class="group-selector">
    <el-select
      v-model="selectedGroupId"
      placeholder="选择账号组"
      clearable
      filterable
      @change="handleGroupChange"
      :loading="groupStore.loading"
    >
      <template #prefix>
        <el-icon><Folder /></el-icon>
      </template>
      <el-option
        v-for="group in groupStore.groupOptions"
        :key="group.value"
        :label="group.label"
        :value="group.value"
      />
    </el-select>

    <!-- 创建新组按钮 -->
    <el-button
      type="primary"
      :icon="Plus"
      circle
      size="small"
      @click="showCreateDialog = true"
      title="创建新组"
    />

    <!-- 创建组对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建账号组"
      width="400px"
      @closed="resetForm"
    >
      <el-form :model="newGroup" label-width="80px">
        <el-form-item label="组名称" required>
          <el-input v-model="newGroup.name" placeholder="请输入组名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newGroup.description"
            type="textarea"
            placeholder="可选描述"
            :rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateGroup" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Folder, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useGroupStore } from '@/stores/group'

const props = defineProps({
  modelValue: {
    type: [Number, null],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const groupStore = useGroupStore()

const selectedGroupId = ref(props.modelValue)
const showCreateDialog = ref(false)
const creating = ref(false)
const newGroup = ref({
  name: '',
  description: ''
})

// 监听外部值变化
watch(() => props.modelValue, (val) => {
  selectedGroupId.value = val
})

const handleGroupChange = (val) => {
  emit('update:modelValue', val)
  emit('change', val)
  groupStore.setCurrentGroup(val)
}

const handleCreateGroup = async () => {
  if (!newGroup.value.name.trim()) {
    ElMessage.warning('请输入组名称')
    return
  }

  creating.value = true
  const result = await groupStore.createGroup(newGroup.value)
  creating.value = false

  if (result.success) {
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    // 自动选中新创建的组
    if (result.data?.id) {
      selectedGroupId.value = result.data.id
      handleGroupChange(result.data.id)
    }
  } else {
    ElMessage.error(result.message || '创建失败')
  }
}

const resetForm = () => {
  newGroup.value = { name: '', description: '' }
}

onMounted(() => {
  groupStore.fetchGroups()
})
</script>

<style lang="scss" scoped>
.group-selector {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  .el-select {
    width: 200px;
  }
}
</style>
