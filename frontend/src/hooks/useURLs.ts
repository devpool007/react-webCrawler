import { useState, useEffect, useCallback } from 'react';
import type { URLItem, PaginatedResponse } from '../types';
import { apiService } from '../services/api';

interface UseURLsOptions {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const useURLs = (options: UseURLsOptions = {}) => {
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginatedResponse<URLItem>>({
    data: [],
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  });

  const fetchURLs = useCallback(async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<URLItem> = await apiService.getURLs({
        page: options.page || 1,
        page_size: options.page_size || 10,
        search: options.search || '',
        status: options.status || '',
        sort_by: options.sort_by || 'created_at',
        sort_order: options.sort_order || 'desc',
      });

      setUrls(response.data);
      setPagination({
        data: response.data,
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        total_pages: response.total_pages,
      });
    } catch (error) {
      console.error('Failed to fetch URLs:', error);
      setUrls([]);
      setPagination({
        data: [],
        page: 1,
        page_size: 10,
        total: 0,
        total_pages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [options.page, options.page_size, options.search, options.status, options.sort_by, options.sort_order]);

  const refresh = useCallback(() => {
    fetchURLs();
  }, [fetchURLs]);

  const deleteURL = useCallback(async (id: number) => {
    try {
      await apiService.deleteURL(id);
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete URL:', error);
      throw error;
    }
  }, [fetchURLs]);

  const bulkDelete = useCallback(async (ids: number[]) => {
    try {
      await apiService.bulkDeleteURLs(ids);
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to bulk delete URLs:', error);
      throw error;
    }
  }, [fetchURLs]);

  const bulkRerun = useCallback(async (ids: number[]) => {
    try {
      await apiService.bulkRerunURLs(ids);
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to bulk rerun URLs:', error);
      throw error;
    }
  }, [fetchURLs]);

  const startCrawling = useCallback(async (id: number) => {
    try {
      await apiService.startCrawling(id);
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to start crawling:', error);
      throw error;
    }
  }, [fetchURLs]);

  const stopCrawling = useCallback(async (id: number) => {
    try {
      await apiService.stopCrawling(id);
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to stop crawling:', error);
      throw error;
    }
  }, [fetchURLs]);

  const addURL = useCallback(async (url: string) => {
    try {
      await apiService.createURL({ url });
      await fetchURLs(); // Refresh the list
    } catch (error) {
      console.error('Failed to add URL:', error);
      throw error;
    }
  }, [fetchURLs]);

  useEffect(() => {
    fetchURLs();
  }, [fetchURLs]);

  return {
    urls,
    loading,
    pagination,
    refresh,
    deleteURL,
    bulkDelete,
    bulkRerun,
    startCrawling,
    stopCrawling,
    addURL,
  };
};
