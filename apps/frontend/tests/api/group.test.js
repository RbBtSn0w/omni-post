
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { groupApi } from '@/api/group'
import request from '@/utils/request'

// Mock request module
vi.mock('@/utils/request')

describe('Group API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const mockResponse = { code: 200, data: { id: 1, name: 'Test Group' } }

    it('should get all groups', async () => {
        request.get.mockResolvedValue(mockResponse)
        const res = await groupApi.getGroups()
        expect(request.get).toHaveBeenCalledWith('/getGroups')
        expect(res).toEqual(mockResponse)
    })

    it('should create group', async () => {
        request.post.mockResolvedValue(mockResponse)
        const data = { name: 'New Group' }
        const res = await groupApi.createGroup(data)
        expect(request.post).toHaveBeenCalledWith('/createGroup', data)
        expect(res).toEqual(mockResponse)
    })

    it('should update group', async () => {
        request.put.mockResolvedValue(mockResponse)
        const groupId = 1
        const data = { name: 'Updated Group' }
        const res = await groupApi.updateGroup(groupId, data)
        expect(request.put).toHaveBeenCalledWith(`/updateGroup/${groupId}`, data)
        expect(res).toEqual(mockResponse)
    })

    it('should delete group', async () => {
        request.delete.mockResolvedValue(mockResponse)
        const groupId = 1
        const res = await groupApi.deleteGroup(groupId)
        expect(request.delete).toHaveBeenCalledWith(`/deleteGroup/${groupId}`)
        expect(res).toEqual(mockResponse)
    })

    it('should get group accounts', async () => {
        request.get.mockResolvedValue(mockResponse)
        const groupId = 1
        const res = await groupApi.getGroupAccounts(groupId)
        expect(request.get).toHaveBeenCalledWith(`/getGroupAccounts/${groupId}`)
        expect(res).toEqual(mockResponse)
    })
})
