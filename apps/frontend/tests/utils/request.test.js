import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Use vi.hoisted to ensure the object exists before the mock factory runs
const requestInterceptors = vi.hoisted(() => ({
  request: null,
  requestError: null,
  response: null,
  responseError: null
}))

vi.mock('axios', () => {
  const mockInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn((success, error) => {
          requestInterceptors.request = success
          requestInterceptors.requestError = error
        })
      },
      response: {
        use: vi.fn((success, error) => {
          requestInterceptors.response = success
          requestInterceptors.responseError = error
        })
      }
    }
  }

  return {
    default: {
      create: vi.fn(() => mockInstance)
    }
  }
})

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn()
  }
}))

vi.mock('@/core/config', () => ({
  API_BASE_URL: 'http://test-api.example.com'
}))

// Import after mocks
import request, { http } from '@/utils/request'

describe('request.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Request Interceptor', () => {
    it('should add Authorization header if token exists', () => {
      const config = { headers: {} }
      const token = 'fake-token'

      // Mock directly on the instance, reliable in jsdom
      const getItemSpy = vi.spyOn(window.localStorage, 'getItem').mockReturnValue(token)

      const result = requestInterceptors.request(config)

      expect(result.headers.Authorization).toBe(`Bearer ${token}`)
      getItemSpy.mockRestore()
    })

    it('should not add Authorization header if no token', () => {
      const config = { headers: {} }

      const result = requestInterceptors.request(config)

      expect(result.headers.Authorization).toBeUndefined()
    })

    it('should reject on request error', async () => {
      const error = new Error('Request fail')

      await expect(requestInterceptors.requestError(error)).rejects.toThrow('Request fail')
      expect(console.error).toHaveBeenCalledWith('请求错误:', error)
    })
  })

  describe('Response Interceptor', () => {
    it('should return data directly if code is 200', () => {
      const response = { data: { code: 200, data: { id: 1 } } }
      const result = requestInterceptors.response(response)
      expect(result).toEqual({ code: 200, data: { id: 1 } })
    })

    it('should return data directly if success is true', () => {
      const response = { data: { success: true, payload: 'abc' } }
      const result = requestInterceptors.response(response)
      expect(result).toEqual({ success: true, payload: 'abc' })
    })

    it('should reject and show error if code is not 200 and success is false', async () => {
      const response = { data: { code: 500, message: 'Server error' } }

      await expect(requestInterceptors.response(response)).rejects.toThrow('Server error')
      expect(ElMessage.error).toHaveBeenCalledWith('Server error')
    })

    it('should use default error message if none provided', async () => {
      const response = { data: { code: 400 } }

      await expect(requestInterceptors.response(response)).rejects.toThrow('请求失败')
      expect(ElMessage.error).toHaveBeenCalledWith('请求失败')
    })
  })

  describe('Response Error Interceptor', () => {
    it('should handle 401', async () => {
      const error = { response: { status: 401 } }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('未授权，请重新登录')
    })

    it('should handle 403', async () => {
      const error = { response: { status: 403 } }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('拒绝访问')
    })

    it('should handle 404', async () => {
      const error = { response: { status: 404 } }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('请求地址不存在')
    })

    it('should handle 500', async () => {
      const error = { response: { status: 500 } }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('服务器内部错误')
    })

    it('should handle other status codes', async () => {
      const error = { response: { status: 502 } }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('网络错误')
    })

    it('should handle network connection failure (no response)', async () => {
      const error = { message: 'Network Error' }
      await expect(requestInterceptors.responseError(error)).rejects.toEqual(error)
      expect(ElMessage.error).toHaveBeenCalledWith('网络连接失败')
    })
  })

  describe('http utility', () => {
    it('get should call request.get', () => {
      http.get('/url', { a: 1 })
      expect(request.get).toHaveBeenCalledWith('/url', { params: { a: 1 } })
    })

    it('post should call request.post', () => {
      http.post('/url', { a: 1 }, { headers: {} })
      expect(request.post).toHaveBeenCalledWith('/url', { a: 1 }, { headers: {} })
    })

    it('put should call request.put', () => {
      http.put('/url', { a: 1 })
      expect(request.put).toHaveBeenCalledWith('/url', { a: 1 }, {})
    })

    it('patch should call request.patch', () => {
      http.patch('/url', { a: 1 })
      expect(request.patch).toHaveBeenCalledWith('/url', { a: 1 }, {})
    })

    it('delete should call request.delete', () => {
      http.delete('/url', { a: 1 })
      expect(request.delete).toHaveBeenCalledWith('/url', { params: { a: 1 } })
    })

    it('upload should call request.post with multipart/form-data', () => {
      const formData = new FormData()
      const onProgress = vi.fn()
      http.upload('/url', formData, onProgress)

      expect(request.post).toHaveBeenCalledWith(
        '/url',
        formData,
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: onProgress
        })
      )
    })
  })
})
