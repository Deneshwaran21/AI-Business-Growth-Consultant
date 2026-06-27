import React, { useState, useEffect } from 'react';
import Upload from './components/Upload';
import TrainingPanel from './components/TrainingPanel';
import PredictionPanel from './components/PredictionPanel';
import DashboardInsights from './components/DashboardInsights';
import { checkModel } from './api';
import { generateReport } from './utils/reportGenerator';

function App() {
  const [filePath, setFilePath] = useState(null);
  const [modelExists, setModelExists] = useState(false);
  
  // State for PDF report data
  const [reportData, setReportData] = useState({
    insights: null,
    predictions: null,
    strategies: null,
  });

  useEffect(() => {
    checkModel().then(res => setModelExists(res.data.exists)).catch(() => {});
  }, []);

  const handleDownloadReport = () => {
    if (!reportData.insights && !reportData.predictions && !reportData.strategies) {
      alert('No data available. Please run Predictions, Strategy, and Insights first.');
      return;
    }
    generateReport(reportData.insights, reportData.predictions, reportData.strategies);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="gradient-header shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Growth Consultant</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 📄 Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>📄</span> Download Report
            </button>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${modelExists ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${modelExists ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
              {modelExists ? 'Model Ready' : 'No Model'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">📂</span> Data Upload
              </h2>
              <Upload onUploadSuccess={(path) => setFilePath(path)} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">⚙️</span> Training
              </h2>
              <TrainingPanel filePath={filePath} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">🔮</span> Predictions & Strategy
              </h2>
              <PredictionPanel onDataUpdate={(data) => setReportData(prev => ({ ...prev, ...data }))} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="mr-2">📊</span> Insights
              </h2>
              <DashboardInsights onDataUpdate={(insights) => setReportData(prev => ({ ...prev, insights }))} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;