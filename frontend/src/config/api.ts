
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Production fallback: empty string means no backend connection
  return '';
};

const getWsBaseUrl = () => {
  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:8000/ws';
  }
  
  // Production fallback: empty string means no websocket
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();

export const isBackendAvailable = !!API_BASE_URL;
