const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  : typeof window !== 'undefined'
    ? window.GUARDIAN_API_BASE_URL || ''
    : '';
const API_PREFIX = '/api/v1';

const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const endpointPath = normalizedPath.startsWith(API_PREFIX)
    ? normalizedPath
    : `${API_PREFIX}${normalizedPath}`;

  return API_BASE ? `${API_BASE}${endpointPath}` : endpointPath;
};

const defaultJsonHeaders = {
  'Content-Type': 'application/json',
};

const parseApiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || response.statusText || 'API request failed';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
};

export const apiRequest = async (path, method = 'GET', body = null, headers = {}, options = {}) => {
  const url = buildApiUrl(path);
  const init = {
    method,
    headers: {
      ...defaultJsonHeaders,
      ...headers,
    },
    ...options,
  };

  if (body !== null && body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, init);
  return parseApiResponse(response);
};

export const fetchIncidents = async () => {
  return apiRequest('/incidents', 'GET');
};

export const reportIncident = async (payload) => {
  return apiRequest('/incidents/report', 'POST', payload);
};

export const updateIncidentStatus = async (id, status) => {
  return apiRequest(`/incidents/${id}/status`, 'PATCH', { status });
};

export const isBrowserOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

export const getOfflineQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem('guardian_offline_queue') || '[]');
  } catch {
    return [];
  }
};

export const setOfflineQueue = (queue) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('guardian_offline_queue', JSON.stringify(queue));
};

export const createOfflineReport = ({ category, latitude, longitude, audioPayload = null, description = '', locationDetails = '', reporterName = 'Anonymous' }) => ({
  id: `offline-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
  category,
  latitude,
  longitude,
  audioPayload,
  description,
  locationDetails,
  reporterName,
  createdAt: new Date().toISOString(),
  status: 'Queued (Offline / Outbox)',
});
