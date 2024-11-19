import GenerateReport from '@/components/GenerateReport';
import fs from 'fs';
import path from 'path';

interface Report {
  name: string;
  createdAt: string;
  url: string;
}

export default function Home() {
  // Get list of reports
  const reportsDir = path.join(process.cwd(), 'public', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  
  const reports: Report[] = fs.readdirSync(reportsDir)
    .filter(file => file.endsWith('.pdf'))
    .map(file => {
      const stats = fs.statSync(path.join(reportsDir, file));
      return {
        name: file,
        createdAt: stats.birthtime.toISOString(),
        url: `/reports/${file}`
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">TimeSwap Pool Reports</h1>
      
      <GenerateReport />

      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.name}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between text-black items-center">
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <p className="text-sm text-black">
                    Generated: {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 
                           transition-colors duration-200"
                >
                  View Report
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No reports generated yet.</p>
          <p className="text-sm text-black mt-2">
            Click &quot;Generate Now&quot; to create your first report.
          </p>
        </div>
      )}
    </main>
  );
}