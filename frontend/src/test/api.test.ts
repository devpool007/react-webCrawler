import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiService } from '../services/api'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('ApiService Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Token Management', () => {
    it('should check if user is authenticated when token exists', () => {
      localStorageMock.getItem.mockReturnValue('valid-token')
      
      const result = apiService.isAuthenticated()
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
      expect(result).toBe(true)
    })

    it('should check if user is not authenticated when no token', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const result = apiService.isAuthenticated()
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
      expect(result).toBe(false)
    })

    it('should logout by removing token', () => {
      apiService.logout()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
    })
  })

  describe('URL Validation', () => {
    it('should validate URL parameters for getURLs', () => {
      const params = {
        page: 1,
        page_size: 10,
        search: 'test',
        status: 'completed'
      }

      // Test that the method exists and accepts the correct parameters
      expect(() => {
        // This would normally make an HTTP request, but we're just testing the interface
        const promise = apiService.getURLs(params)
        expect(promise).toBeDefined()
      }).not.toThrow()
    })

    it('should handle empty parameters for getURLs', () => {
      expect(() => {
        const promise = apiService.getURLs({})
        expect(promise).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Method Signatures', () => {
    it('should have all required authentication methods', () => {
      expect(typeof apiService.login).toBe('function')
      expect(typeof apiService.register).toBe('function')
      expect(typeof apiService.logout).toBe('function')
      expect(typeof apiService.isAuthenticated).toBe('function')
    })

    it('should have all required URL management methods', () => {
      expect(typeof apiService.getURLs).toBe('function')
      expect(typeof apiService.getURL).toBe('function')
      expect(typeof apiService.createURL).toBe('function')
      expect(typeof apiService.deleteURL).toBe('function')
      expect(typeof apiService.startCrawling).toBe('function')
      expect(typeof apiService.stopCrawling).toBe('function')
      expect(typeof apiService.getResults).toBe('function')
      expect(typeof apiService.rerunURL).toBe('function')
    })

    it('should have all required bulk operation methods', () => {
      expect(typeof apiService.bulkDeleteURLs).toBe('function')
      expect(typeof apiService.bulkRerunURLs).toBe('function')
    })
  })
})
