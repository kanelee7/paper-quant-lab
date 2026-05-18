import { demoInterceptor } from './demoService';

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
  return fetch(url, options);
};
