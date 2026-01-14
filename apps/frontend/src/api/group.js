/**
 * 账号组 API
 */
import request from '@/utils/request'

export const groupApi = {
    /**
     * 获取所有账号组
     */
    getGroups() {
        return request.get('/getGroups')
    },

    /**
     * 创建账号组
     * @param {Object} data - { name: string, description?: string }
     */
    createGroup(data) {
        return request.post('/createGroup', data)
    },

    /**
     * 更新账号组
     * @param {number} groupId - 组ID
     * @param {Object} data - { name: string, description?: string }
     */
    updateGroup(groupId, data) {
        return request.put(`/updateGroup/${groupId}`, data)
    },

    /**
     * 删除账号组
     * @param {number} groupId - 组ID
     */
    deleteGroup(groupId) {
        return request.delete(`/deleteGroup/${groupId}`)
    },

    /**
     * 获取组内所有账号
     * @param {number} groupId - 组ID
     */
    getGroupAccounts(groupId) {
        return request.get(`/getGroupAccounts/${groupId}`)
    }
}
