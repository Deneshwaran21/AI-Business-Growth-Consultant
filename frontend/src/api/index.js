import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const trainModel = (filePath, target = 'churn') => {
  return api.post('/train', { file_path: filePath, target });
};

export const predict = (data, modelType = 'churn') => {
  return api.post('/predict', data, {
    params: { model_type: modelType }
  });
};

export const checkModel = () => {
  return api.get('/models');
};

export const explain = (data, topN = 5) => {
  return api.post('/explain', data, {
    params: { top_n: topN }
  });
};

export const generateStrategy = (data) => {
  return api.post('/strategy', data);
};

export const getInsights = (data) => {
  return api.post('/insights', data);
};

export default api;