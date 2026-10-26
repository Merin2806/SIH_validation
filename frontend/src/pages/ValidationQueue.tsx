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
  AlertCircle,
  FileText,
  Building,
  TrendingUp,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { fetchApplications, fetchMetrics, fetchAlerts } from '../api/client';
import { Application, QueueMetrics, AlertItem } from '../types';

interface ValidationQueueProps {
  searchQuery?: string;
}

export const ValidationQueue: React.FC<ValidationQueueProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_review' | 'anomalies' | 'expired'>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [metrics, setMetrics] = useState<QueueMetrics>({
    in_queue: 128,
    clear_to_proceed: 74,
    needs_manual_review: 38,
    anomalies_flagged: 16,
    expired_documents: 7,
    avg_validation_time: '42 sec per application'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, appsData, alertsData] = await Promise.all([
        fetchMetrics().catch(() => metrics),
        fetchApplications({
          q: searchQuery,
          filter_status: activeFilter
        }).catch(() => ({ items: [], total: 0 })),
        fetchAlerts().catch(() => [])
      ]);

      setMetrics(metricsData);
      if (appsData.items) {
        setApplications(appsData.items);
      }
      if (alertsData) {
        setAlerts(alertsData.slice(0, 5));
      }
    } catch (err) {
      console.error("Failed to load queue data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    const link = document.createElement("a");
    link.href = "/api/applications/export";
    link.setAttribute("download", `satyapan_validation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inQueue = metrics.in_queue || 1;
  const clearPct = Math.round((metrics.clear_to_proceed / inQueue) * 100);
  const reviewPct = Math.round((metrics.needs_manual_review / inQueue) * 100);
  const anomalyPct = Math.max(0, 100 - clearPct - reviewPct);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF]">
              Scrutiny Cycle AY 2026-27
            </span>
            <span className="text-xs text-[#888A98]">· Live SQLite Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">Validation Queue</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-0.5">
            Technical institution applications awaiting AI-assisted preliminary scrutiny.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#171827] bg-white border border-[#E3E5EC] rounded-xl hover:bg-[#F7F8FC] hover:border-[#CDD0D8] shadow-2xs transition-all min-h-[42px]"
          >
            <Download className="w-4 h-4 text-[#6F3DFF]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigate('/new-validation')}
            className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#6F3DFF] hover:bg-[#5A2CE3] active:bg-[#4922C7] rounded-xl shadow-sm shadow-[#6F3DFF]/25 hover:shadow-md transition-all min-h-[42px]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Validation</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards - Expressive Distinct Treatments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ultraviolet Feature Card (In Queue) */}
        <div className="bg-gradient-to-br from-[#2D127A] via-[#431B9E] to-[#6F3DFF] text-white p-5 rounded-2xl border-2 border-[#865EFF] shadow-lg shadow-[#6F3DFF]/25 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#BFE9FF]/20 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-bold text-[#BFE9FF]">
            <span>Total In Queue</span>
            <span className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-[#BFE9FF] shadow-xs">
              <FileText className="w-4 h-4 stroke-[2.2]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{metrics.in_queue}</span>
            <span className="text-xs font-extrabold text-[#1E0B54] bg-[#BFE9FF] px-2 py-0.5 rounded-md shadow-xs">
              Active Dossiers
            </span>
          </div>
          <p className="text-[11px] text-[#E1D6FF] mt-1.5 font-medium">Under scrutiny across regional bureaus</p>
        </div>

        {/* Card 2: Glacier-Blue Information Card (Clear To Proceed) */}
        <div className="bg-gradient-to-br from-[#EAF8FF] via-[#D5F1FF] to-[#BFE9FF] text-[#171827] p-5 rounded-2xl border-2 border-[#70CCFF] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-bold text-[#0369A1]">
            <span>Clear to Proceed</span>
            <span className="w-8 h-8 rounded-xl bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#0369A1] tracking-tight">{metrics.clear_to_proceed}</span>
            <span className="text-xs font-extrabold text-[#166534] bg-[#EBF9F1] border border-[#86EFAC] px-2 py-0.5 rounded-md shadow-xs">
              {clearPct}%
            </span>
          </div>
          <p className="text-[11px] text-[#075985] mt-1.5 font-semibold">All 12 AICTE statutory checks passed</p>
        </div>

        {/* Card 3: Mineral-Grey Neutral Card (Needs Manual Review) */}
        <div className="bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1] text-[#171827] p-5 rounded-2xl border-2 border-[#94A3B8] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-bold text-[#334155]">
            <span>Needs Manual Review</span>
            <span className="w-8 h-8 rounded-xl bg-[#64748B] text-white flex items-center justify-center shadow-xs">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#1E293B] tracking-tight">{metrics.needs_manual_review}</span>
            <span className="text-xs font-extrabold text-[#92400E] bg-[#FEF3C7] border border-[#FCD34D] px-2 py-0.5 rounded-md shadow-xs">
              {reviewPct}%
            </span>
          </div>
          <p className="text-[11px] text-[#475569] mt-1.5 font-medium">Pending source queries or officer review</p>
        </div>

        {/* Card 4: Contrasting Anomaly Alert Card (Anomalies Flagged) */}
        <div className="bg-gradient-to-br from-[#1C0933] via-[#320E4B] to-[#480935] text-white p-5 rounded-2xl border-2 border-[#E11D48]/70 shadow-lg shadow-[#E11D48]/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#E11D48]/25 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-bold text-[#FCA5A5]">
            <span>Anomalies Flagged</span>
            <span className="w-8 h-8 rounded-xl bg-[#E11D48] text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{metrics.anomalies_flagged}</span>
            <span className="text-xs font-extrabold text-[#E11D48] bg-white px-2 py-0.5 rounded-md shadow-xs">
              {anomalyPct}%
            </span>
          </div>
          <p className="text-[11px] text-[#FEE2E2] mt-1.5 font-medium">High discrepancies requiring officer action</p>
        </div>
      </div>

      {/* Validation Outcome Horizontal Progress Bar - Glacier & Lavender Card */}
      <div className="bg-gradient-to-r from-[#F0EBFF] via-[#F8FBFF] to-[#EAF8FF] p-5 sm:p-6 rounded-2xl border-2 border-[#BFE9FF] shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
          <span className="font-extrabold text-[#171827] text-sm flex items-center gap-2">
            <span>Validation Outcome Distribution</span>
            <span className="text-[11px] font-bold text-[#6F3DFF] bg-white px-2 py-0.5 rounded-md border border-[#D5C2FF]">
              {metrics.in_queue} Total Applications
            </span>
          </span>
          <span className="text-xs font-semibold text-[#171827] bg-white px-3 py-1 rounded-xl border border-[#CBD5E1] shadow-2xs">
            Average Scrutiny Speed: <strong className="text-[#6F3DFF] font-black">{metrics.avg_validation_time}</strong>
          </span>
        </div>

        {/* Dynamic Multi-Segment Progress Bar */}
        <div className="h-3.5 w-full bg-white/90 rounded-full overflow-hidden flex shadow-inner border border-[#CBD5E1]">
          <div 
            style={{ width: `${clearPct}%` }} 
            className="bg-[#16A34A] h-full transition-all duration-500 ease-out" 
            title={`Clear: ${metrics.clear_to_proceed} (${clearPct}%)`} 
          />
          <div 
            style={{ width: `${reviewPct}%` }} 
            className="bg-[#0284C7] h-full transition-all duration-500 ease-out" 
            title={`Needs review: ${metrics.needs_manual_review} (${reviewPct}%)`} 
          />
          <div 
            style={{ width: `${anomalyPct}%` }} 
            className="bg-[#6F3DFF] h-full transition-all duration-500 ease-out" 
            title={`Anomaly flagged: ${metrics.anomalies_flagged} (${anomalyPct}%)`} 
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#171827] pt-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] ring-2 ring-white shadow-xs" />
            <span className="font-bold">Clear to proceed ({metrics.clear_to_proceed})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0284C7] ring-2 ring-white shadow-xs" />
            <span className="font-bold">Manual review ({metrics.needs_manual_review})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#6F3DFF] ring-2 ring-white shadow-xs" />
            <span className="font-bold">Anomalies flagged ({metrics.anomalies_flagged})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#E11D48] ring-2 ring-white shadow-xs" />
            <span className="font-bold">Expired documents ({metrics.expired_documents || 7})</span>
          </div>
        </div>
      </div>

      {/* Main Two Column Area: Table + Needs Your Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Applications Table (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border-2 border-[#CBD5E1] shadow-md overflow-hidden flex flex-col">
          {/* Filter Tabs Header */}
          <div className="p-4 border-b-2 border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#F0EBFF] via-[#F8FAFC] to-[#EAF8FF]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  activeFilter === 'all'
                    ? 'bg-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                    : 'bg-white text-[#484A54] border border-[#B7B7B7] hover:bg-[#BFE9FF]/30'
                }`}
              >
                All Applications ({metrics.in_queue})
              </button>

              <button
                onClick={() => setActiveFilter('needs_review')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  activeFilter === 'needs_review'
                    ? 'bg-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                    : 'bg-white text-[#484A54] border border-[#B7B7B7] hover:bg-[#BFE9FF]/30'
                }`}
              >
                Needs Review ({metrics.needs_manual_review})
              </button>

              <button
                onClick={() => setActiveFilter('anomalies')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  activeFilter === 'anomalies'
                    ? 'bg-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                    : 'bg-white text-[#484A54] border border-[#B7B7B7] hover:bg-[#BFE9FF]/30'
                }`}
              >
                Anomalies ({metrics.anomalies_flagged})
              </button>

              <button
                onClick={() => setActiveFilter('expired')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[36px] ${
                  activeFilter === 'expired'
                    ? 'bg-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                    : 'bg-white text-[#484A54] border border-[#B7B7B7] hover:bg-[#BFE9FF]/30'
                }`}
              >
                Expired ({metrics.expired_documents || 7})
              </button>
            </div>

            <span className="text-xs font-bold text-[#6F3DFF] bg-[#F0EBFF] px-2.5 py-1 rounded-lg border border-[#D5C2FF]">
              {applications.length} Records
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b-2 border-[#94D9FF] bg-[#BFE9FF]/60 text-[11px] font-extrabold text-[#171827] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Application ID</th>
                  <th className="py-3.5 px-4">Institution Name</th>
                  <th className="py-3.5 px-4">Checks Passed</th>
                  <th className="py-3.5 px-4">Scrutiny Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1] text-xs">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#686B7A] font-semibold">
                      No applications match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/reviewer/${app.id}`)}
                      className="even:bg-[#F8FAFC] hover:bg-[#EAF8FF] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-extrabold text-[#6F3DFF] group-hover:text-[#4922C7] transition-colors">
                        <span className="underline decoration-[#6F3DFF] underline-offset-2">
                          {app.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#171827] leading-snug group-hover:text-[#6F3DFF] transition-colors">
                          {app.institution_name}
                        </div>
                        <div className="text-[11px] text-[#686B7A] font-medium mt-0.5">{app.category}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-[#E2E8F0] h-2.5 rounded-full overflow-hidden border border-[#CBD5E1]">
                            <div
                              className={`h-full transition-all duration-300 ${
                                app.checks_passed === app.checks_total
                                  ? 'bg-[#16A34A]'
                                  : app.checks_passed >= 9
                                  ? 'bg-[#0284C7]'
                                  : 'bg-[#EAB308]'
                              }`}
                              style={{ width: `${(app.checks_passed / (app.checks_total || 12)) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#171827]">
                            {app.checks_passed}/{app.checks_total}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={app.overall_status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Needs Your Attention Panel (Live from backend alerts) */}
        <div className="lg:col-span-4 bg-gradient-to-b from-[#F0EBFF]/30 via-[#F8FAFC] to-[#EAF8FF]/40 rounded-2xl border-2 border-[#CBD5E1] shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#CBD5E1]">
            <div>
              <h3 className="font-extrabold text-sm text-[#171827]">Needs Your Attention</h3>
              <p className="text-[11px] text-[#686B7A] font-medium">High-priority validation flags</p>
            </div>
            <Link 
              to="/alerts" 
              className="text-xs font-extrabold text-[#6F3DFF] hover:text-[#4922C7] hover:underline flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#D5C2FF] shadow-2xs"
            >
              <span>View all ({alerts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-xs text-[#888A98] py-4 text-center">No active attention flags.</p>
            ) : (
              alerts.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigate(`/reviewer/${item.application_id}`)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 space-y-2 hover:shadow-md group ${
                    item.alert_type.includes('anomaly') || item.alert_type.includes('Duplicate')
                      ? 'border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                      : item.alert_type.includes('Expired')
                      ? 'border-[#FECDD3] bg-[#FFF1F2] hover:bg-[#FFE4E6]'
                      : item.alert_type.includes('Source')
                      ? 'border-[#FDE68A] bg-[#FFFBEB] hover:bg-[#FEF3C7]'
                      : 'border-[#BFE9FF] bg-[#EAF8FF] hover:bg-[#D5F1FF]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`inline-flex items-center gap-1 font-extrabold ${
                      item.alert_type.includes('anomaly') || item.alert_type.includes('Duplicate')
                        ? 'text-[#991B1B]'
                        : item.alert_type.includes('Expired')
                        ? 'text-[#BE123C]'
                        : item.alert_type.includes('Source')
                        ? 'text-[#92400E]'
                        : 'text-[#0369A1]'
                    }`}>
                      {item.alert_type.includes('anomaly') || item.alert_type.includes('Duplicate') ? '▲ ' :
                       item.alert_type.includes('Expired') ? '✕ ' :
                       item.alert_type.includes('Source') ? '⏳ ' : 'ℹ '}
                      {item.alert_type}
                    </span>
                    <span className="text-[#686B7A] text-[10px] font-bold">{item.time_ago}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-[#171827] group-hover:text-[#6F3DFF] transition-colors">
                      {item.application_id}
                    </p>
                    <span className="text-[11px] font-bold text-[#171827] bg-white px-2 py-0.5 rounded-md border border-[#CBD5E1] shadow-2xs">
                      {item.doc_type}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#334155] leading-relaxed line-clamp-2 font-medium">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Legal / Statutory Disclaimer Banner */}
      <DisclaimerBanner />
    </div>
  );
};
