import { demoInterceptor } from './demoService';
import { isBackendAvailable } from '../config/api';


/**
 * A wrapper around the native fetch API that checks for demo mode.
 * If demo mode is active and the URL is a known demo-capable endpoint,
 * it returns the mocked data.
 */
export const demoFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const intercepted = await demoInterceptor(url, options);
  if (intercepted) {
    return intercepted as unknown as Response;
  }
  
  // If backend is not available (e.g. production without env vars), 
  // and it wasn't intercepted by demo logic, we must decide whether to fail or return a dummy response.
  if (!isBackendAvailable) {
    // If not in demo mode but backend is missing, return a failed response
    // to avoid console errors and unhandled rejections.
    return new Response(JSON.stringify({ error: "Backend not configured" }), {
      status: 503,
      statusText: "Service Unavailable",
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return fetch(url, options);
};

