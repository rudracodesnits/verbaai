import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const verbaApi = {
  summarize: async (text: string, apiKey: string, options?: { temperature?: number; maxTokens?: number }) => {
    const response = await api.post('/api/summarize', { text, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  sentiment: async (text: string, apiKey: string, options?: { temperature?: number; maxTokens?: number }) => {
    const response = await api.post('/api/sentiment', { text, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  toxicity: async (text: string, apiKey: string, options?: { temperature?: number; maxTokens?: number }) => {
    const response = await api.post('/api/toxicity', { text, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  keywords: async (text: string, apiKey: string, options?: { temperature?: number; maxTokens?: number }) => {
    const response = await api.post('/api/keywords', { text, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  chat: async (context: string, messages: any[], apiKey: string, options?: { temperature?: number; maxTokens?: number }) => {
    const response = await api.post('/api/chat', { context, messages, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  submitBatchJob: async (
    endpoint: string,
    texts: string[],
    options: { temperature?: number; maxTokens?: number },
    apiKey: string
  ) => {
    const response = await api.post(`/api/batch/${endpoint}`, { texts, ...options }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  getBatchJobStatus: async (jobId: string, apiKey: string) => {
    const response = await api.get(`/api/batch/status/${jobId}`, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  }
};

export const authApi = {
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  googleLogin: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },
  verifyOtp: async (email: string, code: string) => {
    const response = await api.post('/auth/verify-otp', { email, code });
    return response.data;
  },
  resendOtp: async (email: string) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const dashboardApi = {
  getKeys: async () => {
    const response = await api.get('/auth/keys');
    return response.data;
  },
  createKey: async (name: string, scopes?: string[], expiresInDays?: number | null) => {
    const response = await api.post('/auth/keys', { name, scopes, expiresInDays });
    return response.data;
  },
  revokeKey: async (id: string) => {
    const response = await api.delete(`/auth/keys/${id}`);
    return response.data;
  },
  getUsage: async () => {
    const response = await api.get('/auth/usage');
    return response.data;
  },
  getLogs: async (filters?: {
    endpoint?: string;
    statusCode?: number;
    apiKeyId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/auth/logs', { params: filters });
    return response.data;
  },
  createCheckoutSession: async () => {
    const response = await api.post('/auth/create-checkout');
    return response.data;
  },
  upgradeMockTier: async (sessionId: string) => {
    const response = await api.post('/auth/mock-upgrade', { sessionId });
    return response.data;
  },
  getBatchJobs: async (page: number = 1, limit: number = 10) => {
    const response = await api.get('/auth/batch/jobs', { params: { page, limit } });
    return response.data;
  },
  getBatchJobDetails: async (jobId: string) => {
    const response = await api.get(`/auth/batch/jobs/${jobId}`);
    return response.data;
  }
};

export const teamApi = {
  createTeam: async (name: string) => {
    const response = await api.post('/api/teams', { name });
    return response.data;
  },
  getTeams: async () => {
    const response = await api.get('/api/teams');
    return response.data;
  },
  inviteMember: async (teamId: string, email: string) => {
    const response = await api.post(`/api/teams/${teamId}/invite`, { email });
    return response.data;
  }
};

export const alertApi = {
  getAlerts: async () => {
    const response = await api.get('/api/alerts');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/api/alerts/${id}/read`);
    return response.data;
  },
  markAllRead: async () => {
    const response = await api.post('/api/alerts/mark-all-read');
    return response.data;
  }
};
