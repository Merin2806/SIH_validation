import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Plus,
  ArrowRight,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { fetchApplications, fetchMetrics } from '../api/client';
import { Application, QueueMetrics } from '../types';

interface ValidationQueueProps {
  searchQuery?: string;
}

export const ValidationQueue: React.FC<ValidationQueueProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_review' | 'anomalies' | 'expired'>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics>({
    in_queue: 128,
    clear_to_proceed: 74,
    needs_manual_review: 38,
    anomalies_flagged: 16,
    avg_validation_time: '42 sec per application'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, appsData] = await Promise.all([
        fetchMetrics().catch(() => metrics),
        fetchApplications({
          q: searchQuery,
          filter_status: activeFilter
        }).catch(() => ({ items: [], total: 0 }))
      ]);

      setMetrics(metricsData);
      if (appsData.items && appsData.items.length > 0) {
        setApplications(appsData.items);
      }
    } catch (err) {
      console.error("Failed to load queue data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Application ID,Institution,Category,Checks Passed,Overall Status,Submission Date"]
        .concat(applications.map(a => `${a.id},"${a.institution_name}","${a.category}",${a.checks_passed}/${a.checks_total},${a.overall_status},${a.submission_date}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `satyapan_validation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">Validation queue</h1>
          <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5">
            Applications awaiting preliminary scrutiny. Demo dataset — anonymised and synthetic.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#204a53] bg-white border border-[#cad9de] rounded-lg hover:bg-[#f6f9fa] shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-[#204a53]" />
            <span>Export report</span>
          </button>

          <button
            onClick={() => navigate('/new-validation')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#255e69] hover:bg-[#1d4d56] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New validation</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm">
          <p className="text-xs font-semibold text-[#53737c]">In queue</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#112d34]">{metrics.in_queue}</span>
          </div>
          <p className="text-[11px] text-[#6b8991] mt-1.5">applications this cycle</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm">
          <p className="text-xs font-semibold text-[#53737c]">Clear to proceed</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1c7b39]">{metrics.clear_to_proceed}</span>
          </div>
          <p className="text-[11px] text-[#6b8991] mt-1.5">all checks passed</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm">
          <p className="text-xs font-semibold text-[#53737c]">Needs manual review</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#175d78]">{metrics.needs_manual_review}</span>
          </div>
          <p className="text-[11px] text-[#6b8991] mt-1.5">missing, expired or pending source</p>
        </div>

        <div className="bg-[#1b353c] p-5 rounded-xl border border-[#14282d] shadow-sm text-white">
          <p className="text-xs font-semibold text-[#8bb7bf]">Anomalies flagged</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{metrics.anomalies_flagged}</span>
          </div>
          <p className="text-[11px] text-[#8bb7bf] mt-1.5">preliminary — human check required</p>
        </div>
      </div>

      {/* Validation Outcome Horizontal Progress Bar */}
      <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
          <span className="font-bold text-[#14323b] text-sm">Validation outcome</span>
          <span className="text-[#597881]">Average preliminary validation time · 42 sec per application</span>
        </div>

        {/* Bar */}
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: '58%' }} className="bg-[#2c7783] h-full" title="Clear: 74" />
          <div style={{ width: '30%' }} className="bg-[#8ec7d3] h-full" title="Needs review: 38" />
          <div style={{ width: '12%' }} className="bg-[#1b353c] h-full" title="Anomaly flagged: 16" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-[#2e5059] pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2c7783]" />
            <span>Clear · 74</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8ec7d3]" />
            <span>Needs review · 38</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1b353c]" />
            <span>Anomaly flagged · 16</span>
          </div>
        </div>
      </div>

      {/* Main Two Column Area: Table + Needs Your Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Table (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#e1eaed] shadow-sm overflow-hidden flex flex-col">
          {/* Filter Tabs */}
          <div className="p-4 border-b border-[#e5eff2] flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-[#14323b] mr-2">Applications</span>
            
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-[#255e69] text-white shadow-sm'
                  : 'bg-[#eef4f6] text-[#335963] hover:bg-[#e1ecf0]'
              }`}
            >
              All · 128
            </button>

            <button
              onClick={() => setActiveFilter('needs_review')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === 'needs_review'
                  ? 'bg-[#255e69] text-white shadow-sm'
                  : 'bg-[#eef4f6] text-[#335963] hover:bg-[#e1ecf0]'
              }`}
            >
              Needs review · 38
            </button>

            <button
              onClick={() => setActiveFilter('anomalies')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === 'anomalies'
                  ? 'bg-[#255e69] text-white shadow-sm'
                  : 'bg-[#eef4f6] text-[#335963] hover:bg-[#e1ecf0]'
              }`}
            >
              Anomalies · 16
            </button>

            <button
              onClick={() => setActiveFilter('expired')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === 'expired'
                  ? 'bg-[#255e69] text-white shadow-sm'
                  : 'bg-[#eef4f6] text-[#335963] hover:bg-[#e1ecf0]'
              }`}
            >
              Expired · 7
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e1eaed] bg-[#f8fafb] text-[11px] font-bold text-[#5c7a83] uppercase tracking-wider">
                  <th className="py-3 px-4">Application</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Checks Passed</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf3f5] text-xs">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/reviewer/${app.id}`)}
                    className="hover:bg-[#f6fafb] cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#185361] underline decoration-[#9ac4ce] group-hover:text-[#113d47]">
                      {app.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#14323b] leading-snug">{app.institution_name}</div>
                      <div className="text-[11px] text-[#60808a]">{app.category}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              app.checks_passed === app.checks_total
                                ? 'bg-[#258242]'
                                : app.checks_passed >= 9
                                ? 'bg-[#2c7783]'
                                : 'bg-[#c57f20]'
                            }`}
                            style={{ width: `${(app.checks_passed / (app.checks_total || 12)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-[#32525c]">
                          {app.checks_passed}/{app.checks_total}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.overall_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Needs Your Attention (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#e1eaed] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#edf3f5]">
            <h3 className="font-bold text-sm text-[#14323b]">Needs your attention</h3>
            <Link to="/alerts" className="text-xs font-semibold text-[#255e69] hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {/* Card 1 */}
            <div 
              onClick={() => navigate('/reviewer/EoA-2026-00418')}
              className="p-3 rounded-lg border border-[#f3d9db] bg-[#fdf5f5] hover:bg-[#fbeded] cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-[#b92636]">
                  ▲ Suspected anomaly
                </span>
                <span className="text-[#8e7477]">2 min</span>
              </div>
              <p className="text-xs font-bold text-[#203a40]">EoA-2026-00418 · Fire NOC</p>
              <p className="text-[11px] text-[#55696e] leading-relaxed">
                PDF metadata lists an image editor as creator.
              </p>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => navigate('/reviewer/EoA-2026-00418')}
              className="p-3 rounded-lg border border-[#f8ded6] bg-[#fff6f4] hover:bg-[#ffede9] cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-[#ba3e24]">
                  ✕ Expired document
                </span>
                <span className="text-[#8e7477]">2 min</span>
              </div>
              <p className="text-xs font-bold text-[#203a40]">EoA-2026-00418 · Fire NOC</p>
              <p className="text-[11px] text-[#55696e] leading-relaxed">
                Validity ended on 13 Mar 2024.
              </p>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => navigate('/reviewer/EoA-2026-00412')}
              className="p-3 rounded-lg border border-[#f6ebc9] bg-[#fffbee] hover:bg-[#fdf6de] cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-[#976800]">
                  ... Source pending
                </span>
                <span className="text-[#8e7477]">41 min</span>
              </div>
              <p className="text-xs font-bold text-[#203a40]">EoA-2026-00412 · Land document</p>
              <p className="text-[11px] text-[#55696e] leading-relaxed">
                Issuing portal timed out. Retry queued.
              </p>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => navigate('/reviewer/EoA-2026-00409')}
              className="p-3 rounded-lg border border-[#d2e3eb] bg-[#f2f7fa] hover:bg-[#e7eff3] cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-[#1b5d77]">
                  ! Missing information
                </span>
                <span className="text-[#8e7477]">1 h</span>
              </div>
              <p className="text-xs font-bold text-[#203a40]">EoA-2026-00409 · Affidavit</p>
              <p className="text-[11px] text-[#55696e] leading-relaxed">
                Signatory name and notary seal not detected.
              </p>
            </div>

            {/* Card 5 */}
            <div 
              onClick={() => navigate('/reviewer/EoA-2026-00409')}
              className="p-3 rounded-lg border border-[#f3d9db] bg-[#fdf5f5] hover:bg-[#fbeded] cursor-pointer transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 font-bold text-[#b92636]">
                  ▲ Duplicate
                </span>
                <span className="text-[#8e7477]">1 h</span>
              </div>
              <p className="text-xs font-bold text-[#203a40]">EoA-2026-00409 · Lab photographs</p>
              <p className="text-[11px] text-[#55696e] leading-relaxed">
                Two photographs match the same source image.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Statutory Disclaimer Banner */}
      <DisclaimerBanner />
    </div>
  );
};
