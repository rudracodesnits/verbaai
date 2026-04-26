import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const verbaApi = {
  summarize: async (text: string, apiKey: string) => {
    const response = await api.post('/api/v1/summarize', { text }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  sentiment: async (text: string, apiKey: string) => {
    const response = await api.post('/api/v1/sentiment', { text }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  toxicity: async (text: string, apiKey: string) => {
    const response = await api.post('/api/v1/toxicity', { text }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  },

  keywords: async (text: string, apiKey: string) => {
    const response = await api.post('/api/v1/keywords', { text }, {
      headers: { 'x-api-key': apiKey }
    });
    return response.data;
  }
};
