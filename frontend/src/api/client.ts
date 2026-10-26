import axios from 'axios';
import {
  Application,
  QueueMetrics,
  ValidationRule,
  VerificationSource,
  AlertItem,
  AuditEvent
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export const fetchMetrics = async (): Promise<QueueMetrics> => {
  const res = await api.get('/applications/metrics');
  return res.data;
};

export const fetchApplications = async (params?: { q?: string; filter_status?: string; page?: number; limit?: number }): Promise<{ items: Application[]; total: number }> => {
  const res = await api.get('/applications', { params });
  return res.data;
};

export const fetchApplication = async (appId: string): Promise<Application> => {
  const res = await api.get(`/applications/${appId}`);
  return res.data;
};

export const createApplication = async (data: { institution_name: string; category: string; institution_code?: string; id?: string }): Promise<Application> => {
  const res = await api.post('/applications', data);
  return res.data;
};

export const uploadApplicationDocument = async (appId: string, formData: FormData) => {
  const res = await api.post(`/applications/${appId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const confirmFinding = async (findingId: number, note: string) => {
  const res = await api.post(`/findings/${findingId}/confirm`, { note });
  return res.data;
};

export const dismissFinding = async (findingId: number, note: string) => {
  const res = await api.post(`/findings/${findingId}/dismiss`, { note });
  return res.data;
};

export const requestRectification = async (appId: string, note: string) => {
  const res = await api.post(`/applications/${appId}/request-rectification`, { note });
  return res.data;
};

export const escalateInspection = async (appId: string, note: string) => {
  const res = await api.post(`/applications/${appId}/escalate-inspection`, { note });
  return res.data;
};

export const completeReview = async (appId: string, note: string) => {
  const res = await api.post(`/applications/${appId}/complete-review`, { note });
  return res.data;
};

export const fetchRules = async (): Promise<ValidationRule[]> => {
  const res = await api.get('/rules');
  return res.data;
};

export const toggleRule = async (ruleId: string, isActive: boolean) => {
  const res = await api.post(`/rules/${ruleId}/toggle`, { is_active: isActive });
  return res.data;
};

export const fetchSources = async (): Promise<VerificationSource[]> => {
  const res = await api.get('/sources');
  return res.data;
};

export const testSource = async (sourceId: string, identifier?: string) => {
  const res = await api.post(`/sources/${sourceId}/test`, null, {
    params: { identifier }
  });
  return res.data;
};

export const fetchAlerts = async (alertType?: string): Promise<AlertItem[]> => {
  const res = await api.get('/alerts', { params: { alert_type: alertType } });
  return res.data;
};

export const fetchAuditEvents = async (params?: { application_id?: string; actor?: string; q?: string }): Promise<AuditEvent[]> => {
  const res = await api.get('/audit', { params });
  return res.data;
};

export const verifyAuditIntegrity = async (applicationId?: string): Promise<{ valid: boolean; events_checked: number; message: string }> => {
  const res = await api.get('/audit/verify', { params: { application_id: applicationId } });
  return res.data;
};

export default api;
