export interface Application {
  id: string;
  institution_name: string;
  institution_code?: string;
  category: string;
  submission_date: string;
  overall_status: string;
  checks_passed: number;
  checks_total: number;
  officer_note?: string;
  decision_status?: string;
  created_at: string;
  documents?: UploadedDocument[];
  checks?: ValidationCheck[];
  findings?: Finding[];
  audit_events?: AuditEvent[];
}

export interface UploadedDocument {
  id: string;
  application_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_size_formatted: string;
  mime_type: string;
  sha256_hash?: string;
  detected_type: string;
  detected_language: string;
  processing_status: string;
  is_duplicate: boolean;
  ocr_used?: boolean;
  ocr_status?: string;
  page_count: number;
  extracted_fields?: ExtractedField[];
  findings?: Finding[];
}

export interface ExtractedField {
  id: number;
  field_name: string;
  field_value: string;
  normalized_value?: string;
  confidence: number;
  page_number: number;
  validation_status: string;
  validation_message?: string;
  bounding_box?: { x: number; y: number; w: number; h: number };
}

export interface Finding {
  id: number;
  finding_number: number;
  rule_id?: string;
  category?: string;
  title: string;
  status: string;
  severity: string;
  why_flagged: string;
  expected_value?: string;
  actual_value?: string;
  evidence_text?: string;
  page_number?: number;
  rule_name: string;
  suggested_next_step?: string;
  ai_generated: boolean;
  callout_marker?: number;
  callout_coordinates?: { top: number; left: number; width: number; height: number };
  confirmed_by_reviewer: boolean;
  dismissed_by_reviewer: boolean;
  reviewer_note?: string;
  created_at: string;
}

export interface ValidationCheck {
  id: number;
  checklist_item: string;
  source_type: string;
  status: string;
  details?: string;
  order_index: number;
}

export interface VerificationSource {
  id: string;
  name: string;
  source_type: string;
  supported_doc: string;
  integration_mode: string;
  status: string;
  last_checked_at: string;
  details?: string;
  methods: string[];
}

export interface AuditEvent {
  id: number;
  application_id: string;
  document_id?: string;
  finding_id?: number;
  correlation_id?: string;
  timestamp: string;
  actor: string;
  action: string;
  outcome: string;
  evidence_ref?: string;
  source_mode: string;
  details?: string;
  prev_hash?: string;
  hash?: string;
}

export interface ValidationRule {
  id: string;
  code: string;
  category: string;
  name: string;
  description: string;
  required_evidence: string;
  severity: string;
  is_active: boolean;
  version: string;
  updated_at: string;
}

export interface QueueMetrics {
  in_queue: number;
  clear_to_proceed: number;
  needs_manual_review: number;
  anomalies_flagged: number;
  expired_documents?: number;
  avg_validation_time: string;
}

export interface AlertItem {
  id: string;
  application_id: string;
  institution_name: string;
  doc_type: string;
  alert_type: string;
  severity: string;
  message: string;
  time_ago: string;
  finding_id?: number;
}
