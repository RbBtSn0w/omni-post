import { describe, it, expect, vi, beforeEach } from 'vitest'
import { materialApi } from '@/api/material'
import { http } from '@/utils/request'

// Mock http工具函数
vi.mock('@/utils/request', () => ({
  http: {
    get: vi.fn(),
    upload: vi.fn()
  }
}))

// Mock import.meta.env
vi.stubEnv('VITE_API_BASE_URL', 'http://test-api.example.com')

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

  it('should test downloadMaterial with VITE_API_BASE_URL', () => {
    const url = materialApi.downloadMaterial('test-file.mp4')
    expect(url).toBe('http://test-api.example.com/download/test-file.mp4')
  })

  it('should test getMaterialPreviewUrl with VITE_API_BASE_URL', () => {
    const url = materialApi.getMaterialPreviewUrl('test-image.jpg')
    expect(url).toBe('http://test-api.example.com/getFile?filename=test-image.jpg')
  })

  it('should test downloadMaterial without VITE_API_BASE_URL', () => {
    // 清除环境变量，测试默认值
    vi.stubEnv('VITE_API_BASE_URL', '')
    
    const url = materialApi.downloadMaterial('test-file.mp4')
    expect(url).toBe('http://localhost:5409/download/test-file.mp4')
  })

  it('should test getMaterialPreviewUrl without VITE_API_BASE_URL', () => {
    // 清除环境变量，测试默认值
    vi.stubEnv('VITE_API_BASE_URL', '')
    
    const url = materialApi.getMaterialPreviewUrl('test-image.jpg')
    expect(url).toBe('http://localhost:5409/getFile?filename=test-image.jpg')
  })
})
