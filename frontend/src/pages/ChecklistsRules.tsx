import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Check, AlertTriangle, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">Checklists & rules</h1>
          <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5">
            Configurable regulatory validation criteria based on the AICTE Approval Process Handbook.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 bg-[#eaf4f7] text-[#1b4d57] border border-[#d0e2e9] rounded-lg">
            Handbook Edition: AY 2026-27 (Demo)
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === cat
                ? 'bg-[#255e69] text-white shadow-sm'
                : 'bg-white text-[#395e67] border border-[#d6e3e7] hover:bg-gray-50'
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
            className={`bg-white p-5 rounded-xl border transition-all ${
              rule.is_active ? 'border-[#e1eaed] shadow-sm' : 'border-gray-200 opacity-60 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#1b5361] px-2 py-0.5 bg-[#edf5f7] rounded border border-[#d5e5eb]">
                    {rule.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    rule.severity === 'High' ? 'bg-red-50 text-red-700' :
                    rule.severity === 'Medium' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    Severity: {rule.severity}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#14323b] mt-2">{rule.name}</h3>
              </div>

              {/* Toggle button */}
              <button
                onClick={() => handleToggle(rule.id, rule.is_active)}
                className="text-[#255e69] hover:text-[#1a444c] transition-colors p-1"
                title={rule.is_active ? 'Disable rule' : 'Enable rule'}
              >
                {rule.is_active ? (
                  <ToggleRight className="w-7 h-7 text-[#255e69]" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-400" />
                )}
              </button>
            </div>

            <p className="text-xs text-[#4b6a73] leading-relaxed mt-2.5">
              {rule.description}
            </p>

            <div className="mt-4 pt-3 border-t border-[#edf3f5] flex items-center justify-between text-[11px] text-[#6b8991]">
              <span>Required: <strong className="text-[#203a40]">{rule.required_evidence}</strong></span>
              <span>Version: {rule.version}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
