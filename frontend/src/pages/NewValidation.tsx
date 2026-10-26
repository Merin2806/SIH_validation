import React, { useState, useRef } from 'react';
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
  File
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { uploadApplicationDocument } from '../api/client';

export const NewValidation: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [institutionName, setInstitutionName] = useState('Meridian Institute of Technology');
  const [category, setCategory] = useState('Extension of Approval (EoA)');
  const [uploading, setUploading] = useState(false);

  // Initial demo documents matching Reference Image 2
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      name: 'EoA_application_letter.pdf',
      size: '1.2 MB',
      lang: 'English',
      type: 'Application letter',
      status: 'Extracted'
    },
    {
      id: 'doc-2',
      name: 'Affidavit_notarised.pdf',
      size: '2.4 MB',
      lang: 'Hindi + English',
      type: 'Affidavit',
      status: 'Translated'
    },
    {
      id: 'doc-3',
      name: 'Accreditation_certificate.pdf',
      size: '1.1 MB',
      lang: 'English',
      type: 'Accreditation',
      status: 'Extracted'
    },
    {
      id: 'doc-4',
      name: 'Land_ownership_deed.pdf',
      size: '2.6 MB',
      lang: 'Marathi + English',
      type: 'Land document',
      status: 'Translated'
    },
    {
      id: 'doc-5',
      name: 'Fire_NOC_2021.pdf',
      size: '0.9 MB',
      lang: 'English',
      type: 'NOC (Fire)',
      status: 'Extracted'
    },
    {
      id: 'doc-6',
      name: 'Lab_block_floorplan.png',
      size: '3.1 MB',
      lang: 'Image',
      type: 'Floor plan',
      status: 'Queued'
    }
  ]);

  // 12 Checklist items
  const checklistItems = [
    { name: 'Application letter', source: 'Uploaded', status: 'Passed' },
    { name: 'Affidavit / undertaking', source: 'Uploaded', status: 'Passed' },
    { name: 'Accreditation certificate', source: 'Uploaded', status: 'Passed' },
    { name: 'Land ownership document', source: 'Uploaded', status: 'Passed' },
    { name: 'Fire NOC', source: 'Uploaded', status: 'Expired' },
    { name: 'Floor plan', source: 'Uploaded', status: 'Checking' },
    { name: 'Infrastructure photographs', source: 'Not uploaded', status: 'Missing' },
    { name: 'Previous EoA status', source: 'AICTE records', status: 'Passed' },
    { name: 'Approved programmes and intake', source: 'AICTE records', status: 'Passed' },
    { name: 'Faculty records', source: 'AICTE records', status: 'Passed' },
    { name: 'TER payment status', source: 'AICTE records', status: 'Passed' },
    { name: 'Compliance and deficiency status', source: 'AICTE records', status: 'Passed' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate file size and type
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25 MB limit");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await uploadApplicationDocument('EoA-2026-00418', formData);
      
      // Add to UI list
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setDocuments(prev => [
        ...prev,
        {
          id: res.document_id || `doc-${Date.now()}`,
          name: file.name,
          size: sizeStr,
          lang: res.detected_language || 'English',
          type: res.detected_type || 'Uploaded Document',
          status: 'Extracted'
        }
      ]);
    } catch (err: any) {
      console.error("Upload failed", err);
      // Fallback add for responsive UI demo
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      setDocuments(prev => [
        ...prev,
        {
          id: `doc-${Date.now()}`,
          name: file.name,
          size: sizeStr,
          lang: 'English',
          type: 'Additional Document',
          status: 'Extracted'
        }
      ]);
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#52737c]">
        <Link to="/" className="hover:underline">Validation queue</Link>
        <span>/</span>
        <span className="text-[#19363d] font-semibold">New validation</span>
      </nav>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-[#14323b] tracking-tight">New validation</h1>
        <p className="text-xs sm:text-sm text-[#4b6a73] mt-0.5 max-w-3xl leading-relaxed">
          Upload the application documents. Satyapan detects the category, applies the matching checklist, pulls existing records from authorised AICTE systems and starts the preliminary scrutiny.
        </p>
      </div>

      {/* Top 2 Columns: Application Details (Left) + Validation in Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Application Details (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-[#14323b]">Application details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#3b5d66] mb-1">
                Institution
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f5f8f9] border border-[#d6e3e7] rounded-lg text-xs sm:text-sm text-[#14323b] font-medium focus:outline-none focus:ring-1 focus:ring-teal-600 focus:bg-white"
              />
              <p className="text-[11px] text-[#63848e] mt-1">
                Record retrieved from AICTE systems
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3b5d66] mb-1">
                Application category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#d6e3e7] rounded-lg text-xs sm:text-sm text-[#14323b] font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                <option value="Increase in intake">Increase in intake</option>
                <option value="New course">New course / Program addition</option>
                <option value="Establishment of New Technical Institution">Establishment of New Technical Institution</option>
                <option value="Closure of Institution">Closure of Institution / Course</option>
              </select>
              <p className="text-[11px] text-[#2e7d32] mt-1 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Auto-detected from uploaded letter · change if incorrect</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Validation In Progress + Secure Handling (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#14323b]">Validation in progress</span>
              <span className="text-xs font-bold text-[#23535d]">60%</span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#276874] w-[60%] transition-all duration-500 rounded-full" />
            </div>

            {/* Steps list */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#276874] text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-[#14323b]">Scanning documents</p>
                  <p className="text-[11px] text-[#6b8991]">6 files classified by type</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-[#276874] text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <p className="font-semibold text-[#14323b]">Extracting data</p>
                  <p className="text-[11px] text-[#6b8991]">Names, IDs, dates and validity read</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-[#a6c7ce] text-[#276874] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                </div>
                <div>
                  <p className="font-semibold text-[#294c54]">Cross-referencing AICTE records</p>
                  <p className="text-[11px] text-[#6b8991]">Previous EoA, intake, faculty, TER payment</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-[#a6c7ce] text-[#276874] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                </div>
                <div>
                  <p className="font-semibold text-[#294c54]">Verifying with issuing authorities</p>
                  <p className="text-[11px] text-[#6b8991]">QR codes and reference numbers</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border-2 border-[#a6c7ce] text-[#276874] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                </div>
                <div>
                  <p className="font-semibold text-[#294c54]">Analysing for alterations</p>
                  <p className="text-[11px] text-[#6b8991]">Metadata, duplicates and visual checks</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/reviewer/EoA-2026-00418')}
                className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-white bg-[#255e69] hover:bg-[#1d4d56] rounded-lg shadow-sm transition-colors text-center"
              >
                Preview results
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2 px-3 text-xs sm:text-sm font-semibold text-[#255e69] bg-white border border-[#cad9de] hover:bg-[#f6f9fa] rounded-lg transition-colors text-center"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Secure Handling card */}
          <div className="bg-[#e4eef1] p-4 rounded-xl border border-[#cbe0e6] flex items-start gap-3">
            <Lock className="w-4 h-4 text-[#204a53] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#204a53]">
              <span className="font-bold block text-xs mb-0.5">Secure handling</span>
              <p className="text-[11px] leading-relaxed text-[#355b63]">
                Only authorised, role-based sources are queried. Documents are encrypted at rest, every access is logged and nothing is shared outside permitted AICTE systems.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Supporting Documents Card */}
      <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-[#14323b]">Supporting documents</h2>
          <span className="text-xs text-[#52747d] font-medium">{documents.length} files · 11.4 MB</span>
        </div>

        {/* Drag and drop upload zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#b6d4db] bg-[#f8fbfa] hover:bg-[#f0f6f7] p-7 rounded-xl text-center cursor-pointer transition-colors space-y-2"
        >
          <div className="w-10 h-10 rounded-full bg-[#dbeff2] text-[#23535d] flex items-center justify-center mx-auto">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-semibold text-[#183941]">
              Drag documents here, or{' '}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#23535d] underline">
              browse files
            </span>
          </div>
          <p className="text-[11px] text-[#63848e]">
            PDF, JPG, PNG or MP4 · up to 25 MB each · stored encrypted, access logged
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
          />
        </div>

        {/* Multilingual parsing banner */}
        <div className="p-3 bg-[#e8eff2] border border-[#d2e0e5] rounded-lg flex items-start gap-3">
          <Globe className="w-4 h-4 text-[#26626f] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#204a53] leading-relaxed">
            <span className="font-bold">Multilingual parsing is on.</span> Hindi, Marathi and mixed-language documents are translated into English checklist fields. The original is always kept as evidence.
          </p>
        </div>

        {/* Document items list */}
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[#e5eff2] hover:bg-[#f8fafb] transition-colors gap-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-[#f0f5f7] border border-[#d7e5eb] flex items-center justify-center text-[#204a53] flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#14323b] truncate">{doc.name}</p>
                  <p className="text-[11px] text-[#6b8991]">
                    {doc.size} · {doc.lang}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0f5f7] text-[#305963] border border-[#d8e6eb]">
                  {doc.type}
                </span>

                <StatusBadge status={doc.status} />

                <button
                  onClick={() => removeDoc(doc.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Remove document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Card: Checklist Applied · Extension of Approval */}
      <div className="bg-white p-5 rounded-xl border border-[#e1eaed] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-[#14323b]">Checklist applied · Extension of Approval</h2>
            <p className="text-[11px] text-[#6b8991]">Rules are configurable and follow the Approval Process Handbook for this category.</p>
          </div>
          <span className="px-3 py-1 bg-[#e7f5ea] text-[#1c7836] border border-[#c1e7c9] rounded-full text-xs font-bold">
            9 of 12 passed
          </span>
        </div>

        {/* 12 Checklist cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-[#e6eff2] bg-[#fbfdfd] flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-bold text-[#14323b]">{item.name}</p>
                <p className="text-[11px] text-[#6c8c95]">{item.source}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
