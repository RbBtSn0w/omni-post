import { http } from '@/utils/request'

export const capabilityApi = {
  getCapabilities() {
    return http.get('/capabilities')
  },
  publishByCapability(payload) {
    return http.post('/publish/capability', payload)
  }
}
