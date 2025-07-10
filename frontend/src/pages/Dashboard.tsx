import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, RefreshCw, Trash2 } from "lucide-react";
import { URLTable } from "../components/URLTable";
import { AddURLModal } from "../components/AddURLModal";
import { useURLs } from "../hooks/useURLs";
import { usePolling } from "../hooks/usePolling";
// import { useToastContext } from '../hooks/useToastContext';
import type { TableSort, URLItem } from "../types";

export const Dashboard = () => {
  // const toast = useToastContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedURLs, setSelectedURLs] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<TableSort>({
    column: "created_at",
    direction: "desc",
  });

  const {
    urls,
    loading,
    error,
    pagination,
    refresh,
    deleteURL,
    bulkDelete,
    bulkRerun,
    startCrawling,
    stopCrawling,
  } = useURLs({
    search,
    status: statusFilter,
    page: currentPage,
    page_size: 10,
    sort_by: sort.column,
    sort_order: sort.direction,
  });

  // Check if there are any active crawls
  const hasActiveCrawls = useMemo(() => {
    return urls?.some(
      (url: URLItem) => url.status === "running" || url.status === "queued"
    ) || false;
  }, [urls]);

  // Use polling to update data when there are active crawls
  usePolling({
    enabled: hasActiveCrawls,
    interval: 5000, // Poll every 5 seconds
    onPoll: refresh,
  });

  const handleBulkDelete = async () => {
    if (selectedURLs.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedURLs.length} URL(s)?`
      )
    ) {
      try {
        await bulkDelete(selectedURLs);
        setSelectedURLs([]);
        // toast.success('URLs deleted successfully');
      } catch (error) {
        console.error("Bulk delete failed:", error);
        // toast.error('Failed to delete URLs', 'Please try again');
      }
    }
  };

  const handleBulkRerun = async () => {
    if (selectedURLs.length === 0) return;

    try {
      await bulkRerun(selectedURLs);
      setSelectedURLs([]);
      // toast.success('URLs queued for crawling');
    } catch (error) {
      console.error("Bulk rerun failed:", error);
      // toast.error('Failed to queue URLs for crawling', 'Please try again');
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (newSort: TableSort) => {
    setSort(newSort);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      console.error("Error loading URLs:", error);
      // toast.error('Failed to load URLs', error);
    }
  }, [error]);

  return (
    <div className=" bg-gray-200">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Web Crawler Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and analyze your website crawling tasks
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center hover:text-blue-500 cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add URL
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="card">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search URLs or titles..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative hover:border-blue-500 border-2 rounded-md ">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter || "all"}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="w-full input-field pl-10 pr-8 appearance-none bg-white cursor-pointer rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="queued">Queued</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-2">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="btn-secondary inline-flex items-center cursor-pointer hover:text-blue-500"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>

                {selectedURLs.length > 0 && (
                  <>
                    <button
                      onClick={handleBulkRerun}
                      className="btn-secondary inline-flex items-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rerun ({selectedURLs.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="btn-danger inline-flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedURLs.length})
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* URL Table */}
        <URLTable
          urls={urls}
          loading={loading}
          pagination={pagination}
          selectedURLs={selectedURLs}
          sort={sort}
          onSelectURLs={setSelectedURLs}
          onDeleteURL={deleteURL}
          onStartCrawling={startCrawling}
          onStopCrawling={stopCrawling}
          onPageChange={handlePageChange}
          onSort={handleSort}
        />

        {/* Add URL Modal */}
        <AddURLModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refresh();
          }}
        />
      </div>
    </div>
  );
};
