import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { PLATFORM_LIST, PLATFORM_TAG_TYPES } from '@/core/platformConstants';
import axios from '@/utils/request';

export const usePlatformStore = defineStore('platform', () => {
  const customExtensions = ref([]);

  async function fetchExtensions() {
    try {
      const res = await axios.get('/opencli/status');
      if (res.code === 200) {
        customExtensions.value = res.data.platforms || [];
      }
    } catch (err) {
      console.error('Failed to fetch extensions:', err);
    }
  }

  const allPlatforms = computed(() => {
    const list = [...PLATFORM_LIST];
    customExtensions.value.forEach(ext => {
      // Avoid duplicates if already in PLATFORM_LIST
      if (!list.some(p => p.key === ext.platform_id)) {
        list.push({
          key: ext.platform_id,
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
      types[ext.platform_id] = 'info'; // Default for extensions
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
