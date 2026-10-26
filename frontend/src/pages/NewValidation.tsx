import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  Globe,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
  File,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Layers
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  fetchApplications,
  fetchApplication,
  createApplication,
  uploadApplicationDocument
} from '../api/client';
import { Application, ValidationCheck } from '../types';

export const NewValidation: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Application selection / creation state
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [existingApps, setExistingApps] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('EoA-2026-00418');
  const [currentApp, setCurrentApp] = useState<Application | null>(null);

  // New Application Fields
  const [newInstName, setNewInstName] = useState<string>('');
  const [newInstCode, setNewInstCode] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Extension of Approval (EoA)');

  // Upload & Pipeline State
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<string>('Ready for document upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [latestUploadResult, setLatestUploadResult] = useState<any>(null);

  useEffect(() => {
    loadExistingApplications();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadSelectedApp(selectedAppId);
    }
  }, [selectedAppId]);

  const loadExistingApplications = async () => {
    try {
      const res = await fetchApplications({ limit: 50 });
      if (res.items && res.items.length > 0) {
        setExistingApps(res.items);
        if (!selectedAppId) {
          setSelectedAppId(res.items[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load existing applications", err);
    }
  };

  const loadSelectedApp = async (appId: string) => {
    try {
      const appData = await fetchApplication(appId);
      setCurrentApp(appData);
    } catch (err) {
      console.error("Failed to load application details", err);
    }
  };

  const handleCreateNewApp = async () => {
    if (!newInstName.trim()) {
      setUploadError("Institution name is required to initialize application dossier.");
      return;
    }
    try {
      setUploadError(null);
      const created = await createApplication({
        institution_name: newInstName.trim(),
        category: newCategory,
        institution_code: newInstCode.trim() || undefined
      });
      setSelectedAppId(created.id);
      setCurrentApp(created);
      setMode('existing');
      loadExistingApplications();
    } catch (err: any) {
      setUploadError(err.response?.data?.detail || "Failed to create application.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const targetId = selectedAppId;

    if (!targetId) {
      setUploadError("Please select or create an application before uploading documents.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Client-side validations
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`File '${file.name}' exceeds maximum 25 MB limit.`);
        continue;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext || '')) {
        setUploadError(`File '${file.name}' has unsupported format. Use PDF, JPG, or PNG.`);
        continue;
      }

      try {
        setCurrentStage(`Uploading ${file.name} (File ${i + 1} of ${files.length})...`);
        const formData = new FormData();
        formData.append('file', file);

        setCurrentStage(`Extracting text, computing SHA-256 hash & evaluating rules...`);
        const res = await uploadApplicationDocument(targetId, formData);
        setLatestUploadResult(res);

        setCurrentStage(`Successfully processed ${file.name}!`);
      } catch (err: any) {
        console.error("Upload error", err);
        setUploadError(err.response?.data?.detail || `Failed to process ${file.name}.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Reload updated application dossier
    loadSelectedApp(targetId);
  };

  const documents = currentApp?.documents || [];
  const checks = currentApp?.checks || [];
  const checksPassed = checks.filter(c => c.status === 'Passed').length;
  const checksTotal = checks.length || 12;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#686B7A]">
        <Link to="/" className="hover:text-[#6F3DFF] transition-colors font-medium">Validation Queue</Link>
        <span>/</span>
        <span className="text-[#171827] font-semibold">New Validation</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171827] tracking-tight">New Validation</h1>
          <p className="text-xs sm:text-sm text-[#686B7A] mt-1 max-w-3xl leading-relaxed">
            Upload institutional evidence. The pipeline validates file integrity, computes SHA-256 content hashes, extracts multilingual text, queries issuing authorities, and runs deterministic compliance rules.
          </p>
        </div>

        {selectedAppId && (
          <button
            onClick={() => navigate(`/reviewer/${selectedAppId}`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6F3DFF] hover:bg-[#5A2CE3] active:bg-[#4922C7] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-[#6F3DFF]/25 hover:shadow-md transition-all self-start sm:self-auto min-h-[42px]"
          >
            <span>Open Reviewer ({selectedAppId})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Error alert banner */}
      {uploadError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs sm:text-sm text-[#991B1B] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
            <span className="font-medium">{uploadError}</span>
          </div>
          <button 
            onClick={() => setUploadError(null)} 
            className="text-[#991B1B] hover:text-[#7F1D1D] font-bold p-1 rounded-md"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top 2 Columns: Application Details (Left) + Validation Pipeline Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Application Selection / Creation (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#CBD5E1] shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#CBD5E1]">
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-[#171827]">Application Dossier</h2>
              <p className="text-[11px] text-[#686B7A] font-medium">Select or initialize target institution record</p>
            </div>
            <div className="flex items-center p-1 bg-[#F0EBFF] rounded-xl text-xs border border-[#D5C2FF]">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all min-h-[32px] ${
                  mode === 'existing'
                    ? 'bg-[#6F3DFF] text-white shadow-xs'
                    : 'text-[#6F3DFF] hover:text-[#4922C7]'
                }`}
              >
                Select Existing
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all min-h-[32px] ${
                  mode === 'new'
                    ? 'bg-[#6F3DFF] text-white shadow-xs'
                    : 'text-[#6F3DFF] hover:text-[#4922C7]'
                }`}
              >
                Create New
              </button>
            </div>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#171827] mb-1.5">
                  Select Application to Validate
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#171827] font-bold focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white transition-all min-h-[42px]"
                >
                  {existingApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.institution_name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              {currentApp && (
                <div className="p-4 bg-gradient-to-r from-[#EAF8FF] to-[#D5F1FF] rounded-xl border-2 border-[#BFE9FF] space-y-2 text-xs text-[#171827] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#171827]">{currentApp.institution_name}</span>
                    <StatusBadge status={currentApp.overall_status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#334155]">
                    <p><strong className="text-[#171827]">PID:</strong> {currentApp.institution_code || 'Pending'}</p>
                    <p><strong className="text-[#171827]">Category:</strong> {currentApp.category}</p>
                    <p><strong className="text-[#171827]">Checks Passed:</strong> {currentApp.checks_passed} of {currentApp.checks_total}</p>
                    <p><strong className="text-[#171827]">Submission:</strong> {new Date(currentApp.submission_date || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-[#171827] mb-1.5">
                  Institution Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune Institute of Advanced Technology"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#171827] font-medium focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white transition-all min-h-[42px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#171827] mb-1.5">
                    AICTE Permanent ID (PID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-10492817"
                    value={newInstCode}
                    onChange={(e) => setNewInstCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#171827] font-medium focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white transition-all min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#171827] mb-1.5">
                    Application Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#171827] font-medium focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white transition-all min-h-[42px]"
                  >
                    <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                    <option value="Increase in intake">Increase in intake</option>
                    <option value="New course">New course / Program addition</option>
                    <option value="Establishment of New Technical Institution">Establishment of New Institution</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNewApp}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] hover:from-[#3B1796] hover:to-[#5A2CE3] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#6F3DFF]/25 transition-all min-h-[42px]"
              >
                Initialize Application Record
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Validation Pipeline Status + Secure Handling (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-[#1E0B54] via-[#2A1070] to-[#431B9E] text-white p-5 sm:p-6 rounded-2xl border-2 border-[#865EFF] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-extrabold text-sm text-white">Validation Pipeline</span>
                <p className="text-[11px] text-[#BFE9FF]/80 font-medium">Autonomous verification engine</p>
              </div>
              <span className="text-xs font-black text-[#1E0B54] bg-[#BFE9FF] px-2.5 py-0.5 rounded-lg shadow-xs">
                {uploading ? "Processing..." : (currentApp ? `${Math.round((checksPassed / (checksTotal || 1)) * 100)}% Complete` : "0%")}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden border border-white/20">
              <div
                className={`h-full transition-all duration-300 ${uploading ? 'bg-[#BFE9FF] animate-pulse w-full' : 'bg-[#BFE9FF]'}`}
                style={{ width: uploading ? '100%' : `${Math.round((checksPassed / (checksTotal || 1)) * 100)}%` }}
              />
            </div>

            {/* Active stage banner */}
            <div className="p-3 rounded-xl bg-white/15 border border-white/25 text-xs font-bold text-[#BFE9FF] flex items-center gap-2.5 backdrop-blur-xs">
              <RefreshCw className={`w-4 h-4 text-[#BFE9FF] ${uploading ? 'animate-spin' : ''}`} />
              <span className="truncate">{currentStage}</span>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFE9FF] text-[#1E0B54] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 shadow-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-white">SHA-256 Hashing & Duplicate Check</p>
                  <p className="text-[11px] text-[#D5C2FF]">Cryptographic duplicate detection across records</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFE9FF] text-[#1E0B54] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 shadow-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-white">PyMuPDF & Multilingual OCR</p>
                  <p className="text-[11px] text-[#D5C2FF]">Text, metadata tags and Devanagari script detection</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFE9FF] text-[#1E0B54] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 shadow-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-white">Issuing Authority Verification</p>
                  <p className="text-[11px] text-[#D5C2FF]">Simulated adapters for Fire, Land, AICTE and NBA</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#BFE9FF] text-[#1E0B54] flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 shadow-xs">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-white">Deterministic AICTE Rules Engine</p>
                  <p className="text-[11px] text-[#D5C2FF]">Expiry dates, name consistency, and audit ledger</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/reviewer/${selectedAppId}`)}
                className="flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold text-[#1E0B54] bg-[#BFE9FF] hover:bg-white rounded-xl shadow-xs transition-colors text-center min-h-[40px]"
              >
                Review Application
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 rounded-xl transition-colors text-center min-h-[40px]"
              >
                Back to Queue
              </button>
            </div>
          </div>

          {/* Secure Handling card */}
          <div className="bg-gradient-to-r from-[#EAF8FF] to-[#D5F1FF] p-4 rounded-2xl border-2 border-[#BFE9FF] flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-[#6F3DFF] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Lock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="text-xs text-[#171827]">
              <span className="font-bold block text-xs mb-0.5 text-[#171827]">Secure Handling Guarantee</span>
              <p className="text-[11px] leading-relaxed text-[#334155] font-medium">
                Uploaded documents are saved to non-executable server storage with UUID prefixes. File stream hashes are cryptographically chained in SQLite.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Supporting Documents in Dossier Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border-2 border-[#CBD5E1] shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#CBD5E1]">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-[#171827]">Supporting Documents in Dossier</h2>
            <p className="text-[11px] text-[#686B7A] font-medium">Upload institutional PDF, JPG, or PNG files for automatic validation</p>
          </div>
          <span className="text-xs text-[#1E0B54] font-black bg-[#BFE9FF] px-2.5 py-1 rounded-lg border border-[#94D9FF] shadow-xs">
            {documents.length} Files Attached
          </span>
        </div>

        {/* Drag and Drop Upload Zone - Prominent Glacier Blue with Ultraviolet actions */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-3 border-dashed border-[#6F3DFF] bg-gradient-to-b from-[#EAF8FF] via-[#D5F1FF]/60 to-[#EAF8FF] hover:bg-[#BFE9FF]/50 p-8 rounded-2xl text-center cursor-pointer transition-all duration-200 space-y-3 group shadow-inner"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#6F3DFF] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#6F3DFF]/35 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-[#171827]">
              Drag institutional certificates here, or{' '}
            </span>
            <span className="text-xs sm:text-sm font-black text-[#6F3DFF] underline decoration-[#6F3DFF] underline-offset-2">
              browse files
            </span>
          </div>
          <p className="text-[11px] text-[#475569] font-medium">
            Accepted: PDF, JPG, PNG · up to 25 MB per file · verified with magic byte file signatures
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>

        {/* Multilingual Parsing Notice Banner */}
        <div className="p-3.5 bg-gradient-to-r from-[#F0EBFF] to-[#EAF8FF] border-2 border-[#BFE9FF] rounded-xl flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#6F3DFF] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
            <Globe className="w-4 h-4 stroke-[2.2]" />
          </div>
          <p className="text-xs text-[#334155] leading-relaxed font-medium">
            <strong className="text-[#1E0B54] font-bold">Multilingual parsing is active.</strong> English, Hindi, and Marathi documents (such as 7/12 land records and notarized affidavits) are detected through Devanagari script analysis and normalized for regulatory scrutiny.
          </p>
        </div>

        {/* Document Items List */}
        <div className="space-y-2.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3.5 rounded-xl border-2 border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white hover:border-[#6F3DFF] transition-all gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F0EBFF] border border-[#D5C2FF] flex items-center justify-center text-[#6F3DFF] flex-shrink-0 shadow-xs">
                  <FileText className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="truncate min-w-0">
                  <p className="text-xs sm:text-[13px] font-bold text-[#171827] truncate">{doc.filename}</p>
                  <p className="text-[11px] text-[#686B7A] font-medium">
                    {doc.file_size_formatted} · {doc.detected_language} {doc.is_duplicate && (
                      <span className="text-[#BE123C] font-bold ml-1.5 bg-[#FFF1F2] px-1.5 py-0.2 rounded border border-[#FECDD3]">
                        Duplicate SHA-256
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E2E8F0] text-[#1E293B] border border-[#CBD5E1]">
                  {doc.detected_type}
                </span>

                <StatusBadge status={doc.processing_status} />
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-[#888A98] text-center py-6 font-semibold">No documents uploaded yet in this application dossier.</p>
          )}
        </div>
      </div>

      {/* Bottom Card: Checklist Applied */}
      <div className="bg-gradient-to-b from-[#F0EBFF]/30 via-[#F8FAFC] to-[#EAF8FF]/40 p-5 sm:p-6 rounded-2xl border-2 border-[#CBD5E1] shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#CBD5E1]">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-[#171827]">
              Checklist Applied · {currentApp?.category || "Extension of Approval"}
            </h2>
            <p className="text-[11px] text-[#686B7A] font-medium">Mandatory statutory items evaluated by the deterministic engine</p>
          </div>
          <span className="px-3 py-1 bg-[#EBF9F1] text-[#166534] border border-[#86EFAC] rounded-full text-xs font-bold shadow-xs">
            {checksPassed} of {checksTotal} Passed
          </span>
        </div>

        {/* 12 Checklist cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {checks.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl border-2 border-[#CBD5E1] bg-white flex items-center justify-between gap-2.5 hover:border-[#6F3DFF] transition-all shadow-2xs"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#171827] truncate">{item.checklist_item}</p>
                <p className="text-[11px] text-[#686B7A] font-medium truncate">{item.source_type}</p>
              </div>
              <div className="flex-shrink-0">
                <StatusBadge status={item.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
