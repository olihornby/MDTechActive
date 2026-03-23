const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export const getHealthStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error('Unable to reach backend health endpoint');
  }

  return response.json();
};

export { API_BASE_URL };
