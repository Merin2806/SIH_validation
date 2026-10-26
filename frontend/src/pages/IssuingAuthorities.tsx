import React, { useState, useEffect } from 'react';
import { Network, Check, Clock, AlertTriangle, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { fetchSources, testSource } from '../api/client';
import { VerificationSource } from '../types';

export const IssuingAuthorities: React.FC = () => {
  const [sources, setSources] = useState<VerificationSource[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      console.error("Failed to load sources", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestQuery = async (sourceId: string) => {
    try {
      setTestingId(sourceId);
      const res = await testSource(sourceId, "FS/NOC/2021/04418");
      setTestResult(res);
    } catch (err) {
      console.error("Test failed", err);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">Issuing authorities</h1>
          <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5">
            Verification source adapters and registry connections. Simulated adapters provide deterministic test responses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#fff8e6] text-[#976800] border border-[#fde8ad] text-xs font-bold">
            Simulated Adapter Mode Active
          </span>
        </div>
      </div>

      {/* Test Query Live Result Modal / Banner */}
      {testResult && (
        <div className="p-4 bg-white border border-[#cce3eb] rounded-xl shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#14323b]">
              Simulated Endpoint Response: {testResult.source_id}
            </span>
            <button onClick={() => setTestResult(null)} className="text-xs text-gray-400 hover:text-black">✕</button>
          </div>
          <pre className="p-2.5 bg-[#f6f9fa] rounded text-[11px] font-mono text-gray-800 overflow-x-auto">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#edf5f7] text-[#1b5361] border border-[#d5e5eb]">
                  {src.source_type}
                </span>
                <h3 className="font-bold text-sm text-[#14323b] mt-1.5">{src.name}</h3>
              </div>
              <StatusBadge status={src.status} />
            </div>

            <p className="text-xs text-[#52747d] leading-relaxed">
              {src.details || 'Verifies certificates and regulatory status directly with authority source.'}
            </p>

            <div className="space-y-1 text-xs">
              <p className="text-[#64848d]">
                <strong className="text-[#203a40]">Supported documents:</strong> {src.supported_doc}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[#64848d]">Integration mode:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                  {src.integration_mode}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#edf3f5] flex items-center justify-between">
              <span className="text-[11px] text-[#6b8991]">
                Last checked: {new Date(src.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              <button
                onClick={() => handleTestQuery(src.id)}
                disabled={testingId === src.id}
                className="px-3 py-1.5 bg-[#f0f6f8] hover:bg-[#e2edf1] text-[#255e69] border border-[#d2e2e7] rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingId === src.id ? 'animate-spin' : ''}`} />
                <span>Test query</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
