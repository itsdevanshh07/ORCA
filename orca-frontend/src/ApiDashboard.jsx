import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, Legend } from 'recharts';
import { ArrowLeft, Search, Filter, ChevronDown, Check, MoreVertical, Zap } from 'lucide-react';

const generateData = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: `${time.getHours()}:00`,
      success: Math.floor(Math.random() * 50) + 10,
      errors: Math.floor(Math.random() * 5),
      latency: Math.floor(Math.random() * 200) + 50,
      latencyMethodA: Math.floor(Math.random() * 50) + 10,
      latencyMethodB: Math.floor(Math.random() * 100) + 20,
    });
  }
  return data;
};

const mockData = generateData();

const graphs = [
  { id: 'traffic', label: 'Traffic by response code' },
  { id: 'errors', label: 'Errors by API method' },
  { id: 'latency', label: 'Overall latency' },
  { id: 'latencyMethod', label: 'Latency by API method (median)' }
];

export default function ApiDashboard() {
  const [selectedGraphs, setSelectedGraphs] = useState(['traffic', 'errors', 'latency', 'latencyMethod']);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentHeals, setRecentHeals] = useState([]);

  React.useEffect(() => {
    const fetchData = () => {
      fetch('/api/orca/stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to fetch ORCA stats:', err));

      fetch('/api/orca/recent-heals')
        .then(res => res.json())
        .then(data => setRecentHeals(data))
        .catch(err => console.error('Failed to fetch ORCA heals:', err));
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleGraph = (id) => {
    if (selectedGraphs.includes(id)) {
      setSelectedGraphs(selectedGraphs.filter(g => g !== id));
    } else {
      setSelectedGraphs([...selectedGraphs, id]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Top Navigation Bar mimicking GCP */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="text-gray-600 font-semibold text-lg flex items-center gap-2">
            <span className="text-blue-600">ORCA</span> | API Dashboard
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="text-gray-500 flex items-center gap-2">
            <span className="bg-gray-100 px-2 py-1 rounded">My First Project</span>
          </div>
        </div>
        <div className="flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search (/) for resources, docs, products and more" 
              className="w-full bg-gray-100 border-none rounded px-8 py-1.5 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-gray-500">
          <span>O.R.C.A Recovery Mode</span>
        </div>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Sidebar */}
        <div className="w-56 bg-white border-r border-gray-200 py-4 flex flex-col pt-2 text-sm">
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer font-medium text-blue-600 border-l-4 border-blue-600 bg-blue-50">APIs and services</div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600">Library</div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600">Credentials</div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600">OAuth consent screen</div>
          <div className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600">Page usage agreements</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ArrowLeft className="h-5 w-5 text-gray-500 cursor-pointer" />
              <h1 className="text-xl font-normal text-gray-800">API/Service details</h1>
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <button className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm font-medium">Disable API</button>
              <button 
                onClick={() => fetch('/posts/1').catch(console.error)}
                className="bg-neon-blue/10 border border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Trigger Test Request
              </button>
            </div>
            <div className="text-sm text-gray-600 flex gap-4 cursor-pointer">
              <span className="hover:text-blue-600">1 hour</span>
              <span className="hover:text-blue-600">6 hours</span>
              <span className="hover:text-blue-600">12 hours</span>
              <span className="text-blue-600 border-b-2 border-blue-600 font-medium">1 day</span>
              <span className="hover:text-blue-600">2 days</span>
              <span className="hover:text-blue-600">7 days</span>
              <span className="hover:text-blue-600">30 days</span>
            </div>
          </div>

          <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
            {/* Live Stats Row */}
            {stats && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white border text-sm text-gray-500 border-gray-200 rounded p-4 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Gateway Status</span>
                  <span className="text-green-600 font-bold text-xl flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    {stats.status}
                  </span>
                </div>
                <div className="bg-white border text-sm text-gray-500 border-gray-200 rounded p-4 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Schemas Healed Today</span>
                  <span className="text-blue-600 font-bold text-2xl">{stats.healsToday}</span>
                </div>
                <div className="bg-white border text-sm text-gray-500 border-gray-200 rounded p-4 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">Avg Request Latency</span>
                  <span className="text-gray-800 font-bold text-2xl">{stats.avgLatency}</span>
                </div>
                <div className="bg-white border text-sm text-gray-500 border-gray-200 rounded p-4 shadow-sm flex flex-col justify-center">
                  <span className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1">AI Surgeon Model</span>
                  <span className="text-purple-600 font-bold text-lg bg-purple-50 px-2 py-1 rounded inline-block w-max">{stats.model}</span>
                </div>
              </div>
            )}
            {/* Filters Row */}
            <div className="flex items-start gap-6">
              {/* Custom Dropdown for Graphs */}
              <div className="relative">
                <label className="absolute -top-2.5 left-2 bg-white px-1 text-xs text-gray-500 z-10">Select graphs</label>
                <div 
                  className="border border-gray-300 rounded px-3 py-1.5 flex justify-between items-center w-64 cursor-pointer"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="text-sm">{selectedGraphs.length} Graphs</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow-lg z-20 py-2">
                    {graphs.map(g => (
                      <div 
                        key={g.id} 
                        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => toggleGraph(g.id)}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedGraphs.includes(g.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                          {selectedGraphs.includes(g.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {g.label}
                      </div>
                    ))}
                    <div className="border-t border-gray-100 mt-2 px-3 pt-2 pb-1 flex justify-end gap-3 text-sm">
                      <button className="text-blue-600 font-medium" onClick={() => setDropdownOpen(false)}>Cancel</button>
                      <button className="text-blue-600 font-medium" onClick={() => setDropdownOpen(false)}>OK</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-gray-600">Filters:</span>
                <div className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 flex items-center gap-2">
                  Credentials: Unspecified, Anonymous... <ChevronDown className="h-3 w-3" />
                </div>
                <div className="border border-gray-300 rounded px-3 py-1 text-sm text-gray-600 flex items-center gap-2">
                  Methods: 29 options selected <ChevronDown className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 space-y-6">
              
              {selectedGraphs.includes('traffic') && (
                <div className="bg-white border text-sm text-gray-500 border-gray-200 rounded p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Traffic by response code</h3>
                    <div className="flex gap-2">
                      <Filter className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e88e5" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1e88e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Area type="monotone" dataKey="success" stroke="#1e88e5" fillOpacity={1} fill="url(#colorSuccess)" name="200 OK" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedGraphs.includes('errors') && (
                <div className="bg-white border border-gray-200 rounded p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Errors by API method</h3>
                    <div className="flex gap-2 text-gray-500">
                      <Filter className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="errors" stroke="#e53935" strokeWidth={2} dot={false} name="4xx / 5xx Errors" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedGraphs.includes('latency') && (
                <div className="bg-white border border-gray-200 rounded p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Overall latency</h3>
                    <div className="flex gap-2 text-gray-500">
                      <Filter className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="latency" stroke="#fb8c00" strokeWidth={2} dot={false} name="Median Latency (ms)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {selectedGraphs.includes('latencyMethod') && (
                <div className="bg-white border border-gray-200 rounded p-4 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Latency by API method (median)</h3>
                    <div className="flex gap-2 text-gray-500">
                      <Filter className="h-4 w-4" />
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="h-64 min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="time" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Line type="monotone" dataKey="latencyMethodA" stroke="#8e24aa" strokeWidth={2} dot={false} name="GET /posts" />
                        <Line type="monotone" dataKey="latencyMethodB" stroke="#00acc1" strokeWidth={2} dot={false} name="POST /posts" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Live Recovery Logs */}
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm mb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="text-blue-600 border border-blue-200 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1.5"><Zap className="w-3 h-3"/> Live AI Healing Events</span>
              </h3>
              <div className="overflow-x-auto text-sm text-gray-600">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-2 px-4 font-medium text-gray-500">Timestamp</th>
                      <th className="py-2 px-4 font-medium text-gray-500">Endpoint</th>
                      <th className="py-2 px-4 font-medium text-gray-500">Drift Issue</th>
                      <th className="py-2 px-4 font-medium text-gray-500">Model</th>
                      <th className="py-2 px-4 font-medium text-gray-500 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHeals.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-400">No schema drifts detected today.</td>
                      </tr>
                    ) : (
                      recentHeals.map((heal, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-4">{heal.timestamp && heal.timestamp.split('.')[0]}</td>
                          <td className="py-2 px-4 font-mono text-xs">{heal.path}</td>
                          <td className="py-2 px-4 text-red-500">{heal.issue}</td>
                          <td className="py-2 px-4 font-medium text-purple-600"><span className="bg-purple-50 px-2 py-1 rounded">{heal.model}</span></td>
                          <td className="py-2 px-4 text-right">
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium text-xs flex items-center justify-end gap-1"><Check className="w-3 h-3" /> Healed</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
