<template>
  <div class="extension-container">
    <div class="header-section">
      <div class="header-content">
        <h1 class="gradient-text">Extension Center</h1>
        <p class="subtitle">Powering OmniPost with OpenCLI plugins and external automation tools.</p>
      </div>
      <el-button 
        type="primary" 
        size="large" 
        :icon="Refresh" 
        class="sync-btn"
        @click="handleSync" 
        :loading="syncing"
      >
        Sync Capabilities
      </el-button>
    </div>

    <el-row :gutter="20">
      <!-- Status Card -->
      <el-col :span="8">
        <el-card class="glass-card status-info" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>Environment Status</span>
              <el-icon :class="status.installed ? 'status-icon-on' : 'status-icon-off'">
                <CircleCheckFilled v-if="status.installed" />
                <CircleCloseFilled v-else />
              </el-icon>
            </div>
          </template>
          
          <div class="status-content">
            <div class="info-item">
              <span class="label">Binary Found:</span>
              <span class="value">{{ status.installed ? 'Yes' : 'No' }}</span>
            </div>
            <div v-if="status.installed" class="info-item">
              <span class="label">Path:</span>
              <code class="path-text">{{ status.binary_path }}</code>
            </div>
            <div v-if="status.installed" class="info-item">
              <span class="label">Version:</span>
              <span class="value">{{ status.version || 'v1.0.0' }}</span>
            </div>
            <div v-if="!status.installed" class="guide-box">
              <p>To enable external plugins, install the OpenCLI helper:</p>
              <div class="command-box">
                <code>npm install -g @jackwener/opencli@latest</code>
                <el-icon @click="copyCommand"><CopyDocument /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- Plugins Grid -->
      <el-col :span="16">
        <div v-if="status.platforms?.length" class="platforms-grid">
          <el-card 
            v-for="platform in status.platforms" 
            :key="platform.id" 
            class="platform-item glass-card"
            shadow="hover"
          >
            <div class="platform-header">
              <div class="platform-title">
                <h3>{{ platform.name }}</h3>
                <span class="platform-id">#{{ platform.platform_id }}</span>
              </div>
              <el-tag 
                :type="platform.source_type === 'local' ? 'warning' : 'info'" 
                effect="plain"
                round
                size="small"
              >
                {{ platform.source_type === 'local' ? 'Local Plugin' : 'System Tool' }}
              </el-tag>
            </div>
            <div class="platform-body">
              <p class="executable-line">Exec: <code>{{ platform.executable }}</code></p>
              <p class="cap-line">
                Capabilities:
                <span>{{ getCapabilitySummary(platform.manifest) }}</span>
              </p>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="No OpenCLI platforms discovered yet. Click Sync to scan." />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Refresh, CircleCheckFilled, CircleCloseFilled, CopyDocument } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const syncing = ref(false)
const status = ref({
  installed: false,
  binary_path: '',
  version: '',
  platforms: []
})

const fetchStatus = async () => {
  loading.value = true
  try {
    const res = await request.get('/opencli/status')
    if (res.code === 200) {
      status.value = res.data
    }
  } catch (err) {
    console.error('Failed to fetch status:', err)
  } finally {
    loading.value = false
  }
}

const handleSync = async () => {
  syncing.value = true
  try {
    const res = await request.post('/opencli/sync')
    if (res.code === 200) {
      ElMessage.success(`Synced ${res.data.count} platforms successfully`)
      await fetchStatus()
    }
  } catch (err) {
    console.error('Sync failed:', err)
    ElMessage.error('Sync failed')
  } finally {
    syncing.value = false
  }
}

const copyCommand = () => {
  navigator.clipboard.writeText('npm install -g @jackwener/opencli@latest')
  ElMessage.success('Copied to clipboard')
}

const getCapabilitySummary = (manifest) => {
  const actions = manifest?.actions || {}
  const names = Object.keys(actions || {}).filter(key => {
    const val = actions[key]
    return val && typeof val === 'object'
  })
  if (!names.length) return 'No executable actions'
  if (names.length <= 4) return names.join(', ')
  return `${names.slice(0, 4).join(', ')} +${names.length - 4}`
}

onMounted(fetchStatus)
</script>

<style scoped>
.extension-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 8px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.status-icon-on { color: #10b981; font-size: 20px; }
.status-icon-off { color: #ef4444; font-size: 20px; }

.status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label { color: #64748b; font-size: 0.9rem; }
.value { font-weight: 500; }
.path-text {
  font-family: monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.guide-box {
  margin-top: 10px;
  background: #fff1f2;
  border: 1px solid #fecaca;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.85rem;
}

.command-box {
  margin-top: 8px;
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.command-box code { font-family: 'Fira Code', monospace; }
.command-box .el-icon { cursor: pointer; transition: opacity 0.2s; }
.command-box .el-icon:hover { opacity: 0.7; }

.cap-line {
  margin-top: 8px;
  color: #334155;
  font-size: 0.9rem;
}

.platforms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.platform-item {
  transition: transform 0.2s;
}

.platform-item:hover {
  transform: translateY(-4px);
}

.platform-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.platform-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.platform-id {
  font-size: 0.8rem;
  color: #94a3b8;
  font-family: monospace;
}

.executable-line {
  font-size: 0.85rem;
  color: #64748b;
}

.executable-line code {
  color: #d946ef;
}
</style>
