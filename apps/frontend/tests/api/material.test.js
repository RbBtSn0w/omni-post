import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http } from '@/utils/request'

// Mock http工具函数
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    upload: vi.fn()
  }
}))

// Mock config module with different API_BASE_URL values
vi.mock('@/core/config', () => ({
  API_BASE_URL: 'http://test-api.example.com',
  MAX_UPLOAD_SIZE: 500 * 1024 * 1024,
  MAX_UPLOAD_SIZE_MB: 500
}))

// Import materialApi dynamically to ensure mocks are applied first
import { materialApi } from '@/api/material'

describe('materialApi.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should test getAllMaterials', () => {
    materialApi.getAllMaterials()
    expect(http.get).toHaveBeenCalledWith('/getFiles')
  })

  it('should test uploadMaterial', () => {
    const formData = new FormData()
    const onUploadProgress = vi.fn()
    
    materialApi.uploadMaterial(formData, onUploadProgress)
    expect(http.upload).toHaveBeenCalledWith('/uploadSave', formData, onUploadProgress)
  })

  it('should test deleteMaterial', () => {
    materialApi.deleteMaterial(123)
    expect(http.get).toHaveBeenCalledWith('/deleteFile?id=123')
  })

  it('should test downloadMaterial', () => {
    const url = materialApi.downloadMaterial('test-file.mp4')
    expect(url).toBe('http://test-api.example.com/download/test-file.mp4')
  })

  it('should test getMaterialPreviewUrl', () => {
    const url = materialApi.getMaterialPreviewUrl('test-image.jpg')
    expect(url).toBe('http://test-api.example.com/getFile?filename=test-image.jpg')
  })
})
