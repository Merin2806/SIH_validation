import React, { useState, useEffect } from 'react';
import { Search, Filter, Clock, ShieldCheck, Download, Calendar } from 'lucide-react';
import { fetchAuditEvents } from '../api/client';
import { AuditEvent } from '../types';

export const AuditTrail: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [search]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchAuditEvents({ q: search });
      setEvents(data);
    } catch (err) {
      console.error("Failed to load audit events", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    if (actorFilter === 'officer') return e.actor.includes('Officer');
    if (actorFilter === 'system') return !e.actor.includes('Officer');
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">Audit trail</h1>
          <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5">
            Chronological, immutable record of all document extractions, rule checks, and officer actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eaf4f7] border border-[#cbe1ea] rounded-lg text-xs font-semibold text-[#1f4e58]">
            <ShieldCheck className="w-4 h-4 text-[#204a53]" />
            <span>Traceable compliance log</span>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e1eaed] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by application ID, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f6f9fa] border border-[#d6e3e7] rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#51737c] font-medium">Actor:</span>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#d6e3e7] rounded-lg text-xs font-semibold text-[#204a53] focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            <option value="all">All actors</option>
            <option value="officer">Scrutiny Officer actions</option>
            <option value="system">Automated Scrutiny pipeline</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-[#e1eaed] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e1eaed] bg-[#f8fafb] text-[11px] font-bold text-[#5c7a83] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Source Mode</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3f5]">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#f8fafb] transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#1b5563]">
                    {ev.application_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                      ev.actor.includes('Officer') ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ev.actor}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#14323b]">
                    {ev.action}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                      ev.outcome.includes('Flagged') ? 'bg-red-50 text-red-700 border border-red-200' :
                      ev.outcome.includes('Confirmed') ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {ev.outcome}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono">
                      {ev.source_mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={ev.details || ''}>
                    {ev.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
