import { useState } from "react";
import { X } from "lucide-react";
import { apiService } from "../services/api";

interface AddURLModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddURLModal: React.FC<AddURLModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await apiService.createURL({ url: url.trim() });
      setUrl("");
      onSuccess();
    } catch {
      setError("Failed to add URL. Please check the URL and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUrl("");
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 align-middle max-w-lg w-full">
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New URL</h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-700 transition ease-in-out duration-150 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Website URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              disabled={isLoading}
              className="input-field md:w-sm p-1 rounded-md border-2 hover:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the complete URL including http:// or https://
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="btn-secondary hover:text-red-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className=" hover:text-blue-500 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner mr-2"></span>
                  Adding...
                </>
              ) : (
                "Add URL"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
