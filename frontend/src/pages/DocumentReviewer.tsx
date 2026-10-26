import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  Check,
  AlertTriangle,
  X,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Info,
  ShieldCheck,
  FileText,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  Eye,
  CornerDownRight,
  ShieldAlert,
  Send
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  fetchApplication,
  confirmFinding,
  dismissFinding,
  requestRectification,
  escalateInspection,
  completeReview
} from '../api/client';
import { Application, UploadedDocument, Finding, ExtractedField } from '../types';

export const DocumentReviewer: React.FC = () => {
  const { id = 'EoA-2026-00418' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedFindingId, setSelectedFindingId] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [officerNote, setOfficerNote] = useState<string>('');
  const [dismissReason, setDismissReason] = useState<string>('');
  const [dismissModalOpen, setDismissModalOpen] = useState<boolean>(false);
  const [activeDismissFindingId, setActiveDismissFindingId] = useState<number | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'evidence' | 'findings'>('evidence');

  useEffect(() => {
    loadApp();
  }, [id]);

  const loadApp = async () => {
    try {
      setLoading(true);
      const data = await fetchApplication(id);
      setApplication(data);
      if (data.officer_note) {
        setOfficerNote(data.officer_note);
      }
      if (data.documents && data.documents.length > 0) {
        const fireDoc = data.documents.find(d => d.detected_type === 'NOC (Fire)' || d.filename.includes('Fire'));
        setSelectedDocId(fireDoc ? fireDoc.id : data.documents[0].id);
      }
      if (data.findings && data.findings.length > 0) {
        setSelectedFindingId(data.findings[0].id);
      }
    } catch (err) {
      console.error("Failed to load application", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (fId: number) => {
    try {
      await confirmFinding(fId, "Confirmed by Scrutiny Officer");
      loadApp();
    } catch (err) {
      console.error("Confirm failed", err);
    }
  };

  const handleDismissSubmit = async () => {
    if (!activeDismissFindingId || !dismissReason.trim()) {
      alert("Please provide a mandatory justification for dismissal.");
      return;
    }
    try {
      await dismissFinding(activeDismissFindingId, dismissReason);
      setDismissModalOpen(false);
      setDismissReason('');
      setActiveDismissFindingId(null);
      loadApp();
    } catch (err) {
      console.error("Dismiss failed", err);
    }
  };

  const handleDecision = async (type: 'rectification' | 'escalation' | 'reviewed') => {
    try {
      if (type === 'rectification') {
        await requestRectification(id, officerNote);
        setDecisionFeedback("Rectification request recorded and dispatched to institution.");
      } else if (type === 'escalation') {
        await escalateInspection(id, officerNote);
        setDecisionFeedback("Physical inspection escalation registered for Expert Visit Committee (EVC).");
      } else {
        await completeReview(id, officerNote);
        setDecisionFeedback("Preliminary scrutiny marked as completed by Scrutiny Officer.");
      }
      loadApp();
    } catch (err) {
      console.error("Decision action failed", err);
    }
  };

  const documents = application?.documents || [];
  const findings = application?.findings || [];
  const selectedDoc = documents.find(d => d.id === selectedDocId) || documents[0];
  const selectedFinding = findings.find(f => f.id === selectedFindingId) || findings[0];

  const verifiedCount = (application?.checks || []).filter(c => c.status === 'Passed').length;
  const mismatchCount = findings.filter(f => f.status === 'Mismatch detected').length;
  const expiredCount = findings.filter(f => f.status === 'Expired').length;
  const pendingCount = findings.filter(f => f.status === 'Source unavailable').length;
  const activeFindingsCount = findings.filter(f => !f.dismissed_by_reviewer).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#F0EBFF]/60 via-[#F8FBFF] to-[#EAF8FF] p-5 sm:p-6 rounded-2xl border-2 border-[#BFE9FF] shadow-sm">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#686B7A]">
            <Link to="/" className="hover:text-[#6F3DFF] font-bold transition-colors">Validation Queue</Link>
            <span>/</span>
            <span className="text-[#171827] font-extrabold">Document Reviewer</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-[#171827] tracking-tight mt-1.5">
            {application?.institution_name || 'Loading Institution Dossier...'}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-xs">
            <span className="font-mono font-black text-[#6F3DFF] px-2.5 py-0.5 bg-white rounded-lg border border-[#D5C2FF] shadow-2xs">
              {id}
            </span>
            <span className="text-[#171827] px-2.5 py-0.5 bg-white rounded-lg border border-[#CBD5E1] font-bold shadow-2xs">
              {application?.category || 'Extension of Approval'}
            </span>
            <StatusBadge status={application?.overall_status || 'Manual review'} />
            <span className="text-[#686B7A] text-[11px] font-semibold">
              Submitted {application?.submission_date ? new Date(application.submission_date).toLocaleDateString() : '26 Oct 2026'}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-[#171827] bg-white border-2 border-[#CBD5E1] rounded-xl hover:bg-[#F0EBFF] hover:border-[#6F3DFF] shadow-xs transition-all self-start sm:self-auto min-h-[42px]"
        >
          <Clock className="w-4 h-4 text-[#6F3DFF] stroke-[2.2]" />
          <span>View Audit Trail</span>
        </button>
      </div>

      {/* Dynamic Summary Badges Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="px-3 py-1.5 rounded-full bg-[#EBF9F1] text-[#166534] border-2 border-[#86EFAC] flex items-center gap-1.5 shadow-2xs">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Verified · {verifiedCount}</span>
        </span>
        {mismatchCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-[#FEF2F2] text-[#991B1B] border-2 border-[#FECACA] flex items-center gap-1.5 shadow-2xs">
            <span>▲</span>
            <span>Mismatch · {mismatchCount}</span>
          </span>
        )}
        {expiredCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-[#FFF1F2] text-[#BE123C] border-2 border-[#FECDD3] flex items-center gap-1.5 shadow-2xs">
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Expired · {expiredCount}</span>
          </span>
        )}
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-[#FFFBEB] text-[#92400E] border-2 border-[#FDE68A] flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Source Pending · {pendingCount}</span>
          </span>
        )}
        <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] text-white flex items-center gap-1.5 shadow-md shadow-[#6F3DFF]/25 font-extrabold">
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>Needs Scrutiny Review · {activeFindingsCount} Flags</span>
        </span>
      </div>

      {/* Decision feedback banner if clicked */}
      {decisionFeedback && (
        <div className="p-4 bg-[#EBF9F1] border-2 border-[#86EFAC] rounded-xl flex items-center justify-between text-xs sm:text-sm text-[#166534] shadow-xs">
          <span className="font-extrabold flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[2.5]" />
            {decisionFeedback}
          </span>
          <button onClick={() => setDecisionFeedback(null)} className="text-[#166534] font-bold p-1">✕</button>
        </div>
      )}

      {/* Mobile Tab Switcher (Evidence vs Findings) */}
      <div className="lg:hidden flex rounded-xl bg-[#E2E8F0] p-1 border-2 border-[#CBD5E1]">
        <button
          onClick={() => setMobileTab('evidence')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${
            mobileTab === 'evidence'
              ? 'bg-[#6F3DFF] text-white shadow-xs'
              : 'text-[#484A54]'
          }`}
        >
          Document Evidence
        </button>
        <button
          onClick={() => setMobileTab('findings')}
          className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all ${
            mobileTab === 'findings'
              ? 'bg-[#6F3DFF] text-white shadow-xs'
              : 'text-[#484A54]'
          }`}
        >
          AI Findings ({findings.length})
        </button>
      </div>

      {/* TWO COLUMN REVIEW AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: EVIDENCE CANVAS (7 cols on lg) */}
        {/* ========================================================= */}
        <div className={`lg:col-span-7 bg-white rounded-2xl border-2 border-[#CBD5E1] shadow-md flex flex-col overflow-hidden ${
          mobileTab === 'findings' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Evidence Header with Dynamic Dossier Tabs and Zoom Controls */}
          <div className="p-3.5 border-b-2 border-[#CBD5E1] flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-r from-[#F0EBFF] via-[#F8FAFC] to-[#EAF8FF]">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full sm:max-w-md py-0.5">
              <span className="text-xs font-extrabold text-[#171827] mr-1 flex-shrink-0">Dossier:</span>
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-[32px] ${
                    selectedDoc?.id === doc.id
                      ? 'bg-[#6F3DFF] text-white shadow-md shadow-[#6F3DFF]/25'
                      : 'bg-white text-[#484A54] border border-[#CBD5E1] hover:bg-[#BFE9FF]/30'
                  }`}
                >
                  {doc.detected_type || doc.filename}
                </button>
              ))}
              {documents.length === 0 && (
                <span className="text-xs text-[#888A98]">No documents in dossier</span>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 text-xs text-[#171827] font-semibold bg-white px-2.5 py-1 rounded-lg border border-[#E3E5EC] shadow-2xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
                className="hover:text-[#6F3DFF] font-extrabold px-1.5 py-0.5 min-w-[24px]"
                title="Zoom out"
                aria-label="Zoom out"
              >
                -
              </button>
              <span className="font-mono text-[11px] text-[#484A54] min-w-[36px] text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                className="hover:text-[#6F3DFF] font-extrabold px-1.5 py-0.5 min-w-[24px]"
                title="Zoom in"
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          {/* Document Display Canvas */}
          <div className="flex-1 p-4 sm:p-6 bg-[#F2F4F7] overflow-auto flex items-center justify-center min-h-[580px]">
            {selectedDoc?.detected_type === 'NOC (Fire)' ? (
              /* Fire NOC Document Rendered with Interactive Evidence Callout Regions */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="relative w-full max-w-[520px] min-h-[660px] bg-white border border-[#D5D8E2] shadow-lg p-6 sm:p-8 text-[#171827] font-serif transition-transform duration-200 rounded-sm"
              >
                {/* Outer Document Border */}
                <div className="border border-[#888A98] p-5 sm:p-6 min-h-[600px] flex flex-col justify-between relative bg-white">
                  
                  {/* Top Seal */}
                  <div className="text-center space-y-1">
                    <div className="w-11 h-11 rounded-full border-2 border-[#171827] mx-auto flex items-center justify-center text-[10px] font-sans font-bold text-[#171827] shadow-2xs">
                      SFS
                    </div>
                    <h2 className="text-xs font-sans font-bold tracking-wider text-[#171827] uppercase">
                      State Fire Services Department
                    </h2>
                    <p className="text-[9px] font-sans text-[#686B7A]">
                      Sample issuing authority · Official regulatory clearance
                    </p>
                    <h3 className="text-xs font-sans font-bold text-[#171827] pt-2 tracking-wide border-b border-gray-200 pb-1.5">
                      NO OBJECTION CERTIFICATE — FIRE SAFETY
                    </h3>
                  </div>

                  {/* Body text with Callout Marker 3 (Institution Name Mismatch) */}
                  <div className="text-[11px] font-serif leading-relaxed text-[#2C2D34] pt-3 relative">
                    <span>This is to certify that the premises and instructional building(s) of </span>
                    
                    {/* CALLOUT 3: Institution Name */}
                    <span
                      onClick={() => setSelectedFindingId(3)}
                      className={`relative inline-block px-1 border-2 border-dashed rounded cursor-pointer transition-all ${
                        selectedFindingId === 3
                          ? 'border-[#6F3DFF] bg-[#F0EBFF] ring-2 ring-[#6F3DFF]/40 font-bold text-[#4922C7]'
                          : 'border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                      }`}
                    >
                      Meridian Inst. of Technology & Research
                      <span className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#6F3DFF] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow-xs">
                        3
                      </span>
                    </span>

                    <span> situated at Plot 14, Education Park Road, Demo City, have been duly inspected and satisfy all fire safety precautions applicable to technical educational campuses.</span>
                  </div>

                  {/* Table with Callout Marker 2 (Valid until Date) */}
                  <div className="border border-gray-400 text-[10.5px] font-sans my-4 bg-white">
                    <div className="grid grid-cols-12 border-b border-gray-300 py-1.5 px-3">
                      <div className="col-span-5 font-bold text-gray-700">Certificate No.</div>
                      <div className="col-span-7 font-mono font-medium">FS/NOC/2021/04418</div>
                    </div>
                    <div className="grid grid-cols-12 border-b border-gray-300 py-1.5 px-3">
                      <div className="col-span-5 font-bold text-gray-700">Date of issue</div>
                      <div className="col-span-7">14 March 2021</div>
                    </div>
                    <div className="grid grid-cols-12 py-1.5 px-3 items-center">
                      <div className="col-span-5 font-bold text-gray-700">Valid until</div>
                      <div className="col-span-7">
                        {/* CALLOUT 2: Expiry Date */}
                        <span
                          onClick={() => setSelectedFindingId(2)}
                          className={`relative inline-block px-2 py-0.5 border-2 border-dashed rounded cursor-pointer transition-all ${
                            selectedFindingId === 2
                              ? 'border-[#6F3DFF] bg-[#F0EBFF] ring-2 ring-[#6F3DFF]/40 font-bold text-[#4922C7]'
                              : 'border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                          }`}
                        >
                          13 March 2024
                          <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#6F3DFF] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow-xs">
                            2
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conditions footnote */}
                  <p className="text-[9px] font-sans italic text-gray-600">
                    This certificate is issued subject to the conditions overleaf and may be withdrawn if any change is made to the premises without prior intimation.
                  </p>

                  {/* Bottom Row: QR Code (Callout 4) & Official Seal (Callout 1) */}
                  <div className="flex items-center justify-between pt-6">
                    {/* CALLOUT 4: QR Code */}
                    <div
                      onClick={() => setSelectedFindingId(4)}
                      className={`relative p-2 border-2 border-dashed rounded cursor-pointer transition-all ${
                        selectedFindingId === 4
                          ? 'border-[#6F3DFF] bg-[#F0EBFF] ring-2 ring-[#6F3DFF]/40'
                          : 'border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                      }`}
                    >
                      <div className="w-16 h-16 border border-black bg-gray-50 flex flex-col justify-between p-1">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 bg-black" />
                          <div className="w-4 h-4 bg-black" />
                        </div>
                        <div className="w-3 h-3 bg-black self-center" />
                        <div className="flex justify-between">
                          <div className="w-4 h-4 bg-black" />
                          <div className="w-2 h-2 bg-black" />
                        </div>
                      </div>
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#6F3DFF] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow-xs">
                        4
                      </span>
                    </div>

                    {/* CALLOUT 1: Official Seal Area (Photoshop anomaly) */}
                    <div
                      onClick={() => setSelectedFindingId(1)}
                      className={`relative p-2.5 border-2 border-dashed rounded cursor-pointer transition-all ${
                        selectedFindingId === 1
                          ? 'border-[#6F3DFF] bg-[#F0EBFF] ring-2 ring-[#6F3DFF]/40'
                          : 'border-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2]'
                      }`}
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#16A34A] bg-[#EBF9F1] flex flex-col items-center justify-center text-center p-1">
                        <span className="text-[8px] font-bold text-[#166534]">FIRE SERVICES</span>
                        <span className="text-[7.5px] font-semibold text-[#166534]">OFFICIAL SEAL</span>
                        <span className="text-[7px] italic text-[#686B7A] mt-1">Fire Officer</span>
                      </div>
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#6F3DFF] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow-xs">
                        1
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Genuine uploaded document / other files */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#E3E5EC] flex items-center justify-center text-[#6F3DFF] shadow-xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#171827]">{selectedDoc?.filename || 'Document File'}</h4>
                  <p className="text-xs text-[#686B7A] max-w-sm mt-1">
                    Format: {selectedDoc?.mime_type} · Size: {selectedDoc?.file_size_formatted} · Language: {selectedDoc?.detected_language}
                  </p>
                  {selectedDoc?.sha256_hash && (
                    <p className="text-[10px] font-mono text-[#888A98] mt-1.5 bg-white px-2 py-0.5 rounded border border-[#E3E5EC] inline-block">
                      SHA-256: {selectedDoc.sha256_hash.slice(0, 32)}...
                    </p>
                  )}
                </div>

                {selectedFinding?.evidence_text && (
                  <div className="max-w-md w-full p-3.5 bg-white border border-[#BFE9FF] rounded-xl text-left text-xs space-y-1.5 shadow-2xs">
                    <p className="font-bold text-[#6F3DFF] text-[11px] uppercase tracking-wider">
                      Evidence Reference (Page {selectedFinding.page_number || 1}):
                    </p>
                    <pre className="text-[11px] font-mono text-[#171827] whitespace-pre-wrap bg-[#F7F8FC] p-2.5 rounded-lg border border-[#E3E5EC]">
                      {selectedFinding.evidence_text}
                    </pre>
                  </div>
                )}

                {selectedDoc?.file_path && (
                  <a
                    href={selectedDoc.file_path}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-white border border-[#E3E5EC] rounded-xl text-xs font-semibold text-[#6F3DFF] hover:bg-[#F7F8FC] inline-flex items-center gap-2 shadow-2xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Uploaded Document File</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Evidence Footer metadata */}
          <div className="p-3 bg-[#F7F8FC] border-t border-[#E3E5EC] flex flex-wrap items-center justify-between text-[11px] text-[#686B7A] gap-2">
            <span>Page 1 of {selectedDoc?.page_count || 1} · Preserved immutable at rest in SQLite</span>
            <span className="font-medium text-[#171827]">Viewed by Authorized Scrutiny Officer</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: FINDINGS, EXTRACTED DATA, SOURCES (5 cols) */}
        {/* ========================================================= */}
        <div className={`lg:col-span-5 space-y-6 ${
          mobileTab === 'evidence' ? 'hidden lg:block' : 'block'
        }`}>
          
          {/* SECTION 1: DYNAMIC FINDINGS */}
          <div className="bg-white rounded-2xl border border-[#E3E5EC] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E5EC]">
              <div>
                <h2 className="font-bold text-sm text-[#171827]">Compliance Findings ({findings.length})</h2>
                <p className="text-[11px] text-[#686B7A]">Click a finding card to highlight corresponding evidence</p>
              </div>
            </div>

            <div className="space-y-3">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className={`rounded-xl border-2 transition-all duration-150 ${
                    selectedFindingId === f.id
                      ? 'border-[#6F3DFF] bg-gradient-to-b from-[#F0EBFF] via-white to-white shadow-md ring-2 ring-[#6F3DFF]/30'
                      : 'border-[#CBD5E1] bg-white hover:border-[#6F3DFF] shadow-2xs'
                  }`}
                >
                  <div
                    onClick={() => setSelectedFindingId(f.id)}
                    className="p-3.5 cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6F3DFF] text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-[#6F3DFF]/30">
                      {f.finding_number || f.callout_marker || '•'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h3 className="font-extrabold text-xs sm:text-[13px] text-[#171827]">
                          {f.title}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <StatusBadge status={f.status} />
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.severity === 'High' ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]' :
                            f.severity === 'Medium' ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' : 
                            'bg-[#EAF8FF] text-[#0369A1] border border-[#BAE6FD]'
                          }`}>
                            {f.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details when selected */}
                  {selectedFindingId === f.id && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#E3E5EC] text-xs">
                      <div>
                        <p className="text-[10px] font-bold text-[#686B7A] uppercase tracking-wider">
                          Why It Was Flagged
                        </p>
                        <p className="text-xs text-[#171827] leading-relaxed mt-1">
                          {f.why_flagged}
                        </p>
                      </div>

                      {f.expected_value && (
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#F7F8FC] rounded-xl border border-[#E3E5EC]">
                          <div>
                            <span className="text-[10px] font-bold text-[#686B7A] uppercase">Expected Value</span>
                            <p className="text-xs font-bold text-[#171827] mt-0.5">{f.expected_value}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-[#686B7A] uppercase">Actual Extracted</span>
                            <p className="text-xs font-bold text-[#DC2626] mt-0.5">{f.actual_value || "Discrepant"}</p>
                          </div>
                        </div>
                      )}

                      {f.evidence_text && (
                        <div>
                          <p className="text-[10px] font-bold text-[#686B7A] uppercase tracking-wider">
                            Evidence Snippet
                          </p>
                          <pre className="mt-1 p-2.5 bg-[#F7F8FC] border border-[#E3E5EC] rounded-xl text-[11px] font-mono text-[#171827] leading-relaxed whitespace-pre-wrap">
                            {f.evidence_text}
                          </pre>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-bold text-[#686B7A] uppercase tracking-wider">
                          Rule & Regulatory Reference
                        </p>
                        <p className="text-xs text-[#171827] mt-0.5 font-medium">
                          {f.rule_name} · <span className="text-[#686B7A]">{f.category || "Regulatory Compliance"}</span>
                        </p>
                      </div>

                      {f.suggested_next_step && (
                        <div>
                          <p className="text-[10px] font-bold text-[#686B7A] uppercase tracking-wider">
                            Recommended Next Step
                          </p>
                          <p className="text-xs text-[#484A54] leading-relaxed mt-0.5 font-medium">
                            {f.suggested_next_step}
                          </p>
                        </div>
                      )}

                      {f.confirmed_by_reviewer && (
                        <div className="p-2.5 bg-[#EBF9F1] border border-[#BBF7D0] rounded-xl text-[11px] text-[#166534] font-semibold flex items-center gap-1.5">
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Confirmed by Scrutiny Officer ({f.reviewer_note || "Flag verified"})</span>
                        </div>
                      )}

                      {f.dismissed_by_reviewer && (
                        <div className="p-2.5 bg-[#F2F3F5] border border-[#E3E5EC] rounded-xl text-[11px] text-[#484A54] font-semibold flex items-center gap-1.5">
                          <X className="w-4 h-4" />
                          <span>Dismissed: {f.reviewer_note}</span>
                        </div>
                      )}

                      {/* Officer Actions on Finding */}
                      {!f.confirmed_by_reviewer && !f.dismissed_by_reviewer && (
                        <div className="flex items-center gap-2 pt-1.5">
                          <button
                            onClick={() => handleConfirm(f.id)}
                            className="px-3.5 py-2 bg-[#6F3DFF] hover:bg-[#5A2CE3] text-white rounded-xl text-xs font-bold shadow-xs transition-colors min-h-[36px]"
                          >
                            Confirm Finding
                          </button>
                          <button
                            onClick={() => {
                              setActiveDismissFindingId(f.id);
                              setDismissModalOpen(true);
                            }}
                            className="px-3.5 py-2 bg-white border border-[#E3E5EC] hover:bg-[#F7F8FC] text-[#171827] rounded-xl text-xs font-bold transition-colors min-h-[36px]"
                          >
                            Dismiss with Note
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {findings.length === 0 && (
                <div className="p-4 bg-[#EBF9F1] border border-[#BBF7D0] rounded-xl text-center text-xs text-[#166534] font-semibold">
                  ✓ No compliance anomalies or discrepancies flagged for this application.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: DYNAMIC EXTRACTED DATA */}
          <div className="bg-white rounded-2xl border border-[#E3E5EC] shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E5EC]">
              <div>
                <h2 className="font-bold text-sm text-[#171827]">Extracted Regulatory Fields</h2>
                <p className="text-[11px] text-[#686B7A]">
                  {selectedDoc?.filename || 'Document'} · OCR: {selectedDoc?.ocr_status || 'not_required'}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {(selectedDoc?.extracted_fields || []).map((fld) => (
                <div key={fld.id} className="flex items-start justify-between py-2 border-b border-[#F2F3F5] gap-3">
                  <div>
                    <p className="text-[11px] text-[#686B7A] font-medium">{fld.field_name}</p>
                    <p className="font-bold text-[#171827] mt-0.5">{fld.field_value}</p>
                    <p className="text-[10.5px] text-[#888A98]">{fld.validation_message || "Validated against master records"}</p>
                  </div>
                  <StatusBadge status={fld.validation_status} />
                </div>
              ))}
              {(!selectedDoc?.extracted_fields || selectedDoc.extracted_fields.length === 0) && (
                <div className="py-4 text-center text-xs text-[#888A98]">
                  Select a document in the dossier tab to review extracted regulatory fields.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: DYNAMIC VERIFICATION SOURCES */}
          <div className="bg-white rounded-2xl border border-[#E3E5EC] shadow-2xs p-5 space-y-3">
            <div className="pb-2 border-b border-[#E3E5EC]">
              <h2 className="font-bold text-sm text-[#171827]">Issuing Authority Verification Gateways</h2>
              <p className="text-[11px] text-[#686B7A]">Authoritative queries with explicit simulated integration indicators</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E3E5EC] bg-[#FAFAFB]">
                <div>
                  <p className="font-bold text-[#171827]">AICTE Institutional Master Record</p>
                  <p className="text-[11px] text-[#686B7A]">Central Database Sync · Mode: SIMULATED</p>
                </div>
                <StatusBadge status={mismatchCount > 0 ? "Mismatch detected" : "Verified"} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E3E5EC] bg-[#FAFAFB]">
                <div>
                  <p className="font-bold text-[#171827]">State Fire Services Portal (QR Code)</p>
                  <p className="text-[11px] text-[#686B7A]">Fire Safety Registry Gateway · Mode: SIMULATED</p>
                </div>
                <StatusBadge status={pendingCount > 0 ? "Source unavailable" : "Verified"} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E3E5EC] bg-[#FAFAFB]">
                <div>
                  <p className="font-bold text-[#171827]">Document Metadata & Struct Tree</p>
                  <p className="text-[11px] text-[#686B7A]">PyMuPDF Header & Producer Inspection</p>
                </div>
                <StatusBadge status={findings.some(f => f.category === 'Document Forensics') ? "Manual review required" : "Verified"} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM SECTION: OFFICER NOTE & YOUR DECISION */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-b from-white to-[#F8FAFC] p-5 sm:p-6 rounded-2xl border-2 border-[#CBD5E1] shadow-md">
        {/* Officer Note Textarea (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          <label className="font-extrabold text-sm text-[#171827] block">
            Official Scrutiny Note
          </label>
          <textarea
            rows={4}
            value={officerNote}
            onChange={(e) => setOfficerNote(e.target.value)}
            placeholder="Record your scrutiny observations here. This note is cryptographically committed to the tamper-evident audit ledger."
            className="w-full p-3.5 bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] text-[#171827] font-medium placeholder-[#686B7A] focus:outline-none focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:bg-white resize-none transition-all"
          />
        </div>

        {/* Your Decision Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-[#171827]">Scrutiny Official Decision</h3>
            <p className="text-[11px] text-[#686B7A] mt-0.5 leading-relaxed font-medium">
              The automated platform never approves or rejects. The legal decision strictly remains with the authorized official.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleDecision('rectification')}
              className="w-full py-2.5 px-4 text-xs font-black text-white bg-gradient-to-r from-[#4922C7] to-[#6F3DFF] hover:from-[#3B1796] hover:to-[#5A2CE3] active:bg-[#4922C7] rounded-xl shadow-md shadow-[#6F3DFF]/30 transition-all text-center min-h-[42px]"
            >
              Request Rectification from Institution
            </button>
            <button
              onClick={() => handleDecision('escalation')}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#171827] bg-white border-2 border-[#CBD5E1] hover:bg-[#F0EBFF] hover:border-[#6F3DFF] rounded-xl transition-all text-center min-h-[42px]"
            >
              Escalate for Physical Inspection (EVC)
            </button>
            <button
              onClick={() => handleDecision('reviewed')}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#484A54] bg-[#E2E8F0] hover:bg-[#CBD5E1] rounded-xl transition-all text-center min-h-[42px]"
            >
              Mark Preliminary Review Completed
            </button>
          </div>
        </div>
      </div>

      {/* Dismiss Finding Modal */}
      {dismissModalOpen && (
        <div className="fixed inset-0 bg-[#171827]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-[#E3E5EC]">
            <div>
              <h3 className="font-bold text-base text-[#171827]">
                Dismiss Finding #{activeDismissFindingId}
              </h3>
              <p className="text-xs text-[#686B7A] mt-1 leading-relaxed">
                A mandatory recorded justification is required to dismiss automated compliance flags. This note will be permanently preserved in the cryptographic audit trail.
              </p>
            </div>
            <textarea
              rows={3}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="Enter official scrutiny reason for dismissal..."
              className="w-full p-3 border border-[#E3E5EC] rounded-xl text-xs sm:text-[13px] text-[#171827] focus:ring-2 focus:ring-[#6F3DFF] focus:border-[#6F3DFF] focus:outline-none"
            />
            <div className="flex justify-end gap-2.5 text-xs font-bold pt-1">
              <button
                onClick={() => setDismissModalOpen(false)}
                className="px-4 py-2.5 border border-[#E3E5EC] rounded-xl text-[#484A54] hover:bg-[#F2F3F5] transition-colors min-h-[38px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissSubmit}
                className="px-4 py-2.5 bg-[#6F3DFF] text-white rounded-xl hover:bg-[#5A2CE3] transition-colors min-h-[38px] shadow-xs shadow-[#6F3DFF]/25"
              >
                Confirm Dismissal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Disclaimer */}
      <DisclaimerBanner />
    </div>
  );
};
