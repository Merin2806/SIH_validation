import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, X, ArrowRight, Filter, AlertCircle } from 'lucide-react';
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
    { label: 'All alerts', value: 'all' },
    { label: 'Suspected anomaly', value: 'suspected_anomaly' },
    { label: 'Expired document', value: 'expired_document' },
    { label: 'Source pending', value: 'source_pending' },
    { label: 'Missing information', value: 'missing_information' },
    { label: 'Duplicate', value: 'duplicate' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">Alerts</h1>
          <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5">
            Real-time attention flags requiring scrutiny officer review.
          </p>
        </div>

        <span className="px-3 py-1 bg-[#1b353c] text-white rounded-full text-xs font-bold self-start sm:self-auto">
          {alerts.length} active alerts
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterType(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === t.value
                ? 'bg-[#255e69] text-white shadow-sm'
                : 'bg-white text-[#395e67] border border-[#d6e3e7] hover:bg-gray-50'
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
            className="bg-white p-4 sm:p-5 rounded-xl border border-[#e1eaed] hover:border-[#b4d1d9] shadow-sm hover:shadow cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  alert.alert_type.includes('anomaly') || alert.alert_type.includes('Duplicate')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : alert.alert_type.includes('Expired')
                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                    : alert.alert_type.includes('Source')
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {alert.alert_type}
                </span>

                <span className="text-xs font-semibold text-[#185361] underline">
                  {alert.application_id}
                </span>

                <span className="text-xs text-gray-500">·</span>

                <span className="text-xs font-bold text-gray-700">
                  {alert.doc_type}
                </span>

                <span className="text-xs text-gray-400">·</span>

                <span className="text-xs text-gray-500">
                  {alert.institution_name}
                </span>
              </div>

              <p className="text-xs text-[#203a40] font-medium leading-relaxed">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:self-center">
              <span className="text-xs text-gray-400">{alert.time_ago}</span>
              <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-[#255e69] group-hover:text-white transition-colors text-gray-600">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
