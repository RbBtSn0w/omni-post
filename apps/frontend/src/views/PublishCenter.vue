<template>
  <div class="publish-center">
    <!-- Tab管理区域 -->
    <div class="tab-management">
      <div class="tab-header">
        <!-- Tab列表 -->
        <div class="tab-list-container">
          <div class="tab-list">
            <div
              v-for="tab in tabs"
              :key="tab.name"
              :class="['tab-item', {
                active: activeTab === tab.name,
                'batch-tab': tab.label.includes('批量')
              }]"
              @click="activeTab = tab.name"
            >
              <span class="tab-label">
                <el-icon v-if="tab.label.includes('批量')"><Grid /></el-icon>
                {{ tab.label }}
              </span>
              <el-icon
                v-if="tabs.length > 1"
                class="close-icon"
                @click.stop="removeTab(tab.name)"
              >
                <Close />
              </el-icon>
            </div>
          </div>

          <!-- Tab数量统计 -->
          <div class="tab-stats">
            <span class="stats-text">
              共 {{ tabs.length }} 个发布项
              <span v-if="tabs.filter(t => t.label.includes('批量')).length > 0">
                ({{ tabs.filter(t => t.label.includes('批量')).length }}个批量发布)
              </span>
            </span>
          </div>
        </div>

        <!-- Tab操作按钮 -->
        <div class="tab-actions">
          <el-button
            type="primary"
            size="small"
            @click="addTab"
            class="add-tab-btn"
          >
            <el-icon><Plus /></el-icon>
            添加发布项
          </el-button>

          <el-button
            ref="taskManagerBtnRef"
            type="info"
            size="small"
            @click="openTaskCenter"
            class="task-center-btn"
            :class="{ 'task-arrived': taskArrivedFlash }"
          >
            <el-icon><Management /></el-icon>
            任务管理
            <el-badge v-if="pendingTaskCount > 0" :value="pendingTaskCount" class="task-badge" />
          </el-button>
        </div>
      </div>
    </div>

    <!-- 发布动画：飞向任务管理的卡片 -->
    <Teleport to="body">
      <div
        v-if="flyingCardVisible"
        class="flying-card"
        :style="flyingCardStyle"
      >
        <div class="flying-card-content">
          <el-icon class="flying-card-icon"><VideoPlay /></el-icon>
          <span class="flying-card-text">任务已提交</span>
        </div>
      </div>
    </Teleport>

    <!-- 内容区域 -->
    <div class="publish-content">


      <div
        v-for="tab in tabs"
        :key="tab.name"
        v-show="activeTab === tab.name"
        class="tab-content"
      >
        <!-- 发布状态提示 -->
        <div v-if="tab.publishStatus" class="publish-status">
          <el-alert
            :title="tab.publishStatus.message"
            :type="tab.publishStatus.type"
            :closable="false"
            show-icon
          />
        </div>



        <!-- 视频上传区域 -->
        <div class="upload-section">
          <h3>视频</h3>

          <!-- 上传选项标签页 -->
          <div v-if="tab.fileList.length === 0" class="upload-tabs">
            <el-tabs v-model="tab.uploadTab" type="card" class="upload-tabs">
              <!-- 本地上传 -->
              <el-tab-pane label="本地上传" name="local">
                <el-upload
                  class="video-upload"
                  drag
                  :auto-upload="true"
                  :action="`${apiBaseUrl}/upload`"
                  :on-success="(response, file) => handleUploadSuccess(response, file, tab)"
                  :on-error="handleUploadError"
                  multiple
                  accept="video/*"
                  :headers="authHeaders"
                >
                  <el-icon class="el-icon--upload"><Upload /></el-icon>
                  <div class="el-upload__text">
                    将视频文件拖到此处，或<em>点击上传</em>
                  </div>
                  <template #tip>
                    <div class="el-upload__tip">
                      支持MP4、AVI等视频格式，可上传多个文件
                    </div>
                  </template>
                </el-upload>
              </el-tab-pane>

              <!-- 素材库选择 -->
              <el-tab-pane label="素材库" name="material">
                <div class="material-upload-section">
                  <el-input
                    v-model="materialSearch"
                    placeholder="搜索素材"
                    class="material-search"
                  >
                    <template #prepend><el-icon><Search /></el-icon></template>
                  </el-input>
                  <div class="material-list">
                    <div
                      v-for="material in filteredMaterials"
                      :key="material.id"
                      class="material-item"
                    >
                      <el-checkbox :model-value="isMaterialSelected(tab, material.id)" @change="toggleMaterialSelection(tab, material)">
                        <div class="material-info">
                          <div class="material-name">{{ material.filename }}</div>
                          <div class="material-details">
                            <span class="file-size">{{ material.filesize }}MB</span>
                            <span class="upload-time">{{ material.upload_time }}</span>
                          </div>
                        </div>
                      </el-checkbox>
                    </div>
                    <!-- 空素材提示 -->
                    <div v-if="filteredMaterials.length === 0" class="empty-materials">
                      <el-empty description="暂无素材" />
                    </div>
                  </div>
                  <div class="material-actions">
                    <el-button type="primary" @click="confirmMaterialSelectionFromTab(tab)">
                      添加选中素材
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 已上传文件列表 -->
          <div v-else class="uploaded-files">
            <h4>已上传文件：</h4>
            <div class="file-list">
              <div v-for="(file, index) in tab.fileList" :key="index" class="file-item">
                <el-link :href="file.url" target="_blank" type="primary">{{ file.name }}</el-link>
                <span class="file-size">{{ (file.size / 1024 / 1024).toFixed(2) }}MB</span>
                <el-button type="danger" size="small" @click="removeFile(tab, index)">删除</el-button>
                <el-button type="primary" size="small" @click="tab.fileList = []">更换视频</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 账号选择 -->
        <div class="account-section">
          <h3>账号</h3>
          <div class="account-display">
            <div class="selected-accounts">
              <el-tag
                v-for="(account, index) in tab.selectedAccounts"
                :key="index"
                closable
                @close="removeAccount(tab, index)"
                class="account-tag"
              >
                {{ getAccountDisplayName(account) }}
              </el-tag>
            </div>
            <el-button
              type="primary"
              plain
              @click="openAccountDialog(tab)"
              class="select-account-btn"
            >
              选择账号
            </el-button>
          </div>
        </div>

        <!-- 平台选择 - 仅在选择账号后显示 -->
        <div class="platform-section" v-if="tab.selectedAccounts.length > 0">
          <h3>平台 <span class="selected-count">(已选 {{ tab.selectedPlatforms.length }})</span></h3>
          <el-checkbox-group v-model="tab.selectedPlatforms" class="platform-checkboxes">
            <el-checkbox
              v-for="platform in platforms.filter(p => isPlatformSelectable(tab, p.key))"
              :key="platform.key"
              :label="platform.key"
              class="platform-checkbox"
            >
              <span class="platform-name">{{ platform.name }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 草稿选项 (仅在视频号可见) -->
        <div v-if="tab.selectedPlatforms.includes(2)" class="draft-section">
          <el-checkbox
            v-model="tab.isDraft"
            label="视频号仅保存草稿(用手机发布)"
            class="draft-checkbox"
          />
        </div>

        <!-- 封面图 (仅在抖音可见) -->
        <div v-if="tab.selectedPlatforms.includes(3)" class="thumbnail-section">
          <h3>封面图</h3>
          <el-upload
            class="thumbnail-upload"
            :action="`${apiBaseUrl}/upload`"
            :show-file-list="false"
            :on-success="(res) => handleThumbnailSuccess(res, tab)"
            :before-upload="beforeThumbnailUpload"
            :headers="authHeaders"
            accept="image/*"
            style="margin-bottom: 20px;"
          >
            <div v-if="tab.thumbnailUrl" class="thumbnail-preview" style="position: relative; display: inline-block;">
                <img :src="tab.thumbnailUrl" class="thumbnail-img" style="max-width: 150px; max-height: 200px; border-radius: 4px;" />
                <div class="thumbnail-actions" style="position: absolute; top: 0; right: 0; padding: 5px;">
                    <el-button size="small" type="danger" circle @click.stop="removeThumbnail(tab)">
                        <el-icon><Delete /></el-icon>
                    </el-button>
                </div>
            </div>
            <el-button v-else type="primary" plain>
                 <el-icon><Upload /></el-icon> 上传封面
            </el-button>
          </el-upload>
        </div>

        <!-- 商品链接 (仅在抖音可见) -->
        <div v-if="tab.selectedPlatforms.includes(3)" class="product-section">
          <h3>商品链接</h3>
          <el-input
            v-model="tab.productTitle"
            type="text"
            :rows="1"
            placeholder="请输入商品名称"
            maxlength="200"
            class="product-name-input"
          />
          <el-input
            v-model="tab.productLink"
            type="text"
            :rows="1"
            placeholder="请输入商品链接"
            maxlength="200"
            class="product-link-input"
          />
        </div>

        <!-- 标题输入 -->
        <div class="title-section">
          <h3>标题</h3>
          <el-input
            v-model="tab.title"
            type="textarea"
            :rows="3"
            placeholder="请输入标题"
            maxlength="100"
            show-word-limit
            class="title-input"
          />
        </div>

        <!-- 话题输入 - 内联输入 -->
        <div class="topic-section">
          <h3>话题</h3>
          <div class="topic-inline-input">
            <div class="selected-topics">
              <el-tag
                v-for="(topic, index) in tab.selectedTopics"
                :key="index"
                closable
                @close="removeTopic(tab, index)"
                class="topic-tag"
              >
                #{{ topic }}
              </el-tag>
              <el-input
                v-model="tab.newTopic"
                class="topic-input-inline"
                placeholder="输入话题后按回车"
                size="small"
                @keyup.enter="addInlineTopic(tab)"
                style="width: 150px;"
              >
                <template #prefix>#</template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 高级设置 (折叠) -->
        <el-collapse class="advanced-settings">
          <el-collapse-item title="高级设置" name="advanced">
            <!-- 定时发布 -->
            <div class="schedule-section">
              <h4>定时发布</h4>
              <div class="schedule-controls">
                <el-switch
                  v-model="tab.scheduleEnabled"
                  active-text="定时发布"
                  inactive-text="立即发布"
                />
                <div v-if="tab.scheduleEnabled" class="schedule-settings">
                  <div class="schedule-row">
                    <span class="label">每天发布：</span>
                    <el-select v-model="tab.videosPerDay" placeholder="数量" style="width: 80px;">
                      <el-option v-for="num in [1, 2, 3, 5]" :key="num" :label="num" :value="num" />
                    </el-select>
                    <span class="unit">个视频</span>
                  </div>
                  <div class="schedule-row">
                    <span class="label">发布时间：</span>
                    <el-select v-model="tab.dailyTimes" placeholder="选择时间" multiple collapse-tags style="width: 200px;">
                      <el-option v-for="time in commonTimes" :key="time" :label="time" :value="time" />
                    </el-select>
                  </div>
                  <div class="schedule-row">
                    <span class="label">开始日期：</span>
                    <el-select v-model="tab.startDays" placeholder="选择" style="width: 120px;">
                      <el-option label="明天" :value="0" />
                      <el-option label="后天" :value="1" />
                      <el-option label="3天后" :value="2" />
                    </el-select>
                  </div>
                </div>
              </div>
            </div>

            <!-- 上传优先级 -->
            <div class="priority-section">
              <h4>上传优先级</h4>
              <el-select v-model="tab.priority" placeholder="选择优先级" style="width: 120px;">
                <el-option label="低" :value="0" />
                <el-option label="正常" :value="1" />
                <el-option label="高" :value="2" />
              </el-select>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button size="small" @click="cancelPublish(tab)">取消</el-button>
          <el-button
            size="small"
            type="primary"
            @click="confirmPublish(tab)"
            :loading="tab.publishing || false"
          >
            {{ tab.publishing ? '发布中...' : '发布' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 所有弹窗组件 -->
    <!-- 上传选项弹窗 -->
    <el-dialog
      v-model="uploadOptionsVisible"
      title="选择上传方式"
      width="400px"
      class="upload-options-dialog"
    >
      <div class="upload-options-content">
        <el-button type="primary" @click="selectLocalUpload" class="option-btn">
          <el-icon><Upload /></el-icon>
          本地上传
        </el-button>
        <el-button type="success" @click="selectMaterialLibrary" class="option-btn">
          <el-icon><Folder /></el-icon>
          素材库
        </el-button>
      </div>
    </el-dialog>

    <!-- 本地上传弹窗 -->
    <el-dialog
      v-model="localUploadVisible"
      title="本地上传"
      width="600px"
      class="local-upload-dialog"
    >
      <el-upload
        class="video-upload"
        drag
        :auto-upload="true"
        :action="`${apiBaseUrl}/upload`"
        :on-success="(response, file) => handleUploadSuccess(response, file, currentUploadTab)"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :on-change="handleFileChange"
        multiple
        accept="video/*,image/*"
        :headers="authHeaders"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持视频（.mp4、.mov、.avi等）和图片（.jpg、.png、.gif等）格式，可上传多个文件
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 素材库选择弹窗 -->
    <el-dialog
      v-model="materialLibraryVisible"
      title="选择素材"
      width="800px"
      class="material-library-dialog"
    >
      <div class="material-library-content">
        <el-checkbox-group v-model="selectedMaterials">
          <div class="material-list">
            <div
              v-for="material in materials"
              :key="material.id"
              class="material-item"
            >
              <el-checkbox :label="material.id" class="material-checkbox">
                <div class="material-info">
                  <div class="material-name">{{ material.filename }}</div>
                  <div class="material-details">
                    <span class="file-size">{{ material.filesize }}MB</span>
                    <span class="upload-time">{{ material.upload_time }}</span>
                  </div>
                </div>
              </el-checkbox>
            </div>
          </div>
        </el-checkbox-group>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="materialLibraryVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMaterialSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 账号选择弹窗 -->
    <el-dialog
      v-model="accountDialogVisible"
      title="选择账号"
      width="600px"
      class="account-dialog"
    >
      <div class="account-dialog-content">
        <!-- Group selector -->
        <div class="group-selector">
          <span class="label">选择分组：</span>
          <el-select
            v-model="selectedGroup"
            placeholder="请选择分组"
            @change="handleGroupChange"
            style="width: 200px;"
          >
            <el-option
              v-for="group in groupStore.groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </div>

        <!-- Account list from selected group -->
        <div v-if="selectedGroup" class="account-list">
          <el-checkbox-group v-model="tempSelectedAccounts">
            <el-checkbox
              v-for="account in groupAccounts"
              :key="account.id"
              :label="account.id"
              class="account-item"
            >
              <div class="account-info">
                <span class="account-name">{{ account.userName }}</span>
                <span class="account-platform">{{ getPlatformName(account.type) }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
          <el-empty v-if="groupAccounts.length === 0" description="该分组下没有有效账号" />
        </div>
        <el-empty v-else description="请先选择分组" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="accountDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAccountSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加话题弹窗 -->
    <el-dialog
      v-model="topicDialogVisible"
      title="添加话题"
      width="600px"
      class="topic-dialog"
    >
      <div class="topic-dialog-content">
        <!-- 自定义话题输入 -->
        <div class="custom-topic-input">
          <el-input
            v-model="customTopic"
            placeholder="输入自定义话题"
            class="custom-input"
          >
            <template #prepend>#</template>
          </el-input>
          <el-button type="primary" @click="addCustomTopic">添加</el-button>
        </div>

        <!-- 推荐话题 -->
        <div class="recommended-topics">
          <h4>推荐话题</h4>
          <div class="topic-grid">
            <el-button
              v-for="topic in recommendedTopics"
              :key="topic"
              :type="currentTab?.selectedTopics?.includes(topic) ? 'primary' : 'default'"
              @click="toggleRecommendedTopic(topic)"
              class="topic-btn"
            >
              {{ topic }}
            </el-button>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="topicDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmTopicSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务管理中心 -->
    <el-dialog
      v-model="taskCenterVisible"
      title="任务管理中心"
      width="1000px"
      class="task-center-dialog"
    >
      <div class="task-center-content">
        <!-- 任务筛选 -->
        <div class="task-filters">
          <el-select
            v-model="taskFilter"
            placeholder="筛选任务状态"
            size="small"
            class="task-filter-select"
          >
            <el-option label="全部" value="all" />
            <el-option label="等待中" value="waiting" />
            <el-option label="上传中" value="uploading" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>

          <el-input
            v-model="taskSearch"
            placeholder="搜索任务"
            size="small"
            class="task-search-input"
          >
            <template #prepend><el-icon><Search /></el-icon></template>
          </el-input>

          <div class="task-stats">
            <span class="stat-item">
              <span class="stat-label">总计:</span>
              <span class="stat-value">{{ allTasks.length }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">等待中:</span>
              <span class="stat-value waiting">{{ allTasks.filter(t => t.status === 'waiting').length }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">进行中:</span>
              <span class="stat-value processing">{{ allTasks.filter(t => ['uploading', 'processing'].includes(t.status)).length }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">已完成:</span>
              <span class="stat-value completed">{{ allTasks.filter(t => t.status === 'completed').length }}</span>
            </span>
            <span class="stat-item">
              <span class="stat-label">失败:</span>
              <span class="stat-value failed">{{ allTasks.filter(t => t.status === 'failed').length }}</span>
            </span>
          </div>
        </div>

        <!-- 任务列表 -->
        <div class="task-list">
          <el-table
            :data="filteredTasks"
            stripe
            style="width: 100%"
            class="task-table"
          >
            <el-table-column prop="id" label="任务ID" width="180" show-overflow-tooltip />
            <el-table-column label="任务名称" width="200" show-overflow-tooltip>
              <template #default="scope">
                {{ scope.row.title || '未命名任务' }}
              </template>
            </el-table-column>
            <el-table-column label="平台" width="150">
              <template #default="scope">
                <el-tag
                  v-for="platformKey in scope.row.selectedPlatforms"
                  :key="platformKey"
                  size="small"
                  class="platform-tag"
                >
                  {{ platforms.find(p => p.key === platformKey)?.name || platformKey }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="scope">
                <el-tag
                  :type="getTaskStatusType(scope.row.status)"
                  size="small"
                >
                  {{ getTaskStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="150">
              <template #default="scope">
                <el-progress
                  :percentage="scope.row.progress"
                  :stroke-width="6"
                />
              </template>
            </el-table-column>
            <el-table-column label="优先级" width="120">
              <template #default="scope">
                <el-tag
                  :type="scope.row.priority === 2 ? 'danger' : scope.row.priority === 1 ? 'primary' : 'info'"
                  size="small"
                >
                  {{ scope.row.priority === 2 ? '高' : scope.row.priority === 1 ? '正常' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="200" show-overflow-tooltip>
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button
                  v-if="['waiting', 'failed'].includes(scope.row.status)"
                  size="small"
                  type="primary"
                  @click="startTask(scope.row)"
                >
                  {{ scope.row.status === 'failed' ? '重试' : '开始' }}
                </el-button>
                <el-button
                  v-if="['uploading', 'processing'].includes(scope.row.status)"
                  size="small"
                  @click="pauseTask(scope.row)"
                >
                  暂停
                </el-button>
                <el-button
                  v-if="['waiting', 'uploading', 'processing', 'failed'].includes(scope.row.status)"
                  size="small"
                  type="danger"
                  @click="cancelTask(scope.row)"
                >
                  <el-icon><Delete /></el-icon>
                  取消
                </el-button>
                <el-button
                  size="small"
                  @click="showTaskDetails(scope.row)"
                >
                  <el-icon><InfoFilled /></el-icon>
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 空任务提示 -->
          <div v-if="allTasks.length === 0" class="empty-tasks">
            <el-empty description="暂无任务" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskCenterVisible = false">关闭</el-button>
          <el-button
            type="danger"
            @click="clearCompletedTasks"
          >
            清空已完成任务
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="taskDetailsVisible"
      title="任务详情"
      width="600px"
      class="task-details-dialog"
    >
      <div v-if="selectedTask" class="task-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务ID">{{ selectedTask.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.title || '未命名任务' }}</el-descriptions-item>
          <el-descriptions-item label="平台">
            <el-tag
              v-for="platformKey in selectedTask.selectedPlatforms"
              :key="platformKey"
              size="small"
              class="platform-tag"
            >
              {{ platforms.find(p => p.key === platformKey)?.name || platformKey }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="getTaskStatusType(selectedTask.status)"
              size="small"
            >
              {{ getTaskStatusText(selectedTask.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">{{ selectedTask.progress }}%</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag
              :type="selectedTask.priority === 2 ? 'danger' : selectedTask.priority === 1 ? 'primary' : 'info'"
              size="small"
            >
              {{ selectedTask.priority === 2 ? '高' : selectedTask.priority === 1 ? '正常' : '低' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedTask.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(selectedTask.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="taskDetailsVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { accountApi } from '@/api/account'
import { groupApi } from '@/api/group'
import { materialApi } from '@/api/material'
import { API_BASE_URL, MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_MB } from '@/core/config'
import { PLATFORM_LIST, getPlatformName } from '@/core/platformConstants'
import { useAccountStore } from '@/stores/account'
import { useAppStore } from '@/stores/app'
import { useGroupStore } from '@/stores/group'
import { useTaskStore } from '@/stores/task'
import { Close, Delete, Folder, Grid, InfoFilled, Management, Plus, Search, Upload, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

// API base URL
const apiBaseUrl = API_BASE_URL

// Authorization headers
const authHeaders = computed(() => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
}))

// 当前激活的tab
const activeTab = ref('tab1')

// tab计数器
let tabCounter = 1

// 获取应用状态管理
const appStore = useAppStore()

// 获取任务状态管理
const taskStore = useTaskStore()

// 上传相关状态
const uploadOptionsVisible = ref(false)
const localUploadVisible = ref(false)
const materialLibraryVisible = ref(false)
const currentUploadTab = ref(null)
const selectedMaterials = ref([])
const materials = computed(() => appStore.materials)
const materialSearch = ref('')

// 素材选择映射，按tab名称存储选中的素材ID
const materialSelections = ref({})

// 过滤后的素材列表
const filteredMaterials = computed(() => {
  if (!materialSearch.value) {
    return materials.value
  }
  return materials.value.filter(material =>
    material.filename.toLowerCase().includes(materialSearch.value.toLowerCase())
  )
})

// 账号相关状态
const accountDialogVisible = ref(false)
const tempSelectedAccounts = ref([])
const currentTab = ref(null)

// 获取账号状态管理
const accountStore = useAccountStore()
const groupStore = useGroupStore()

// Group selection state for account dialog
const selectedGroup = ref(null)
const groupAccounts = ref([])

// 话题相关状态
const topicDialogVisible = ref(false)
const customTopic = ref('')

// 任务管理相关状态
const taskCenterVisible = ref(false)
const taskDetailsVisible = ref(false)
const selectedTask = ref(null)
const allTasks = computed(() => taskStore.tasks)
const taskFilter = ref('all')
const taskSearch = ref('')

// 发布动画相关状态
const taskManagerBtnRef = ref(null)
const flyingCardVisible = ref(false)
const flyingCardStyle = ref({})
const taskArrivedFlash = ref(false)
const pendingTaskCount = computed(() => {
  return taskStore.tasks.filter(t => ['waiting', 'uploading', 'processing'].includes(t.status)).length
})


// 触发发布成功动画：卡片飞向任务管理按钮
const triggerPublishAnimation = async (sourceElement) => {
  if (!taskManagerBtnRef.value?.$el) return

  // 获取目标按钮位置
  const targetRect = taskManagerBtnRef.value.$el.getBoundingClientRect()

  // 获取源元素位置（表单的中心）
  let sourceRect
  if (sourceElement) {
    sourceRect = sourceElement.getBoundingClientRect()
  } else {
    // 默认从页面中心开始
    sourceRect = {
      left: window.innerWidth / 2 - 100,
      top: window.innerHeight / 2 - 50,
      width: 200,
      height: 100
    }
  }

  // 设置飞行卡片初始位置
  flyingCardStyle.value = {
    position: 'fixed',
    left: `${sourceRect.left + sourceRect.width / 2 - 60}px`,
    top: `${sourceRect.top + sourceRect.height / 2 - 25}px`,
    width: '120px',
    height: '50px',
    zIndex: 9999,
    '--target-x': `${targetRect.left - sourceRect.left}px`,
    '--target-y': `${targetRect.top - sourceRect.top}px`,
  }

  // 显示飞行卡片
  flyingCardVisible.value = true

  // 等待动画完成 (800ms)
  await new Promise(resolve => setTimeout(resolve, 800))

  // 隐藏飞行卡片
  flyingCardVisible.value = false

  // 触发按钮闪烁效果
  taskArrivedFlash.value = true
  setTimeout(() => {
    taskArrivedFlash.value = false
  }, 600)
}

// 组件初始化时获取账号数据和任务数据
onMounted(async () => {
  try {
    const res = await accountApi.getValidAccounts()
    if (res.code === 200 && res.data) {
      accountStore.setAccounts(res.data)
    }

    // 获取分组列表
    await groupStore.fetchGroups()

    // 获取任务列表，仅在有活跃任务时开启轮询
    await taskStore.fetchTasks()
    if (taskStore.hasActiveTasks()) {
      taskStore.startPolling()
    }

  } catch (error) {
    console.error('获取初始数据失败:', error)
    ElMessage.error('获取初始数据失败')
  }
})

onUnmounted(() => {
  taskStore.stopPolling()
})

// Platform list - use centralized constant
const platforms = PLATFORM_LIST

// 推荐话题列表
const recommendedTopics = [
  '游戏', '电影', '音乐', '美食', '旅行', '文化',
  '科技', '生活', '娱乐', '体育', '教育', '艺术',
  '健康', '时尚', '美妆', '摄影', '宠物', '汽车'
]

// 常用发布时间
const commonTimes = [
  '06:00', '07:00', '08:00', '09:00', '10:00',
  '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00'
]

// 默认tab初始化
const defaultTabInit = {
  name: 'tab1',
  label: '发布1',
  fileList: [], // 后端返回的文件名列表
  displayFileList: [], // 用于显示的文件列表
  selectedAccounts: [], // 选中的账号ID列表
  selectedPlatforms: [], // 选中的平台（多选）
  title: '',
  productLink: '', // 商品链接
  productTitle: '', // 商品名称
  thumbnail: '', // 视频封面（仅抖音）
  thumbnailUrl: '', // 封面预览URL
  selectedTopics: [], // 话题列表（不带#号）
  newTopic: '', // 新话题输入（内联输入用）
  scheduleEnabled: false, // 定时发布开关
  videosPerDay: 1, // 每天发布视频数量
  dailyTimes: ['10:00'], // 每天发布时间点列表
  startDays: 0, // 从今天开始计算的发布天数，0表示明天，1表示后天
  publishStatus: null, // 发布状态，包含message和type
  publishing: false, // 发布状态，用于控制按钮loading效果
  isDraft: false, // 是否保存为草稿，仅视频号平台可见
  priority: 1, // 上传优先级 (0: 低, 1: 正常, 2: 高)
  uploadTab: 'local' // 上传选项卡，默认本地上传
}

// 生成新tab
const makeNewTab = () => {
  return JSON.parse(JSON.stringify(defaultTabInit))
}

// tab页数据
const tabs = reactive([
  makeNewTab()
])

// 计算每个平台对应的可用账号数量
const getPlatformAccountCount = (tab, platformKey) => {
  if (!tab.selectedAccounts || tab.selectedAccounts.length === 0) {
    return 0
  }

  // Get platform name using centralized utility
  const platformName = getPlatformName(platformKey)
  if (!platformName) return 0

  return tab.selectedAccounts.filter(accountId => {
    const account = accountStore.accounts.find(acc => acc.id === accountId)
    return account && account.platform === platformName
  }).length
}

// 动态计算平台是否可选择
const isPlatformSelectable = (tab, platformKey) => {
  return getPlatformAccountCount(tab, platformKey) > 0
}

// 当账号选择变化时，自动更新平台选择
const updatePlatformSelection = (tab) => {
  // 获取所有可选择的平台
  const selectablePlatforms = platforms
    .filter(platform => isPlatformSelectable(tab, platform.key))
    .map(platform => platform.key)

  // 自动选中所有可选择的平台
  tab.selectedPlatforms = selectablePlatforms
}

// 过滤后的任务列表
const filteredTasks = computed(() => {
  let filtered = allTasks.value

  // 按状态过滤
  if (taskFilter.value !== 'all') {
    filtered = filtered.filter(task => task.status === taskFilter.value)
  }

  // 按搜索关键词过滤
  if (taskSearch.value) {
    const keyword = taskSearch.value.toLowerCase()
    filtered = filtered.filter(task =>
      task.title?.toLowerCase().includes(keyword) ||
      task.id?.toLowerCase().includes(keyword) ||
      task.selectedPlatforms.some(platform =>
        platforms.find(p => p.key === platform)?.name.toLowerCase().includes(keyword)
      )
    )
  }

  // 按优先级排序
  return filtered.sort((a, b) => b.priority - a.priority)
})

// 获取账号显示名称
const getAccountDisplayName = (accountId) => {
  const account = accountStore.accounts.find(acc => acc.id === accountId)
  return account ? account.name : accountId
}

// 文件类型和大小验证
const validateFileType = (file) => {
  const allowedVideoTypes = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.mkv', '.webm'];
  const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
  const allowedTypes = [...allowedVideoTypes, ...allowedImageTypes];

  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  const isAllowedType = allowedTypes.includes(fileExtension);

  if (!isAllowedType) {
    ElMessage.error(`文件类型不支持：${file.name}。仅支持视频（.mp4、.mov、.avi等）和图片（.jpg、.png、.gif等）格式。`);
    return false;
  }

  // 添加文件大小检查
  if (file.size > MAX_UPLOAD_SIZE) {
    ElMessage.error(`文件大小超过限制：${file.name}。最大允许上传${MAX_UPLOAD_SIZE_MB}MB的文件。`);
    return false;
  }

  return true;
};

// 文件选择变更（用于本地文件选择）
const handleFileChange = (file) => {
  // 验证文件类型
  validateFileType(file);
};

// 上传前验证
const beforeUpload = (file) => {
  return validateFileType(file);
};

// 处理文件上传成功
const handleUploadSuccess = (response, file, tab) => {
  if (response.code === 200) {
    // 使用原始文件名作为显示名称，避免UUID前缀导致的乱码
    const displayName = file.name
    // Backend returns data as string (filename with UUID prefix)
    // Handle both object format {path: "..."} and string format "..."
    const filePath = typeof response.data === 'string'
      ? response.data
      : (response.data?.path || response.data?.filename || '')

    const fileInfo = {
      name: displayName,
      url: materialApi.getMaterialPreviewUrl(filePath.split('/').pop()),
      path: filePath,
      size: file.size,
      type: file.type
    }

    tab.fileList.push(fileInfo)
    // 更新显示文件列表，确保显示的是原始文件名
    tab.displayFileList = [...tab.fileList.map(item => ({
      name: item.name,
      url: item.url
    }))]

    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

// 处理文件上传失败
const handleUploadError = (error) => {
  ElMessage.error('文件上传失败: ' + (error?.message || '未知错误'))
  console.error('上传错误:', error)
}

// 删除已上传文件
const removeFile = (tab, index) => {
  tab.fileList.splice(index, 1)
  tab.displayFileList = [...tab.fileList.map(item => ({
    name: item.name,
    url: item.url
  }))]
  ElMessage.success('文件删除成功')
}

// 添加新tab
const addTab = () => {
  tabCounter++
  const newTab = makeNewTab()
  newTab.name = `tab${tabCounter}`
  newTab.label = `发布${tabCounter}`
  tabs.push(newTab)
  activeTab.value = newTab.name
}

// 删除tab
const removeTab = (tabName) => {
  const index = tabs.findIndex(tab => tab.name === tabName)
  if (index > -1) {
    tabs.splice(index, 1)
    if (activeTab.value === tabName && tabs.length > 0) {
      activeTab.value = tabs[0].name
    }
  }
}

// 选择本地上传
const selectLocalUpload = () => {
  uploadOptionsVisible.value = false
  localUploadVisible.value = true
}

// 选择素材库
const selectMaterialLibrary = async () => {
  uploadOptionsVisible.value = false

  if (materials.value.length === 0) {
    try {
      const response = await materialApi.getAllMaterials()
      if (response.code === 200) {
        appStore.setMaterials(response.data)
      } else {
        ElMessage.error('获取素材列表失败')
        return
      }
    } catch (error) {
      console.error('获取素材列表出错:', error)
      ElMessage.error('获取素材列表失败')
      return
    }
  }

  selectedMaterials.value = []
  materialLibraryVisible.value = true
}

// 检查素材是否已选中
const isMaterialSelected = (tab, materialId) => {
  if (!materialSelections.value[tab.name]) {
    materialSelections.value[tab.name] = new Set()
  }
  return materialSelections.value[tab.name].has(materialId)
}

// 切换素材选择状态
const toggleMaterialSelection = (tab, material) => {
  if (!materialSelections.value[tab.name]) {
    materialSelections.value[tab.name] = new Set()
  }

  if (materialSelections.value[tab.name].has(material.id)) {
    materialSelections.value[tab.name].delete(material.id)
  } else {
    materialSelections.value[tab.name].add(material.id)
  }
}

// 从主界面确认素材选择
const confirmMaterialSelectionFromTab = (tab) => {
  const selections = materialSelections.value[tab.name] || new Set()

  if (selections.size === 0) {
    ElMessage.warning('请选择至少一个素材')
    return
  }

  // 添加选中的素材到tab的文件列表
  selections.forEach(materialId => {
    const material = materials.value.find(m => m.id === materialId)
    if (material) {
      const fileInfo = {
        name: material.filename,
        url: materialApi.getMaterialPreviewUrl(material.file_path.split('/').pop()),
        path: material.file_path,
        size: material.filesize * 1024 * 1024,
        type: 'video/mp4'
      }

      const exists = tab.fileList.some(file => file.path === fileInfo.path)
      if (!exists) {
        tab.fileList.push(fileInfo)
      }
    }
  })

  // 更新显示文件列表
  tab.displayFileList = [...tab.fileList.map(item => ({
    name: item.name,
    url: item.url
  }))]

  // 清空当前tab的素材选择
  materialSelections.value[tab.name] = new Set()

  ElMessage.success(`已添加 ${selections.size} 个素材`)
}

// 确认素材选择（对话框版本）
const confirmMaterialSelection = () => {
  if (selectedMaterials.value.length === 0) {
    ElMessage.warning('请选择至少一个素材')
    return
  }

  if (currentUploadTab.value) {
    selectedMaterials.value.forEach(materialId => {
      const material = materials.value.find(m => m.id === materialId)
      if (material) {
        // 直接使用material.filename作为显示名称，这是已存储的原始文件名
        const fileInfo = {
          name: material.filename,
          url: materialApi.getMaterialPreviewUrl(material.file_path.split('/').pop()),
          path: material.file_path,
          size: material.filesize * 1024 * 1024,
          type: 'video/mp4'
        }

        const exists = currentUploadTab.value.fileList.some(file => file.path === fileInfo.path)
        if (!exists) {
          currentUploadTab.value.fileList.push(fileInfo)
        }
      }
    })

    currentUploadTab.value.displayFileList = [...currentUploadTab.value.fileList.map(item => ({
      name: item.name,
      url: item.url
    }))]
  }

  ElMessage.success(`已添加 ${selectedMaterials.value.length} 个素材`)
  materialLibraryVisible.value = false
}

// 打开账号选择弹窗
const openAccountDialog = (tab) => {
  currentTab.value = tab
  tempSelectedAccounts.value = [...tab.selectedAccounts]
  selectedGroup.value = null
  groupAccounts.value = []
  accountDialogVisible.value = true
}

// Handle group selection change
const handleGroupChange = async (groupId) => {
  selectedGroup.value = groupId
  if (!groupId) {
    groupAccounts.value = []
    return
  }
  try {
    const res = await groupApi.getGroupAccounts(groupId)
    if (res.code === 200 && res.data) {
      // Filter only valid status accounts (status === 1)
      groupAccounts.value = res.data.filter(acc => acc.status === 1)
    }
  } catch (error) {
    console.error('获取分组账号失败:', error)
    groupAccounts.value = []
  }
}


// 确认账号选择
const confirmAccountSelection = () => {
  if (currentTab.value) {
    currentTab.value.selectedAccounts = [...tempSelectedAccounts.value]
    // 账号选择变化后，自动更新平台选择
    updatePlatformSelection(currentTab.value)
  }
  accountDialogVisible.value = false
  currentTab.value = null
  ElMessage.success('账号选择完成')
}

// 删除选中的账号
const removeAccount = (tab, index) => {
  tab.selectedAccounts.splice(index, 1)
}

// 添加自定义话题
const addCustomTopic = () => {
  if (!customTopic.value.trim()) {
    ElMessage.warning('请输入话题内容')
    return
  }
  if (currentTab.value && !currentTab.value.selectedTopics.includes(customTopic.value.trim())) {
    currentTab.value.selectedTopics.push(customTopic.value.trim())
    customTopic.value = ''
    ElMessage.success('话题添加成功')
  } else {
    ElMessage.warning('话题已存在')
  }
}

// 切换推荐话题
const toggleRecommendedTopic = (topic) => {
  if (!currentTab.value) return

  const index = currentTab.value.selectedTopics.indexOf(topic)
  if (index > -1) {
    currentTab.value.selectedTopics.splice(index, 1)
  } else {
    currentTab.value.selectedTopics.push(topic)
  }
}

// 确认添加话题
const confirmTopicSelection = () => {
  topicDialogVisible.value = false
  customTopic.value = ''
  currentTab.value = null
  ElMessage.success('添加话题完成')
}

// 删除话题
const removeTopic = (tab, index) => {
  tab.selectedTopics.splice(index, 1)
}

// 内联添加话题
const addInlineTopic = (tab) => {
  const topic = (tab.newTopic || '').trim()
  if (!topic) return

  if (!tab.selectedTopics.includes(topic)) {
    tab.selectedTopics.push(topic)
  }
  tab.newTopic = ''
}

// 处理封面上传成功
const handleThumbnailSuccess = (response, tab) => {
  if (response.code === 200) {
    const filePath = response.data.path || response.data
    tab.thumbnail = filePath
    tab.thumbnailUrl = materialApi.getMaterialPreviewUrl(filePath.split('/').pop())
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error('封面上传失败')
  }
}

// 封面上传前验证
const beforeThumbnailUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件!')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB!')
  return isImage && isLt5M
}

// 删除封面
const removeThumbnail = (tab) => {
  tab.thumbnail = ''
  tab.thumbnailUrl = ''
}

// 取消发布 (重置内容)
const cancelPublish = (tab) => {
  if (tab.publishing) return

  // 保留基本标识
  const { name, label } = tab

  // 重置为初始状态
  Object.assign(tab, JSON.parse(JSON.stringify(defaultTabInit)))

  // 恢复标识
  tab.name = name
  tab.label = label

  ElMessage.info('已重置发布内容')
}

// 确认发布
const confirmPublish = async (tab) => {
  if (tab.publishing) {
    return Promise.reject(new Error('正在发布中，请稍候...'))
  }

  tab.publishing = true

  // 数据验证
  if (tab.fileList.length === 0) {
    ElMessage.error('请先上传视频文件')
    tab.publishing = false
    return Promise.reject(new Error('请先上传视频文件'))
  }
  if (!tab.title.trim()) {
    ElMessage.error('请输入标题')
    tab.publishing = false
    return Promise.reject(new Error('请输入标题'))
  }
  if (tab.selectedPlatforms.length === 0) {
    ElMessage.error('请选择发布平台')
    tab.publishing = false
    return Promise.reject(new Error('请选择发布平台'))
  }
  if (tab.selectedAccounts.length === 0) {
    ElMessage.error('请选择发布账号')
    tab.publishing = false
    return Promise.reject(new Error('请选择发布账号'))
  }

  try {
    // 创建任务
    // 任务创建已移至后端，前端仅负责刷新
    // 移除手动创建任务和模拟进度代码

    // 为每个选中的平台发送发布请求
    const publishPromises = tab.selectedPlatforms.map(platform => {
      const publishData = {
        type: platform,
        title: tab.title,
        tags: tab.selectedTopics,
        fileList: tab.fileList.map(file => file.path),
        accountList: tab.selectedAccounts
          .filter(accountId => {
            const account = accountStore.accounts.find(acc => acc.id === accountId)
            // Filter accounts by platform: platform is key (1-5)
            // Account platform is stored as string name (e.g. "小红书")
            // So we need to match account.platform === PLATFORM_NAMES[platformKey]
            return account && account.platform === getPlatformName(platform)
          })
          .map(accountId => {
            const account = accountStore.accounts.find(acc => acc.id === accountId)
            return account ? account.filePath : accountId
          }),
        enableTimer: tab.scheduleEnabled ? 1 : 0,
        videosPerDay: tab.scheduleEnabled ? tab.videosPerDay || 1 : 1,
        dailyTimes: tab.scheduleEnabled ? tab.dailyTimes || ['10:00'] : ['10:00'],
        startDays: tab.scheduleEnabled ? tab.startDays || 0 : 0,
        category: 0,
        productLink: platform === 3 ? tab.productLink.trim() || '' : '',
        productTitle: platform === 3 ? tab.productTitle.trim() || '' : '',
        thumbnail: platform === 3 ? tab.thumbnail || '' : '',
        isDraft: platform === 2 ? tab.isDraft : false
      }

      return fetch(`${apiBaseUrl}/postVideo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.value
        },
        body: JSON.stringify(publishData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.code !== 200) {
          throw new Error(`平台 ${platform} 发布失败：${data.msg || '发布失败'}`)
        }
        return data
      })
    })

    // 等待所有发布请求完成
    const results = await Promise.all(publishPromises)

    // 立即刷新任务列表以获取最新的后端任务状态
    taskStore.fetchTasks()
    // 启动轮询以跟踪新任务状态
    taskStore.startPolling()

    // 检查发布结果
    const allSuccess = results.every(data => data.code === 200)
    if (allSuccess) {
      // 获取当前表单元素用于动画起点
      const tabContent = document.querySelector('.tab-content')

      // 触发飞向任务管理的动画
      await triggerPublishAnimation(tabContent)

      // 动画完成后重置表单（清空当前tab准备下一个任务）
      tab.fileList = []
      tab.displayFileList = []
      tab.selectedPlatforms = []
      tab.selectedAccounts = []
      tab.selectedTopics = []
      tab.title = ''
      tab.productLink = ''
      tab.productTitle = ''
      tab.publishStatus = null  // 清除状态消息

      // 显示简短成功提示
      ElMessage.success('任务已提交到任务管理器')
    } else {
      const successCount = results.filter(data => data.code === 200).length
      tab.publishStatus = {
        message: `发布结果：${successCount}个成功，${results.length - successCount}个失败`,
        type: 'warning'
      }
    }

    return Promise.resolve(results)
  } catch (error) {
    console.error('发布错误:', error)
    tab.publishStatus = {
      message: `发布失败：${error.message}`,
      type: 'error'
    }
    return Promise.reject(error)
  } finally {
    tab.publishing = false
  }
}

// 打开任务管理中心
const openTaskCenter = () => {
  taskCenterVisible.value = true
}

// 显示任务详情
const showTaskDetails = (task) => {
  selectedTask.value = task
  taskDetailsVisible.value = true
}

// 获取任务状态类型
const getTaskStatusType = (status) => {
  const typeMap = {
    waiting: 'info',
    uploading: 'primary',
    processing: 'primary',
    completed: 'success',
    failed: 'danger',
    cancelled: 'warning'
  }
  return typeMap[status] || 'info'
}

// 获取任务状态文本
const getTaskStatusText = (status) => {
  const textMap = {
    waiting: '等待中',
    uploading: '上传中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return textMap[status] || '未知'
}

// 开始任务
const startTask = async (task) => {
  try {
    const success = await taskStore.startTask(task.id)
    if (success) {
      ElMessage.success(`任务 ${task.title} 已开始`)
    } else {
      ElMessage.error('启动任务失败')
    }
  } catch (error) {
    console.error('启动任务出错:', error)
    ElMessage.error('启动任务出错')
  }
}

// 暂停任务
const pauseTask = (task) => {
  task.status = 'waiting'
  task.updatedAt = new Date().toISOString()
  ElMessage.info(`任务 ${task.title} 已暂停`)
}

// 取消任务（同步后端）
const cancelTask = async (task) => {
  const success = await taskStore.cancelTask(task.id)
  if (success) {
    ElMessage.warning(`任务 ${task.title} 已取消`)
  } else {
    ElMessage.error(`取消任务失败`)
  }
}

// 清空已完成任务（同步后端）
const clearCompletedTasks = async () => {
  const deletedCount = await taskStore.clearCompletedTasks()
  if (deletedCount > 0) {
    ElMessage.success(`已清空 ${deletedCount} 个已完成任务`)
  } else {
    ElMessage.info('没有可清空的任务')
  }
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style lang="scss" scoped>
.publish-center {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: #f5f7fa;

  // Tab管理区域
  .tab-management {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    padding: 15px 20px;

    .tab-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .tab-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;

        .tab-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: #f5f7fa;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            background-color: #ecf5ff;
            border-color: #b3d8ff;
          }

          &.active {
            background-color: #409eff;
            border-color: #409eff;
            color: #fff;

            .close-icon {
              color: #fff;
            }
          }

          .close-icon {
            cursor: pointer;
            padding: 2px;
            border-radius: 2px;
            transition: background-color 0.3s;

            &:hover {
              background-color: rgba(0, 0, 0, 0.1);
            }
          }
        }
      }

      .tab-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  // 内容区域
  .publish-content {
    flex: 1;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 20px;
    overflow-y: auto;

    .tab-content {
      .upload-section,
      .account-section,
      .platform-section,
      .title-section,
      .product-section,
      .topic-section,
      .schedule-section,
      .priority-section {
        margin-bottom: 30px;
      }

      h3 {
        margin-bottom: 15px;
        font-size: 16px;
        font-weight: 500;
      }

      // 平台选择样式
      .platform-section {
        .selected-count {
          font-size: 14px;
          color: #909399;
          font-weight: normal;
        }

        .platform-controls {
          margin-bottom: 15px;
          display: flex;
          gap: 10px;
        }

        .platform-checkboxes {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .platform-checkbox {
          margin-right: 0;
        }
      }

      // 上传优先级样式
      .priority-section {
        .priority-controls {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 10px;

          .label {
            min-width: 120px;
            font-weight: 500;
            color: #606266;
          }
        }
      }

      // 操作按钮样式
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ebeef5;
      }
    }
  }

  // 任务管理中心样式
  .task-center-dialog {
    .task-center-content {
      .task-filters {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #ebeef5;
        flex-wrap: wrap;

        .task-filter-select,
        .task-search-input {
          width: 200px;
        }

        .task-stats {
          display: flex;
          gap: 20px;
          margin-left: auto;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 5px;

            .stat-label {
              color: #606266;
            }

            .stat-value {
              font-weight: 500;

              &.waiting {
                color: #909399;
              }

              &.processing {
                color: #409eff;
              }

              &.completed {
                color: #67c23a;
              }

              &.failed {
                color: #f56c6c;
              }
            }
          }
        }
      }

      .task-list {
        max-height: 500px;
        overflow-y: auto;

        .platform-tag {
          margin-right: 5px;
          margin-bottom: 5px;
        }
      }
    }
  }

  // 弹窗样式
  .upload-options-dialog,
  .local-upload-dialog,
  .material-library-dialog,
  .account-dialog,
  .topic-dialog {
    .dialog-footer {
      text-align: right;
    }
  }

  // 话题弹窗样式
  .topic-dialog {
    .topic-dialog-content {
      .custom-topic-input {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;

        .custom-input {
          flex: 1;
        }
      }

      .recommended-topics {
        .topic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
        }
      }
    }
  }

  // 视频上传样式
  .video-upload {
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 200px;
    }
  }

  // 上传选项卡样式
  .upload-tabs {
    margin-bottom: 20px;

    .upload-tabs {
      margin-bottom: 15px;
    }

    .material-upload-section {
      .material-search {
        margin-bottom: 15px;
        width: 100%;
      }

      .material-list {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 15px;

        .material-item {
          padding: 10px;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .material-info {
            .material-name {
              font-weight: 500;
              margin-bottom: 5px;
            }

            .material-details {
              font-size: 12px;
              color: #909399;

              .file-size {
                margin-right: 15px;
              }
            }
          }
        }

        .empty-materials {
          text-align: center;
          padding: 40px 0;
        }
      }

      .material-actions {
        text-align: right;
      }
    }
  }

  // 平台选择引导样式
  .platform-guide {
    margin-bottom: 15px;
  }

  // 平台选择样式
  .platform-checkbox {
    margin-bottom: 10px;

    .platform-info {
      display: flex;
      align-items: center;

      .platform-name {
        margin-right: 10px;
      }

      .platform-account-count {
        font-size: 12px;
        color: #67c23a;
      }

      .platform-disabled {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  // 定时发布样式
  .schedule-section {
    .schedule-presets {
      display: flex;
      gap: 10px;
      margin-left: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;

      .el-button {
        padding: 5px 15px;

        &.active {
          background-color: #ecf5ff;
          color: #409eff;
        }
      }
    }

    .custom-schedule {
      margin-left: 10px;

      .schedule-row {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        gap: 10px;

        .label {
          min-width: 80px;
        }

        .unit {
          color: #909399;
        }

        .time-selector {
          display: flex;
          align-items: center;
          gap: 10px;

          .add-time-btn {
            padding: 5px 15px;
          }
        }
      }
    }
  }

  // Tab管理样式优化
  .tab-management {
    .tab-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;

      .tab-list-container {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }

      .tab-item {
        padding: 8px 16px;
        border-radius: 6px;

        &.batch-tab {
          background-color: #fdf6ec;
          border-color: #e6a23c;

          &.active {
            background-color: #e6a23c;
            border-color: #e6a23c;
            color: #fff;
          }
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      .tab-stats {
        font-size: 12px;
        color: #909399;
      }

      .tab-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .batch-publish-controls {
        display: flex;
        align-items: center;
      }
    }

    .batch-status {
      margin-top: 15px;

      .batch-status-text {
        text-align: center;
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
      }
    }
  }

  // 发布引导样式
  .publish-guide {
    margin-bottom: 20px;

    .guide-steps {
      margin-top: 10px;

      .step-item {
        margin-left: 20px;
        margin-bottom: 5px;
        position: relative;

        &:before {
          content: '';
          position: absolute;
          left: -20px;
          top: 8px;
          width: 8px;
          height: 8px;
          background-color: #67c23a;
          border-radius: 50%;
        }
      }
    }
  }

  // 智能提示样式
  .smart-tips {
    margin-bottom: 20px;
  }

  // 发布状态样式
  .publish-status {
    margin-bottom: 20px;
  }

  // 已上传文件样式
  .uploaded-files {
    margin-top: 15px;

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        background-color: #ecf5ff;
        border: 1px solid #b3d8ff;
        border-radius: 6px;

        .file-size {
          color: #606266;
          margin-right: auto;
          margin-left: 15px;
        }
      }
    }
  }

  // 账号选择弹窗样式
  .group-selector {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;

    .label {
      font-weight: 500;
    }
  }

  .account-list {
    max-height: 300px;
    overflow-y: auto;



    .account-item {
      display: block;
      padding: 10px;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .account-info {
        display: flex;
        align-items: center;
        gap: 10px;

        .account-name {
          font-weight: 500;
        }

        .account-platform {
          font-size: 12px;
          color: #909399;
          background-color: #f4f4f5;
          padding: 2px 8px;
          border-radius: 4px;
        }
      }
    }
  }

  // 账号选择样式
  .selected-accounts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  // 话题选择样式
  .selected-topics {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
}

// 飞行卡片动画样式
.flying-card {
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
  animation: flyToManager 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  pointer-events: none;

  .flying-card-content {
    display: flex;
    align-items: center;
    gap: 6px;
    color: white;
    font-weight: 500;
    font-size: 13px;
  }

  .flying-card-icon {
    font-size: 18px;
  }
}

@keyframes flyToManager {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(0.2) translate(var(--target-x), var(--target-y));
    opacity: 0;
  }
}

// 任务管理按钮徽章样式
.task-badge {
  margin-left: 6px;
  :deep(.el-badge__content) {
    font-size: 10px;
    padding: 0 4px;
    height: 16px;
    line-height: 16px;
  }
}

// 任务到达闪烁效果
.task-arrived {
  animation: taskArrivedPulse 0.6s ease-out;
}

@keyframes taskArrivedPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
    background-color: #66b1ff;
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>
