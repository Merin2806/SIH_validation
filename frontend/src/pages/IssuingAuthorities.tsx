import React, { useState, useEffect } from 'react';
import { Network, Check, Clock, AlertTriangle, ExternalLink, RefreshCw, ShieldAlert, Radio, Server } from 'lucide-react';
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
      {/* Title & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF]">
              Issuing Authority Gateways
            </span>
            <span className="text-xs text-[#888A98]">· Verification Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">Issuing Authorities</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-1">
            External authority adapters and registry verification gateways. Simulated mode ensures reproducible evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] text-xs font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#EAB308] animate-pulse" />
            <span>Simulated Adapter Mode Active</span>
          </span>
        </div>
      </div>

      {/* Test Query Live Result Modal / Banner */}
      {testResult && (
        <div className="p-5 bg-[#1E0B54] text-white border-2 border-[#6F3DFF] rounded-2xl shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BFE9FF] animate-pulse" />
              <span className="text-xs sm:text-sm font-extrabold text-[#BFE9FF]">
                Simulated Endpoint Response: {testResult.source_id}
              </span>
            </div>
            <button 
              onClick={() => setTestResult(null)} 
              className="text-xs font-bold text-[#BFE9FF] hover:text-white p-1"
            >
              ✕ Close
            </button>
          </div>
          <pre className="p-3 bg-black/40 rounded-xl text-[11px] font-mono text-[#E1D6FF] overflow-x-auto border border-[#6F3DFF]/40">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Adapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div key={src.id} className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#CBD5E1] hover:border-[#6F3DFF] shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-[#BFE9FF] text-[#1E0B54] border border-[#94D9FF] shadow-2xs">
                  {src.source_type}
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-[#171827] mt-2 leading-snug">{src.name}</h3>
              </div>
              <StatusBadge status={src.status} />
            </div>

            <p className="text-xs text-[#334155] leading-relaxed font-medium">
              {src.details || 'Verifies certificates and regulatory status directly with authority source.'}
            </p>

            <div className="space-y-1.5 text-xs">
              <p className="text-[#686B7A]">
                <strong className="text-[#171827]">Supported Documents:</strong> {src.supported_doc}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[#686B7A]">Integration Mode:</span>
                <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                  {src.integration_mode}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#686B7A]">
              <span className="font-medium">
                Last checked: {new Date(src.last_checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              <button
                onClick={() => handleTestQuery(src.id)}
                disabled={testingId === src.id}
                className="px-3.5 py-1.5 bg-[#6F3DFF] hover:bg-[#5A2CE3] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shadow-[#6F3DFF]/25 min-h-[34px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingId === src.id ? 'animate-spin' : ''}`} />
                <span>Test Query</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
