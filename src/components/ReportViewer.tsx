'use client';
import { useEffect, useState } from 'react';

interface Report {
  name: string;
  createdAt: string;
  url: string;
}

export default function ReportViewer() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // Get all reports from the public/reports directory
    const fetchReports = async () => {
      const response = await fetch('/api/reports');
      const data = await response.json();
      setReports(data.reports);
    };

    fetchReports();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">TimeSwap Pool Reports</h1>
      
      {reports.length === 0 ? (
        <p className="text-gray-500">No reports generated yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.name}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="font-medium text-black">{report.name}</h3>
                <p className="text-sm text-black">
                  Generated on: {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <a
                href={report.url}
                download
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}