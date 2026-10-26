import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ShieldCheck, Download, Calendar, CheckCircle, RefreshCw, Hash, Shield, Link2, ArrowRight } from 'lucide-react';
import { fetchAuditEvents, verifyAuditIntegrity } from '../api/client';
import { AuditEvent } from '../types';

export const AuditTrail: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('');
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [search, actorFilter, appFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditEvents({
        q: search || undefined,
        actor: actorFilter !== 'all' ? actorFilter : undefined,
        application_id: appFilter || undefined
      });
      setEvents(data);
    } catch (err) {
      console.error("Failed to load audit events", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      setVerifying(true);
      const res = await verifyAuditIntegrity(appFilter || undefined);
      setIntegrityStatus(res);
    } catch (err) {
      console.error("Verification failed", err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Cryptographic Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF]">
              SHA-256 Ledger
            </span>
            <span className="text-xs text-[#888A98]">· Immutable Append-Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">Audit Trail</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-1">
            Chronological audit log secured by a cryptographic SHA-256 hash chain for regulatory evidentiary proof.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6F3DFF] hover:bg-[#5A2CE3] active:bg-[#4922C7] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-[#6F3DFF]/25 hover:shadow-md transition-all min-h-[42px]"
          >
            <ShieldCheck className={`w-4 h-4 stroke-[2.2] ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? "Verifying Hash Chain..." : "Verify Hash Chain"}</span>
          </button>
        </div>
      </div>

      {/* Hash chain verification result banner */}
      {integrityStatus && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-2xs border ${
          integrityStatus.valid 
            ? 'bg-[#EBF9F1] border-[#BBF7D0] text-[#166534]' 
            : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">
              {integrityStatus.message} ({integrityStatus.events_checked} cryptographic blocks verified without tampering)
            </span>
          </div>
          <button 
            onClick={() => setIntegrityStatus(null)} 
            className="font-bold p-1 hover:opacity-75 transition-opacity"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-gradient-to-r from-[#F0EBFF] via-[#F8FAFC] to-[#EAF8FF] p-4 sm:p-5 rounded-2xl border-2 border-[#CBD5E1] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-[#6F3DFF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
          <input
            type="text"
            placeholder="Search audit trail by application ID, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 bg-white border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] text-[#171827] font-medium focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] placeholder-[#686B7A] transition-all min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#171827] font-extrabold">App ID:</span>
            <input
              type="text"
              placeholder="e.g. EoA-2026-00418"
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
              className="px-3 py-2 w-40 bg-white border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] text-[#171827] font-bold focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] transition-all min-h-[40px]"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#171827] font-extrabold">Actor:</span>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="px-3 py-2 bg-white border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] font-bold text-[#171827] focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] transition-all min-h-[40px]"
            >
              <option value="all">All Actors</option>
              <option value="officer">Scrutiny Officer Actions</option>
              <option value="system">Automated Pipeline Engine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border-2 border-[#CBD5E1] shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[760px]">
            <thead>
              <tr className="border-b-2 border-[#94D9FF] bg-[#BFE9FF]/70 text-[11px] font-extrabold text-[#171827] uppercase tracking-wider">
                <th className="py-3.5 px-4">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Application ID</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Cryptographic Hash Chain</th>
                <th className="py-3.5 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#CBD5E1]">
              {events.map((ev) => (
                <tr key={ev.id} className="even:bg-[#F8FAFC] hover:bg-[#EAF8FF] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#475569] font-medium whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-black text-[#6F3DFF]">
                    {ev.application_id || 'System'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-extrabold ${
                      ev.actor.includes('Officer') 
                        ? 'bg-[#BFE9FF] text-[#1E0B54] border border-[#94D9FF]' 
                        : 'bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1]'
                    }`}>
                      {ev.actor}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#171827]">
                    {ev.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                      ev.outcome.includes('Flagged') || ev.outcome.includes('Mismatch') 
                        ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' :
                      ev.outcome.includes('Confirmed') || ev.outcome.includes('Rectification') 
                        ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' :
                        'bg-[#EBF9F1] text-[#166534] border border-[#86EFAC]'
                    }`}>
                      {ev.outcome}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {ev.hash ? (
                      <div className="flex items-center gap-1 font-mono text-[10.5px] font-bold text-[#BFE9FF] bg-[#1E0B54] px-2.5 py-1 rounded-lg border border-[#6F3DFF]/40 w-fit shadow-2xs" title={`Hash: ${ev.hash}\nPrev: ${ev.prev_hash}`}>
                        <Hash className="w-3.5 h-3.5 text-[#BFE9FF]" />
                        <span>{ev.hash.slice(0, 10)}...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#888A98] font-mono">Genesis</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#334155] max-w-xs truncate font-medium" title={ev.details || ''}>
                    {ev.details || '—'}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#686B7A] font-bold">
                    No audit records match the selected query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
