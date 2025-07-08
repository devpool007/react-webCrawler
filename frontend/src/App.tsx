import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Web Crawler Application
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Analyze websites and extract key information
          </p>
        </div>
        
        <div className="card max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Tailwind CSS Test
          </h2>
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="btn-primary w-full mb-4"
          >
            Count is {count}
          </button>
          <p className="text-gray-600 text-center">
            Tailwind CSS is working! 🎉
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              URL Management
            </h3>
            <p className="text-gray-600">
              Add URLs for analysis and manage crawling process
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Results Dashboard
            </h3>
            <p className="text-gray-600">
              View paginated, sortable results with filters
            </p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Detailed Analytics
            </h3>
            <p className="text-gray-600">
              Analyze links, headings, and page structure
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
