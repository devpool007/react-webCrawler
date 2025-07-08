import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Square, 
  Trash2, 
  ExternalLink, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import type { URLItem, PaginatedResponse, TableSort } from '../types';

interface URLTableProps {
  urls: URLItem[];
  loading: boolean;
  pagination: PaginatedResponse<URLItem>;
  selectedURLs: number[];
  sort: TableSort;
  onSelectURLs: (ids: number[]) => void;
  onDeleteURL: (id: number) => Promise<void>;
  onStartCrawling: (id: number) => Promise<void>;
  onStopCrawling: (id: number) => Promise<void>;
  onSort: (sort: TableSort) => void;
  onPageChange: (page: number) => void;
}

export const URLTable: React.FC<URLTableProps> = ({
  urls,
  loading,
  pagination,
  selectedURLs,
  sort,
  onSelectURLs,
  onDeleteURL,
  onStartCrawling,
  onStopCrawling,
  onSort,
  onPageChange,
}) => {
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({});

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectURLs(urls.map(url => url.id));
    } else {
      onSelectURLs([]);
    }
  };

  const handleSelectURL = (id: number, checked: boolean) => {
    if (checked) {
      onSelectURLs([...selectedURLs, id]);
    } else {
      onSelectURLs(selectedURLs.filter(selectedId => selectedId !== id));
    }
  };

  const handleSort = (column: string) => {
    if (sort.column === column) {
      onSort({ column, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ column, direction: 'asc' });
    }
  };

  const handleAction = async (id: number, action: string, actionFn: () => Promise<void>) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    try {
      await actionFn();
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      queued: 'badge-secondary',
      running: 'badge-warning',
      completed: 'badge-success',
      failed: 'badge-error',
    };
    return badges[status as keyof typeof badges] || 'badge-secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSortIcon = (column: string) => {
    if (sort.column !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sort.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const isAllSelected = urls.length > 0 && selectedURLs.length === urls.length;
  const isIndeterminate = selectedURLs.length > 0 && selectedURLs.length < urls.length;

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="table-header">
            <tr>
              <th scope="col" className="relative px-6 py-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('url')}
              >
                <div className="flex items-center space-x-1">
                  <span>URL</span>
                  {getSortIcon('url')}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Links
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && urls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Loading...
                  </div>
                </td>
              </tr>
            ) : urls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No URLs found. Add your first URL to get started.
                </td>
              </tr>
            ) : (
              urls.map((url) => (
                <tr key={url.id} className="table-row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedURLs.includes(url.id)}
                      onChange={(e) => handleSelectURL(url.id, e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 flex items-center max-w-xs truncate"
                      >
                        {url.url}
                        <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${getStatusBadge(url.status)}`}>
                      {url.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {url.result?.title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {url.result ? (
                      <div className="text-xs">
                        <div>Internal: {url.result.internal_links}</div>
                        <div>External: {url.result.external_links}</div>
                        {url.result.inaccessible_links > 0 && (
                          <div className="text-red-600">
                            Broken: {url.result.inaccessible_links}
                          </div>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(url.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {url.result && (
                        <Link
                          to={`/urls/${url.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      
                      {url.status === 'running' ? (
                        <button
                          onClick={() => handleAction(url.id, 'stop', () => onStopCrawling(url.id))}
                          disabled={actionLoading[url.id] === 'stop'}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Stop Crawling"
                        >
                          {actionLoading[url.id] === 'stop' ? (
                            <div className="loading-spinner"></div>
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(url.id, 'start', () => onStartCrawling(url.id))}
                          disabled={actionLoading[url.id] === 'start'}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Start Crawling"
                        >
                          {actionLoading[url.id] === 'start' ? (
                            <div className="loading-spinner"></div>
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleAction(url.id, 'delete', () => onDeleteURL(url.id))}
                        disabled={actionLoading[url.id] === 'delete'}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Delete URL"
                      >
                        {actionLoading[url.id] === 'delete' ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.page_size, pagination.total)}
                </span> of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {[...Array(pagination.total_pages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => onPageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === i + 1
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
