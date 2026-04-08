import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PLATFORM_LIST, PLATFORM_TAG_TYPES } from '@/core/platformConstants';
import axios from '@/utils/request';
import { ElMessage } from 'element-plus';

export const usePlatformStore = defineStore('platform', () => {
  const customExtensions = ref([]);

  async function fetchExtensions() {
    try {
      const res = await axios.get('/opencli/status');
      // Interceptor guarantees success here
      customExtensions.value = res.data?.platforms || [];
    } catch (err) {
      console.error('Failed to fetch extensions:', err);
      // The axios interceptor already rejects with Error(data.message) for business errors
      ElMessage.error(err.message || '无法连接到扩展服务，请检查网络或后端状态');
    }
  }

  const allPlatforms = computed(() => {
    const list = [...PLATFORM_LIST];
    customExtensions.value.forEach(ext => {
      // Avoid duplicates if already in PLATFORM_LIST. Normalize to number for safe comparison.
      const platformId = Number(ext.platform_id);
      if (!list.some(p => Number(p.key) === platformId)) {
        list.push({
          key: platformId,
          name: ext.name,
          isExtension: true
        });
      }
    });
    return list;
  });

  const platformTagTypes = computed(() => {
    const types = { ...PLATFORM_TAG_TYPES };
    customExtensions.value.forEach(ext => {
      types[Number(ext.platform_id)] = 'info'; // Default for extensions
    });
    return types;
  });

  return {
    customExtensions,
    fetchExtensions,
    allPlatforms,
    platformTagTypes
  };
});
