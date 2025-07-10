import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Globe,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import type { URLItem, CrawlResult, BrokenLink } from "../types";
import { apiService } from "../services/api";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const URLDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [url, setUrl] = useState<URLItem | null>(null);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [brokenLinks, setBrokenLinks] = useState<BrokenLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchURLDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const urlResponse = await apiService.getURL(parseInt(id));
        setUrl(urlResponse);

        if (urlResponse.result) {
          setResult(urlResponse.result);

          // Get additional results including broken links
          try {
            const resultsResponse = await apiService.getResults(parseInt(id));
            setResult(resultsResponse);
            setBrokenLinks(resultsResponse.broken_links || []);
          } catch (resultsError) {
            // If results endpoint fails, just use the basic result from URL
            console.warn("Failed to fetch detailed results:", resultsError);
          }
        }
      } catch (err) {
        console.error("Failed to fetch URL details:", err);
        setError("Failed to load URL details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchURLDetails();
  }, [id]);

  const handleRerun = async () => {
    if (!url) return;

    try {
      setRerunning(true);
      await apiService.rerunURL(url.id);

      // Refresh the data
      const urlResponse = await apiService.getURL(url.id);
      setUrl(urlResponse);
      setResult(urlResponse.result || null);
      setBrokenLinks([]);

      // If there are results, get detailed results including broken links
      if (urlResponse.result) {
        try {
          const resultsResponse = await apiService.getResults(url.id);
          setResult(resultsResponse);
          setBrokenLinks(resultsResponse.broken_links || []);
        } catch (resultsError) {
          console.warn("Failed to fetch detailed results:", resultsError);
        }
      }
    } catch (err) {
      console.error("Failed to rerun crawl:", err);
      setError("Failed to rerun crawl. Please try again.");
    } finally {
      setRerunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "running":
        return "text-blue-600 bg-blue-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "queued":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "running":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      case "queued":
        return <Clock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  // Chart data for link distribution
  const linkChartData = result
    ? {
        labels: ["Internal Links", "External Links", "Broken Links"],
        datasets: [
          {
            data: [
              result.internal_links,
              result.external_links,
              result.inaccessible_links,
            ],
            backgroundColor: [
              "#10B981", // green
              "#3B82F6", // blue
              "#EF4444", // red
            ],
            borderColor: ["#059669", "#2563EB", "#DC2626"],
            borderWidth: 1,
          },
        ],
      }
    : null;

  // Chart data for heading distribution
  const headingChartData = result
    ? {
        labels: ["H1", "H2", "H3", "H4", "H5", "H6"],
        datasets: [
          {
            label: "Heading Count",
            data: [
              result.h1_count,
              result.h2_count,
              result.h3_count,
              result.h4_count,
              result.h5_count,
              result.h6_count,
            ],
            backgroundColor: "#8B5CF6",
            borderColor: "#7C3AED",
            borderWidth: 1,
          },
        ],
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading URL details...</span>
        </div>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || "URL not found"}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900">URL Details</h1>
        </div>
        <button
          onClick={handleRerun}
          disabled={rerunning || url.status === "running"}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${rerunning ? "animate-spin" : ""}`} />
          <span>{rerunning ? "Rerunning..." : "Rerun Crawl"}</span>
        </button>
      </div>

      {/* URL Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-gray-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{url.url}</h2>
              <p className="text-sm text-gray-500">
                Created: {new Date(url.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  url.status
                )} md:px-3 md:py-1 md:text-sm`}
              >
                {getStatusIcon(url.status)}
                <span className="ml-1 capitalize md:ml-2">{url.status}</span>
              </span>
              <a
                href={url.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pl-2 text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            </div>
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Page Title</h3>
              <p className="text-sm text-gray-600">
                {result.title || "No title found"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">HTML Version</h3>
              <p className="text-sm text-gray-600">
                {result.html_version || "Unknown"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Login Form</h3>
              <p className="text-sm text-gray-600">
                {result.has_login_form ? "Present" : "Not found"}
              </p>
            </div>
          </div>
        )}
      </div>

      {result ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Link Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Link Distribution
            </h3>
            {linkChartData && (
              <div className="h-64">
                <Pie
                  data={linkChartData}
                  options={{ maintainAspectRatio: false }}
                />
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.internal_links}
                </div>
                <div className="text-gray-600">Internal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.external_links}
                </div>
                <div className="text-gray-600">External</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.inaccessible_links}
                </div>
                <div className="text-gray-600">Broken</div>
              </div>
            </div>
          </div>

          {/* Heading Distribution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Heading Distribution
            </h3>
            {headingChartData && (
              <div className="h-64">
                <Bar
                  data={headingChartData}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 1,
                        },
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>

          {/* Broken Links Table */}
          {brokenLinks.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Broken Links
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Error Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brokenLinks.map((link) => (
                      <tr key={link.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900 truncate max-w-md">
                              {link.url}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {link.status_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {link.error_message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Results Yet
          </h3>
          <p className="text-gray-600 mb-4">
            This URL hasn't been crawled yet or the crawl is still in progress.
          </p>
          <button
            onClick={handleRerun}
            disabled={rerunning || url.status === "running"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {url.status === "running" ? "Crawling..." : "Start Crawl"}
          </button>
        </div>
      )}
    </div>
  );
};
