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
  FileText
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
import { Application, Finding } from '../types';

export const DocumentReviewer: React.FC = () => {
  const { id = 'EoA-2026-00418' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [activeDocTab, setActiveDocTab] = useState<'Fire NOC' | 'Affidavit' | 'Accreditation' | 'Land deed' | 'Floor plan'>('Fire NOC');
  const [selectedFindingId, setSelectedFindingId] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [officerNote, setOfficerNote] = useState<string>('');
  const [dismissReason, setDismissReason] = useState<string>('');
  const [dismissModalOpen, setDismissModalOpen] = useState<boolean>(false);
  const [activeDismissFindingId, setActiveDismissFindingId] = useState<number | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
        const res = await requestRectification(id, officerNote);
        setDecisionFeedback("Rectification request recorded and dispatched to institution.");
      } else if (type === 'escalation') {
        const res = await escalateInspection(id, officerNote);
        setDecisionFeedback("Physical inspection escalation registered for Expert Visit Committee (EVC).");
      } else {
        const res = await completeReview(id, officerNote);
        setDecisionFeedback("Preliminary scrutiny marked as completed by Scrutiny Officer.");
      }
      loadApp();
    } catch (err) {
      console.error("Decision action failed", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[#52737c]">
            <Link to="/" className="hover:underline">Validation queue</Link>
            <span>/</span>
            <span className="text-[#19363d] font-semibold">Document reviewer</span>
          </nav>
          <h1 className="text-2xl font-bold text-[#14323b] tracking-tight mt-1">
            {application?.institution_name || 'Meridian Institute of Technology'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
            <span className="font-semibold text-[#185361] px-2.5 py-0.5 bg-[#eaf2f5] rounded-full border border-[#d2e3eb]">
              {id}
            </span>
            <span className="text-[#3b5e67] px-2.5 py-0.5 bg-[#f0f5f7] rounded-full border border-[#dce6eb]">
              {application?.category || 'Extension of Approval'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#fdeeee] text-[#ba2435] border border-[#f8c8cb] font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>! Manual review required</span>
            </span>
            <span className="text-[#64848d]">Submitted 26 Oct 2026, 14:48</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/audit-trail')}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#204a53] bg-white border border-[#cad9de] rounded-lg hover:bg-[#f6f9fa] shadow-sm transition-colors self-start sm:self-auto"
        >
          <Clock className="w-4 h-4 text-[#204a53]" />
          <span>View audit trail</span>
        </button>
      </div>

      {/* Summary Badges Pill Bar */}
      <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
        <span className="px-3 py-1 rounded-full bg-[#eaf7ec] text-[#1c7836] border border-[#c1e7c9] flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Verified · 9</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-[#fdeeee] text-[#be2335] border border-[#f8c8cb] flex items-center gap-1.5">
          <span>▲</span>
          <span>Mismatch · 1</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-[#fff0ec] text-[#b93f24] border border-[#fcd5cb] flex items-center gap-1.5">
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Expired · 1</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-[#fff8e6] text-[#976800] border border-[#fde8ad] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Pending · 1</span>
        </span>
        <span className="px-3 py-1 rounded-full bg-[#1b353c] text-white flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Needs your review · 4 findings</span>
        </span>
      </div>

      {/* Preliminary Findings Disclaimer */}
      <div className="p-3 bg-[#e8eff2] border border-[#d2e0e5] rounded-lg flex items-start gap-2.5 text-xs text-[#204a53]">
        <Info className="w-4 h-4 text-[#26626f] flex-shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          Findings below are preliminary indicators from automated checks. They are not proof of forgery or misconduct and no adverse action is taken without your review.
        </span>
      </div>

      {/* Decision feedback banner if clicked */}
      {decisionFeedback && (
        <div className="p-3 bg-[#e8f7ec] border border-[#c5ebce] rounded-lg flex items-center justify-between text-xs text-[#1c7836]">
          <span className="font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            {decisionFeedback}
          </span>
          <button onClick={() => setDecisionFeedback(null)} className="text-[#1c7836] font-bold">✕</button>
        </div>
      )}

      {/* TWO COLUMN REVIEW AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================= */}
        {/* LEFT COLUMN: EVIDENCE (7 cols on lg) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#e1eaed] shadow-sm flex flex-col overflow-hidden">
          {/* Evidence Header with Tabs and Zoom */}
          <div className="p-3.5 border-b border-[#e1eaed] flex flex-wrap items-center justify-between gap-2 bg-[#f8fafb]">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-[#14323b] mr-2">Evidence</span>
              {(['Fire NOC', 'Affidavit', 'Accreditation', 'Land deed', 'Floor plan'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveDocTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    activeDocTab === tab
                      ? 'bg-[#255e69] text-white shadow-sm'
                      : 'bg-white text-[#395e67] border border-[#d7e4e9] hover:bg-[#eef4f6]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1.5 text-xs text-[#355b64] font-medium bg-white px-2 py-1 rounded-md border border-[#d7e4e9]">
              <button
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
                className="hover:text-black font-bold px-1"
                title="Zoom out"
              >
                -
              </button>
              <span>{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                className="hover:text-black font-bold px-1"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>

          {/* Document Display Canvas */}
          <div className="flex-1 p-6 bg-[#eaeef0] overflow-auto flex items-center justify-center min-h-[560px]">
            {activeDocTab === 'Fire NOC' ? (
              /* Fire NOC Document Rendered with Interactive Evidence Callout Regions */
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="relative w-[520px] min-h-[660px] bg-white border border-[#c4d3d8] shadow-md p-8 text-[#111111] font-serif transition-transform duration-200"
              >
                {/* Outer Document Border */}
                <div className="border border-gray-400 p-6 min-h-[600px] flex flex-col justify-between relative">
                  
                  {/* Top Seal */}
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full border-2 border-[#204a53] mx-auto flex items-center justify-center text-[10px] font-sans font-bold text-[#204a53]">
                      SFS
                    </div>
                    <h2 className="text-xs font-sans font-bold tracking-wider text-[#14323b] uppercase">
                      State Fire Services Department
                    </h2>
                    <p className="text-[9px] font-sans text-gray-500">
                      Sample issuing authority · demo document
                    </p>
                    <h3 className="text-xs font-sans font-bold text-gray-900 pt-2 tracking-wide">
                      NO OBJECTION CERTIFICATE — FIRE SAFETY
                    </h3>
                  </div>

                  {/* Body text with Callout Marker 3 (Institution Name Mismatch) */}
                  <div className="text-[11px] font-serif leading-relaxed text-gray-800 pt-3 relative">
                    <span>This is to certify that the building(s) of </span>
                    
                    {/* CALLOUT 3: Institution Name */}
                    <span
                      onClick={() => setSelectedFindingId(3)}
                      className={`relative inline-block px-1 border-2 border-dashed rounded cursor-pointer transition-all ${
                        selectedFindingId === 3
                          ? 'border-red-600 bg-red-100/60 ring-2 ring-red-400 font-bold'
                          : 'border-red-500 bg-red-50/40 hover:bg-red-100/50'
                      }`}
                    >
                      Meridian Inst. of Technology & Research
                      <span className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#14323b] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow">
                        3
                      </span>
                    </span>

                    <span> situated at Plot 14, Education Park Road, Demo City, have been inspected and found to meet the fire safety requirements applicable to educational buildings.</span>
                  </div>

                  {/* Table with Callout Marker 2 (Valid until Date) */}
                  <div className="border border-gray-400 text-[10.5px] font-sans my-4">
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
                              ? 'border-red-600 bg-red-100/60 ring-2 ring-red-400 font-bold'
                              : 'border-red-500 bg-red-50/40 hover:bg-red-100/50'
                          }`}
                        >
                          13 March 2024
                          <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#14323b] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow">
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
                          ? 'border-red-600 bg-red-100/60 ring-2 ring-red-400'
                          : 'border-red-500 bg-red-50/30 hover:bg-red-100/40'
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
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#14323b] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow">
                        4
                      </span>
                    </div>

                    {/* CALLOUT 1: Official Seal Area (Photoshop anomaly) */}
                    <div
                      onClick={() => setSelectedFindingId(1)}
                      className={`relative p-2.5 border-2 border-dashed rounded cursor-pointer transition-all ${
                        selectedFindingId === 1
                          ? 'border-red-600 bg-red-100/60 ring-2 ring-red-400'
                          : 'border-red-500 bg-red-50/30 hover:bg-red-100/40'
                      }`}
                    >
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1f7335] bg-[#edf8ef] flex flex-col items-center justify-center text-center p-1">
                        <span className="text-[8px] font-bold text-[#165827]">FIRE SERVICES</span>
                        <span className="text-[7.5px] font-semibold text-[#165827]">OFFICIAL SEAL</span>
                        <span className="text-[7px] italic text-gray-500 mt-1">Fire Officer</span>
                      </div>
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#14323b] text-white rounded-full text-[9px] font-sans font-bold flex items-center justify-center shadow">
                        1
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* Other Tabs: Showing actual synthetic uploaded documents */
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <FileText className="w-12 h-12 text-[#255e69]" />
                <div>
                  <h4 className="font-bold text-sm text-[#14323b]">{activeDocTab} Document</h4>
                  <p className="text-xs text-[#52737c] max-w-sm mt-1">
                    Uploaded document preserved in genuine immutable format. Click Fire NOC to review the flagged regulatory evidence.
                  </p>
                </div>
                <a
                  href={`/uploads/${activeDocTab.replace(/\s+/g, '_')}_demo.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-[#cad9de] rounded-md text-xs font-semibold text-[#255e69] hover:bg-gray-50 inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open raw source file</span>
                </a>
              </div>
            )}
          </div>

          {/* Evidence Footer metadata */}
          <div className="p-3 bg-[#f8fafb] border-t border-[#e1eaed] flex items-center justify-between text-[11px] text-[#55767f]">
            <span>Page 1 of 1 · Original file kept unaltered</span>
            <span>Viewed by S. Officer · access logged</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: FINDINGS, EXTRACTED DATA, SOURCES (5 cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* SECTION 1: FINDINGS */}
          <div className="bg-white rounded-xl border border-[#e1eaed] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#edf3f5]">
              <h2 className="font-bold text-sm text-[#14323b]">Findings</h2>
              <span className="text-[11px] text-[#6b8991]">Select a finding to see it on the document</span>
            </div>

            <div className="space-y-3">
              {/* FINDING 1: Possible alteration near official seal */}
              <div
                className={`rounded-lg border transition-all ${
                  selectedFindingId === 1
                    ? 'border-[#255e69] bg-[#fbfdfd] ring-1 ring-[#255e69]'
                    : 'border-[#e2eaed] bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  onClick={() => setSelectedFindingId(1)}
                  className="p-3.5 cursor-pointer flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#14323b] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-[#14323b]">
                        Possible alteration near the official seal
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#e8f1f5] text-[#195a73] border border-[#cbe1ec] rounded-full text-[10px] font-semibold">
                          ! Manual review required
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                          Severity: High
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details when selected */}
                {selectedFindingId === 1 && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#edf3f5] text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">
                        Why it was flagged
                      </p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        The file was last saved by an image editor rather than scanner or print software, and the seal area has different compression from the rest of the page.
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">
                        Evidence
                      </p>
                      <pre className="mt-1 p-2.5 bg-[#f5f8f9] border border-[#dce6e9] rounded-md text-[11px] font-mono text-[#1a3840] leading-relaxed whitespace-pre-wrap">
Creator tag: Adobe Photoshop 25.1
Last modified: 21 Oct 2026, 18:42
Expected: scanner or print-to-PDF software
                      </pre>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">
                        Rule
                      </p>
                      <p className="text-xs text-[#203a40] mt-0.5">
                        Metadata and visual consistency check
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">
                        Suggested next step
                      </p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        Ask the institution for the original certificate, or confirm with the issuing authority.
                      </p>
                    </div>

                    <div className="p-2 bg-[#f0f5f7] border border-[#d6e3e7] rounded text-[11px] text-[#42646d] italic">
                      AI-generated · preliminary · requires human verification
                    </div>

                    {/* Officer Actions on Finding */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleConfirm(1)}
                        className="px-3.5 py-1.5 bg-[#255e69] hover:bg-[#1d4d56] text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                      >
                        Confirm finding
                      </button>
                      <button
                        onClick={() => {
                          setActiveDismissFindingId(1);
                          setDismissModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-[#cad9de] hover:bg-gray-50 text-[#255e69] rounded-md text-xs font-semibold transition-colors"
                      >
                        Dismiss with note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FINDING 2: Fire NOC validity has ended */}
              <div
                className={`rounded-lg border transition-all ${
                  selectedFindingId === 2
                    ? 'border-[#255e69] bg-[#fbfdfd] ring-1 ring-[#255e69]'
                    : 'border-[#e2eaed] bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  onClick={() => setSelectedFindingId(2)}
                  className="p-3.5 cursor-pointer flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#14323b] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-[#14323b]">
                        Fire NOC validity has ended
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#fff0ec] text-[#b93f24] border border-[#fcd5cb] rounded-full text-[10px] font-semibold">
                          ✕ Expired
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                          Severity: High
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFindingId === 2 && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#edf3f5] text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">Why it was flagged</p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        The Fire NOC expired on 13 Mar 2024. Active fire clearance is mandatory for technical education approval under AICTE Regulations.
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">Suggested next step</p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        Request the institution to upload renewed NOC issued for the current approval session.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => handleConfirm(2)} className="px-3.5 py-1.5 bg-[#255e69] hover:bg-[#1d4d56] text-white rounded-md text-xs font-semibold">
                        Confirm finding
                      </button>
                      <button onClick={() => { setActiveDismissFindingId(2); setDismissModalOpen(true); }} className="px-3.5 py-1.5 bg-white border border-[#cad9de] hover:bg-gray-50 text-[#255e69] rounded-md text-xs font-semibold">
                        Dismiss with note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FINDING 3: Institution name differs from AICTE record */}
              <div
                className={`rounded-lg border transition-all ${
                  selectedFindingId === 3
                    ? 'border-[#255e69] bg-[#fbfdfd] ring-1 ring-[#255e69]'
                    : 'border-[#e2eaed] bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  onClick={() => setSelectedFindingId(3)}
                  className="p-3.5 cursor-pointer flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#14323b] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-[#14323b]">
                        Institution name differs from AICTE record
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#fdeeee] text-[#be2335] border border-[#f8c8cb] rounded-full text-[10px] font-semibold">
                          ▲ Mismatch detected
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                          Severity: Medium
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFindingId === 3 && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#edf3f5] text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">Why it was flagged</p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        Certificate specifies "Meridian Inst. of Technology & Research" whereas AICTE approval is registered as "Meridian Institute of Technology".
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => handleConfirm(3)} className="px-3.5 py-1.5 bg-[#255e69] hover:bg-[#1d4d56] text-white rounded-md text-xs font-semibold">
                        Confirm finding
                      </button>
                      <button onClick={() => { setActiveDismissFindingId(3); setDismissModalOpen(true); }} className="px-3.5 py-1.5 bg-white border border-[#cad9de] hover:bg-gray-50 text-[#255e69] rounded-md text-xs font-semibold">
                        Dismiss with note
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* FINDING 4: Issuing authority could not be reached */}
              <div
                className={`rounded-lg border transition-all ${
                  selectedFindingId === 4
                    ? 'border-[#255e69] bg-[#fbfdfd] ring-1 ring-[#255e69]'
                    : 'border-[#e2eaed] bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  onClick={() => setSelectedFindingId(4)}
                  className="p-3.5 cursor-pointer flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#14323b] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h3 className="font-bold text-xs sm:text-sm text-[#14323b]">
                        Issuing authority could not be reached
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-[#f0f5f7] text-[#365f69] border border-[#d5e3e8] rounded-full text-[10px] font-semibold">
                          — Source unavailable
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                          Severity: Low
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedFindingId === 4 && (
                  <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#edf3f5] text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-[#5c7c85] uppercase tracking-wider">Why it was flagged</p>
                      <p className="text-xs text-[#203a40] leading-relaxed mt-0.5">
                        Automated QR check to State Fire Services verification endpoint timed out after 3 retries (HTTP 504).
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => handleConfirm(4)} className="px-3.5 py-1.5 bg-[#255e69] hover:bg-[#1d4d56] text-white rounded-md text-xs font-semibold">
                        Confirm finding
                      </button>
                      <button onClick={() => { setActiveDismissFindingId(4); setDismissModalOpen(true); }} className="px-3.5 py-1.5 bg-white border border-[#cad9de] hover:bg-gray-50 text-[#255e69] rounded-md text-xs font-semibold">
                        Dismiss with note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: EXTRACTED DATA */}
          <div className="bg-white rounded-xl border border-[#e1eaed] shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#edf3f5]">
              <h2 className="font-bold text-sm text-[#14323b]">Extracted data</h2>
              <span className="text-[11px] text-[#6b8991]">Multilingual vision model · ocr: fitz / tesseract</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between py-1.5 border-b border-gray-100 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500">Institution name</p>
                  <p className="font-bold text-gray-900 mt-0.5">Meridian Inst. of Technology & Research</p>
                  <p className="text-[10.5px] text-gray-500">Compared with AICTE institutional record</p>
                </div>
                <StatusBadge status="Mismatch detected" />
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-gray-100 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500">Certificate number</p>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">FS/NOC/2021/04418</p>
                  <p className="text-[10.5px] text-gray-500">Format valid · issuing portal not reached</p>
                </div>
                <StatusBadge status="Verification pending" />
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-gray-100 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500">Date of issue</p>
                  <p className="font-bold text-gray-900 mt-0.5">14 Mar 2021</p>
                  <p className="text-[10.5px] text-gray-500">Earlier than validity end date</p>
                </div>
                <StatusBadge status="Verified" />
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-gray-100 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500">Valid until</p>
                  <p className="font-bold text-gray-900 mt-0.5">13 Mar 2024</p>
                  <p className="text-[10.5px] text-gray-500">Application date is 26 Oct 2026</p>
                </div>
                <StatusBadge status="Expired" />
              </div>

              <div className="flex items-start justify-between py-1.5 gap-3">
                <div>
                  <p className="text-[11px] text-gray-500">Issuing authority</p>
                  <p className="font-bold text-gray-900 mt-0.5">State Fire Services Department (demo)</p>
                  <p className="text-[10.5px] text-gray-500">Listed in issuing-authority registry</p>
                </div>
                <StatusBadge status="Verified" />
              </div>
            </div>
          </div>

          {/* SECTION 3: VERIFICATION SOURCES */}
          <div className="bg-white rounded-xl border border-[#e1eaed] shadow-sm p-5 space-y-3">
            <div className="pb-1 border-b border-[#edf3f5]">
              <h2 className="font-bold text-sm text-[#14323b]">Verification sources</h2>
              <p className="text-[11px] text-[#6b8991]">Source, timestamp and result are recorded for every check.</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#e8eff2] bg-[#fafcfc]">
                <div>
                  <p className="font-bold text-[#14323b]">AICTE institutional record</p>
                  <p className="text-[11px] text-gray-500">26 Oct 2026 · 15:02:11</p>
                </div>
                <StatusBadge status="Mismatch detected" />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#e8eff2] bg-[#fafcfc]">
                <div>
                  <p className="font-bold text-[#14323b]">Fire Services portal (QR code)</p>
                  <p className="text-[11px] text-gray-500">26 Oct 2026 · 15:03:04</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f0f5f7] text-[#365f69] border border-[#d5e3e8]">
                  — Source unavailable
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[#e8eff2] bg-[#fafcfc]">
                <div>
                  <p className="font-bold text-[#14323b]">Document metadata check</p>
                  <p className="text-[11px] text-gray-500">26 Oct 2026 · 15:03:09</p>
                </div>
                <StatusBadge status="Manual review required" />
              </div>
            </div>

            {/* Bottom Legend Pills */}
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-[#eaf7ec] text-[#1b7332]">Verified</span>
              <span className="px-2 py-0.5 rounded bg-[#fdeeee] text-[#be2335]">Mismatch detected</span>
              <span className="px-2 py-0.5 rounded bg-[#fff0ec] text-[#b93f24]">Expired</span>
              <span className="px-2 py-0.5 rounded bg-[#fff8e6] text-[#976800]">Verification pending</span>
              <span className="px-2 py-0.5 rounded bg-[#f0f5f7] text-[#365f69]">Source unavailable</span>
              <span className="px-2 py-0.5 rounded bg-[#e8f1f5] text-[#195a73]">Manual review required</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM SECTION: OFFICER NOTE & YOUR DECISION */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-xl border border-[#e1eaed] shadow-sm">
        {/* Officer Note Textarea (7 cols) */}
        <div className="lg:col-span-7 space-y-2">
          <label className="font-bold text-sm text-[#14323b] block">
            Officer note
          </label>
          <textarea
            rows={4}
            value={officerNote}
            onChange={(e) => setOfficerNote(e.target.value)}
            placeholder="Add your observations. This note is recorded in the audit trail."
            className="w-full p-3 bg-[#f5f8f9] border border-[#d6e3e7] rounded-lg text-xs sm:text-sm text-[#14323b] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white resize-none"
          />
        </div>

        {/* Your Decision Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#14323b]">Your decision</h3>
            <p className="text-[11px] text-[#6b8991] mt-0.5">
              The platform never approves or rejects. The decision stays with you.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleDecision('rectification')}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#255e69] hover:bg-[#1d4d56] rounded-lg shadow-sm transition-colors text-center"
            >
              Request rectification from institution
            </button>
            <button
              onClick={() => handleDecision('escalation')}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#255e69] bg-white border border-[#cad9de] hover:bg-[#f6f9fa] rounded-lg transition-colors text-center"
            >
              Escalate for physical inspection
            </button>
            <button
              onClick={() => handleDecision('reviewed')}
              className="w-full py-2.5 px-4 text-xs font-bold text-[#44656e] bg-[#eef3f5] hover:bg-[#e4ebed] rounded-lg transition-colors text-center"
            >
              Mark as reviewed
            </button>
          </div>
        </div>
      </div>

      {/* Dismiss Finding Modal */}
      {dismissModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-gray-900">
              Dismiss Finding #{activeDismissFindingId}
            </h3>
            <p className="text-xs text-gray-600">
              A mandatory recorded justification is required to dismiss automated scrutiny flags. This will be preserved in the audit log.
            </p>
            <textarea
              rows={3}
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="Enter official reason for dismissal..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-teal-600 focus:outline-none"
            />
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setDismissModalOpen(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDismissSubmit}
                className="px-4 py-2 bg-[#255e69] text-white rounded-lg hover:bg-[#1d4d56]"
              >
                Confirm dismissal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
