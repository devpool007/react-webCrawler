import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useURLs } from '../hooks/useURLs'
import { apiService } from '../services/api'

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getURLs: vi.fn(),
    deleteURL: vi.fn(),
    startCrawling: vi.fn(),
    stopCrawling: vi.fn(),
    bulkDeleteURLs: vi.fn(),
    bulkRerunURLs: vi.fn(),
  },
}))

describe('useURLs Hook', () => {
  const mockGetURLs = vi.mocked(apiService.getURLs)
  const mockDeleteURL = vi.mocked(apiService.deleteURL)
  const mockStartCrawling = vi.mocked(apiService.startCrawling)
  const mockStopCrawling = vi.mocked(apiService.stopCrawling)
  const mockBulkDeleteURLs = vi.mocked(apiService.bulkDeleteURLs)
  const mockBulkRerunURLs = vi.mocked(apiService.bulkRerunURLs)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockPaginatedResponse = {
    data: [
      {
        id: 1,
        user_id: 1,
        url: 'https://example.com',
        status: 'completed' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        result: {
          id: 1,
          url_id: 1,
          title: 'Example Site',
          html_version: 'HTML5',
          h1_count: 1,
          h2_count: 2,
          h3_count: 3,
          h4_count: 0,
          h5_count: 0,
          h6_count: 0,
          internal_links: 10,
          external_links: 5,
          inaccessible_links: 2,
          has_login_form: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }
      }
    ],
    total: 1,
    page: 1,
    page_size: 10,
    total_pages: 1
  }

  it('should initialize with default values', () => {
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    const { result } = renderHook(() => useURLs({}))

    expect(result.current.urls).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should fetch URLs on mount', async () => {
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    const { result } = renderHook(() => useURLs({ page: 1, page_size: 10 }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetURLs).toHaveBeenCalledWith({
      page: 1,
      page_size: 10,
    })
    expect(result.current.urls).toEqual(mockPaginatedResponse.data)
    expect(result.current.pagination).toEqual({
      total: 1,
      page: 1,
      page_size: 10,
      total_pages: 1
    })
  })

  it('should handle API errors', async () => {
    const error = new Error('API Error')
    mockGetURLs.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch URLs')
    expect(result.current.urls).toEqual([])
  })

  it('should refresh URLs', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.refresh()

    expect(mockGetURLs).toHaveBeenCalledTimes(1)
  })

  it('should delete URL successfully', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)
    mockDeleteURL.mockResolvedValueOnce({ message: 'URL deleted', data: {} })

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh after delete
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.deleteURL(1)

    expect(mockDeleteURL).toHaveBeenCalledWith(1)
    expect(mockGetURLs).toHaveBeenCalledTimes(1) // Should refresh after delete
  })

  it('should start crawling successfully', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)
    mockStartCrawling.mockResolvedValueOnce({ message: 'Crawling started', data: {} })

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh after start
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.startCrawling(1)

    expect(mockStartCrawling).toHaveBeenCalledWith(1)
    expect(mockGetURLs).toHaveBeenCalledTimes(1) // Should refresh after start
  })

  it('should stop crawling successfully', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)
    mockStopCrawling.mockResolvedValueOnce({ message: 'Crawling stopped', data: {} })

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh after stop
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.stopCrawling(1)

    expect(mockStopCrawling).toHaveBeenCalledWith(1)
    expect(mockGetURLs).toHaveBeenCalledTimes(1) // Should refresh after stop
  })

  it('should bulk delete URLs successfully', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)
    mockBulkDeleteURLs.mockResolvedValueOnce({ message: 'URLs deleted', data: {} })

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh after bulk delete
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.bulkDelete([1, 2, 3])

    expect(mockBulkDeleteURLs).toHaveBeenCalledWith([1, 2, 3])
    expect(mockGetURLs).toHaveBeenCalledTimes(1) // Should refresh after bulk delete
  })

  it('should bulk rerun URLs successfully', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)
    mockBulkRerunURLs.mockResolvedValueOnce({ message: 'URLs rerun', data: {} })

    const { result } = renderHook(() => useURLs({}))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear the mock to test refresh after bulk rerun
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    await result.current.bulkRerun([1, 2, 3])

    expect(mockBulkRerunURLs).toHaveBeenCalledWith([1, 2, 3])
    expect(mockGetURLs).toHaveBeenCalledTimes(1) // Should refresh after bulk rerun
  })

  it('should refetch when params change', async () => {
    mockGetURLs.mockResolvedValue(mockPaginatedResponse)

    const { result, rerender } = renderHook(
      ({ search }) => useURLs({ search }),
      { initialProps: { search: 'test' } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockGetURLs).toHaveBeenCalledWith({ search: 'test' })

    // Clear the mock and change params
    mockGetURLs.mockClear()
    mockGetURLs.mockResolvedValueOnce(mockPaginatedResponse)

    rerender({ search: 'updated' })

    await waitFor(() => {
      expect(mockGetURLs).toHaveBeenCalledWith({ search: 'updated' })
    })
  })
})
