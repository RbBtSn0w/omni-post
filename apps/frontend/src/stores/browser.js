import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useBrowserStore = defineStore('browser', () => {
  const profiles = ref([])
  const loading = ref(false)

  const fetchProfiles = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/browser/profiles')
      profiles.value = response.data
    } catch (error) {
      console.error('Failed to fetch browser profiles:', error)
    } finally {
      loading.value = false
    }
  }

  const createProfile = async (profileData) => {
    try {
      const response = await axios.post('/api/browser/profiles', profileData)
      await fetchProfiles()
      return response.data.id
    } catch (error) {
      console.error('Failed to create browser profile:', error)
      throw error
    }
  }

  const updateProfile = async (id, profileData) => {
    try {
      await axios.put(`/api/browser/profiles/${id}`, profileData)
      await fetchProfiles()
    } catch (error) {
      console.error('Failed to update browser profile:', error)
      throw error
    }
  }

  const deleteProfile = async (id) => {
    try {
      await axios.delete(`/api/browser/profiles/${id}`)
      await fetchProfiles()
    } catch (error) {
      console.error('Failed to delete browser profile:', error)
      throw error
    }
  }

  return {
    profiles,
    loading,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile
  }
})
