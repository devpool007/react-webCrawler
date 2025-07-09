import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddURLModal } from '../components/AddURLModal'
import { apiService } from '../services/api'
import type { SuccessResponse } from '../types'

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    createURL: vi.fn(),
  },
}))

describe('AddURLModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when isOpen is true', () => {
    render(<AddURLModal {...defaultProps} />)
    
    expect(screen.getByText('Add New URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Website URL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add URL' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('does not render modal when isOpen is false', () => {
    render(<AddURLModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('Add New URL')).not.toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddURLModal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<AddURLModal {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('validates URL input is required', async () => {
    const user = userEvent.setup()
    render(<AddURLModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    expect(submitButton).toBeDisabled()
    
    // Type and then clear the input
    const urlInput = screen.getByLabelText('Website URL')
    await user.type(urlInput, 'https://example.com')
    expect(submitButton).toBeEnabled()
    
    await user.clear(urlInput)
    expect(submitButton).toBeDisabled()
  })

  it('successfully submits valid URL', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    mockCreateURL.mockResolvedValueOnce({ message: 'URL created successfully', data: {} })
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateURL).toHaveBeenCalledWith({ url: 'https://example.com' })
      expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    
    // Create a promise that we can control
    let resolvePromise: (value: SuccessResponse) => void
    const promise = new Promise<SuccessResponse>((resolve) => {
      resolvePromise = resolve
    })
    mockCreateURL.mockReturnValueOnce(promise)
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)
    
    // Check loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adding.../i })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    
    // Resolve the promise
    resolvePromise!({ message: 'URL created successfully', data: {} })
    
    await waitFor(() => {
      expect(screen.queryByText('Adding...')).not.toBeInTheDocument()
    })
  })

  it('displays error message on API failure', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    mockCreateURL.mockRejectedValueOnce(new Error('API Error'))
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to add URL. Please check the URL and try again.')).toBeInTheDocument()
    })
    
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('trims whitespace from URL input', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    mockCreateURL.mockResolvedValueOnce({ message: 'URL created successfully', data: {} })
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    
    await user.type(urlInput, '  https://example.com  ')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockCreateURL).toHaveBeenCalledWith({ url: 'https://example.com' })
    })
  })

  it('clears form data on successful submission', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    mockCreateURL.mockResolvedValueOnce({ message: 'URL created successfully', data: {} })
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL') as HTMLInputElement
    
    await user.type(urlInput, 'https://example.com')
    expect(urlInput.value).toBe('https://example.com')
    
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(urlInput.value).toBe('')
    })
  })

  it('prevents closing modal during loading', async () => {
    const user = userEvent.setup()
    const mockCreateURL = vi.mocked(apiService.createURL)
    
    // Create a promise that we can control
    let resolvePromise: (value: SuccessResponse) => void
    const promise = new Promise<SuccessResponse>((resolve) => {
      resolvePromise = resolve
    })
    mockCreateURL.mockReturnValueOnce(promise)
    
    render(<AddURLModal {...defaultProps} />)
    
    const urlInput = screen.getByLabelText('Website URL')
    const submitButton = screen.getByRole('button', { name: 'Add URL' })
    
    await user.type(urlInput, 'https://example.com')
    await user.click(submitButton)
    
    // Try to close during loading
    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeDisabled()
    
    // Resolve the promise
    resolvePromise!({ message: 'URL created successfully', data: {} })
    
    await waitFor(() => {
      expect(closeButton).not.toBeDisabled()
    })
  })
})
