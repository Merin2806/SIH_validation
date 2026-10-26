import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Check, AlertTriangle, Shield, ToggleLeft, ToggleRight, BookOpen, Layers } from 'lucide-react';
import { fetchRules, toggleRule } from '../api/client';
import { ValidationRule } from '../types';

export const ChecklistsRules: React.FC = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await fetchRules();
      setRules(data);
    } catch (err) {
      console.error("Failed to load rules", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (ruleId: string, current: boolean) => {
    try {
      await toggleRule(ruleId, !current);
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, is_active: !current } : r));
    } catch (err) {
      console.error("Toggle rule failed", err);
    }
  };

  const categories = ['All', 'Regulatory Compliance', 'Institutional Consistency', 'Document Forensics', 'Infrastructure Compliance'];

  const filtered = categoryFilter === 'All' 
    ? rules 
    : rules.filter(r => r.category === categoryFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Handbook Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF]">
              Regulatory Engine
            </span>
            <span className="text-xs text-[#888A98]">· Configurable Rules</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">Checklists & Rules</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-1">
            Configurable regulatory validation criteria based on the AICTE Approval Process Handbook (APH).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-[#EAF8FF] text-[#0369A1] border border-[#BFE9FF] rounded-xl flex items-center gap-1.5 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-[#6F3DFF]" />
            <span>AICTE Handbook AY 2026-27</span>
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
              categoryFilter === cat
                ? 'bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/30'
                : 'bg-white text-[#484A54] border-2 border-[#CBD5E1] hover:border-[#6F3DFF] hover:bg-[#BFE9FF]/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-150 ${
              rule.is_active 
                ? 'bg-white border-[#CBD5E1] hover:border-[#6F3DFF] shadow-sm hover:shadow-md' 
                : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-black text-[#1E0B54] px-2.5 py-0.5 bg-[#BFE9FF] rounded-lg border border-[#94D9FF] shadow-2xs">
                    {rule.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    rule.severity === 'High' ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' :
                    rule.severity === 'Medium' ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' :
                    'bg-[#EAF8FF] text-[#0369A1] border border-[#BAE6FD]'
                  }`}>
                    Severity: {rule.severity}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#171827] mt-2.5 leading-snug">{rule.name}</h3>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => handleToggle(rule.id, rule.is_active)}
                className="text-[#6F3DFF] hover:text-[#5A2CE3] transition-colors p-1 flex-shrink-0"
                title={rule.is_active ? 'Disable rule' : 'Enable rule'}
                aria-label={rule.is_active ? `Disable rule ${rule.name}` : `Enable rule ${rule.name}`}
              >
                {rule.is_active ? (
                  <ToggleRight className="w-9 h-9 text-[#6F3DFF] stroke-[2.2]" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-[#B7B7B7] stroke-[2.2]" />
                )}
              </button>
            </div>

            <p className="text-xs text-[#334155] leading-relaxed mt-2.5 font-medium">
              {rule.description}
            </p>

            <div className="mt-4 pt-3 border-t-2 border-[#F1F5F9] flex flex-wrap items-center justify-between text-[11px] text-[#475569] gap-2">
              <span>Required: <strong className="text-[#171827] font-bold">{rule.required_evidence}</strong></span>
              <span className="font-mono text-[10.5px] font-bold bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#CBD5E1]">v{rule.version}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
