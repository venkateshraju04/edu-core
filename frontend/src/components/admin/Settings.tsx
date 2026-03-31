import Sidebar from '../Sidebar';
import Header from '../Header';
import { Download, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-16 min-h-screen bg-slate-50">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-slate-800 mb-2">Settings & Support</h1>
              <p className="text-slate-600">System information and help resources</p>
            </div>

            <div className="space-y-6">
              {/* System Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-slate-800">System Information</h2>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Application Name</p>
                    <p className="text-slate-800">EduCore School Management</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Version</p>
                    <p className="text-slate-800">v2.5.1</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Last Updated</p>
                    <p className="text-slate-800">December 1, 2024</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">License Type</p>
                    <p className="text-slate-800">Professional Edition</p>
                  </div>
                </div>
              </div>

              {/* Training Resources */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-slate-800 mb-4">Training & Documentation</h2>
                <div className="space-y-3">
                  {[
                    'Administrator User Guide',
                    'Teacher Portal Manual',
                    'Principal Dashboard Guide',
                    'Fee Management Tutorial',
                    'Student Records Management'
                  ].map((item, index) => (
                    <button
                      key={index}
                      className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-600" />
                        <span className="text-slate-800">{item}</span>
                      </div>
                      <span className="text-slate-500 text-sm">PDF</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}