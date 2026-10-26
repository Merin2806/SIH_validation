import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, X, ArrowRight, Filter, AlertCircle, ShieldAlert, ChevronRight } from 'lucide-react';
import { fetchAlerts } from '../api/client';
import { AlertItem } from '../types';

export const Alerts: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [filterType]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchAlerts(filterType);
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { label: 'All Alerts', value: 'all' },
    { label: 'Suspected Anomaly', value: 'suspected_anomaly' },
    { label: 'Expired Document', value: 'expired_document' },
    { label: 'Source Pending', value: 'source_pending' },
    { label: 'Missing Information', value: 'missing_information' },
    { label: 'Duplicate', value: 'duplicate' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Active Alerts Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF]">
              Operational Monitoring
            </span>
            <span className="text-xs text-[#888A98]">· Real-time Flags</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">Alerts Centre</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-1">
            Active scrutiny attention flags and potential regulatory discrepancies requiring officer review.
          </p>
        </div>

        <span className="px-4 py-2 bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] text-white rounded-xl text-xs font-black self-start sm:self-auto flex items-center gap-2 shadow-md shadow-[#6F3DFF]/25">
          <Bell className="w-4 h-4 stroke-[2.5]" />
          <span>{alerts.length} Active Flags</span>
        </span>
      </div>

      {/* 3 Metric Cards for Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#2D127A] to-[#6F3DFF] text-white p-4.5 rounded-2xl border-2 border-[#865EFF] shadow-md">
          <span className="text-xs font-bold text-[#BFE9FF]">Total Attention Flags</span>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-white">{alerts.length}</p>
          <span className="text-[11px] text-[#E1D6FF]">Require scrutiny officer verification</span>
        </div>

        <div className="bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] text-[#991B1B] p-4.5 rounded-2xl border-2 border-[#FECACA] shadow-xs">
          <span className="text-xs font-bold text-[#991B1B]">Suspected Anomalies</span>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-[#DC2626]">
            {alerts.filter(a => a.alert_type.includes('anomaly') || a.alert_type.includes('Duplicate')).length}
          </p>
          <span className="text-[11px] text-[#991B1B]/80 font-medium">Critical parameter mismatches</span>
        </div>

        <div className="bg-gradient-to-br from-[#FFF1F2] to-[#FFE4E6] text-[#BE123C] p-4.5 rounded-2xl border-2 border-[#FECDD3] shadow-xs">
          <span className="text-xs font-bold text-[#BE123C]">Expired Certificates</span>
          <p className="text-2xl sm:text-3xl font-black mt-1 text-[#E11D48]">
            {alerts.filter(a => a.alert_type.includes('Expired')).length}
          </p>
          <span className="text-[11px] text-[#BE123C]/80 font-medium">Validity past statutory cut-off</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
              filterType === t.value
                ? 'bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                : 'bg-white text-[#484A54] border-2 border-[#CBD5E1] hover:border-[#6F3DFF] hover:bg-[#BFE9FF]/30'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alerts Cards List */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => navigate(`/reviewer/${alert.application_id}`)}
            className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm hover:shadow-md ${
              alert.alert_type.includes('anomaly') || alert.alert_type.includes('Duplicate')
                ? 'bg-gradient-to-r from-[#FEF2F2] to-white border-[#FECACA] hover:border-[#DC2626]'
                : alert.alert_type.includes('Expired')
                ? 'bg-gradient-to-r from-[#FFF1F2] to-white border-[#FECDD3] hover:border-[#E11D48]'
                : alert.alert_type.includes('Source')
                ? 'bg-gradient-to-r from-[#FFFBEB] to-white border-[#FDE68A] hover:border-[#D97706]'
                : 'bg-gradient-to-r from-[#EAF8FF] to-white border-[#BFE9FF] hover:border-[#6F3DFF]'
            }`}
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  alert.alert_type.includes('anomaly') || alert.alert_type.includes('Duplicate')
                    ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                    : alert.alert_type.includes('Expired')
                    ? 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]'
                    : alert.alert_type.includes('Source')
                    ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                    : 'bg-[#EAF8FF] text-[#0369A1] border border-[#BAE6FD]'
                }`}>
                  {alert.alert_type}
                </span>

                <span className="text-xs font-black text-[#6F3DFF] group-hover:text-[#4922C7] transition-colors underline decoration-[#6F3DFF] underline-offset-2">
                  {alert.application_id}
                </span>

                <span className="text-xs text-[#CBD5E1]">·</span>

                <span className="text-xs font-bold text-[#171827] bg-white px-2 py-0.5 rounded-md border border-[#CBD5E1]">
                  {alert.doc_type}
                </span>

                <span className="text-xs text-[#CBD5E1]">·</span>

                <span className="text-xs text-[#475569] truncate max-w-xs font-semibold">
                  {alert.institution_name}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#334155] font-medium leading-relaxed">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:self-center flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
              <span className="text-xs font-bold text-[#686B7A]">{alert.time_ago}</span>
              <div className="w-8 h-8 rounded-xl bg-white border-2 border-[#CBD5E1] group-hover:bg-[#6F3DFF] group-hover:text-white group-hover:border-[#6F3DFF] transition-all flex items-center justify-center text-[#686B7A] shadow-xs">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border-2 border-[#CBD5E1] text-center text-[#686B7A]">
            <p className="text-sm font-bold">No alerts found matching the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
