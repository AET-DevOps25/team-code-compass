import { ApiResponse, ApiError } from '../types/user';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    
    // Try to get token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('flexfit_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('flexfit_token', token);
      } else {
        localStorage.removeItem('flexfit_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private logRequest(method: string, url: string, data?: any, headers?: HeadersInit) {
    console.group(`🚀 API Request: ${method} ${url}`);
    console.log('📤 Request URL:', url);
    console.log('📤 Request Headers:', headers);
    if (data) {
      console.log('📤 Request Body:', data);
    }
    console.groupEnd();
  }

  private logResponse(method: string, url: string, response: Response, data?: any) {
    const emoji = response.ok ? '✅' : '❌';
    console.group(`${emoji} API Response: ${method} ${url} (${response.status})`);
    console.log('📥 Response Status:', response.status, response.statusText);
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
    if (data !== undefined) {
      console.log('📥 Response Data:', data);
    }
    console.groupEnd();
  }

  private logError(method: string, url: string, error: any) {
    console.group(`💥 API Error: ${method} ${url}`);
    console.error('❌ Error:', error);
    console.trace('📍 Error Stack Trace');
    console.groupEnd();
  }

  private async handleResponse<T>(method: string, url: string, response: Response): Promise<ApiResponse<T>> {
    const status = response.status;
    
    // Log CORS headers for debugging
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials'),
    };
    console.log('🔒 CORS Headers:', corsHeaders);
    
    try {
      const data = await response.json();
      this.logResponse(method, url, response, data);
      
      if (response.ok) {
        return {
          data,
          status,
        };
      } else {
        // Handle error response
        const error: ApiError = {
          error: data.error || data.message || `HTTP ${status}: ${response.statusText}`,
          details: data.details,
        };
        
        console.error('🚨 API Error Response:', {
          status,
          statusText: response.statusText,
          error: error.error,
          details: error.details,
          fullResponse: data
        });
        
        return {
          error,
          status,
        };
      }
    } catch (parseError) {
      // Handle cases where response is not JSON
      const responseText = await response.text().catch(() => 'Unable to read response text');
      
      console.error('🚨 Response Parse Error:', {
        status,
        statusText: response.statusText,
        parseError,
        responseText
      });
      
      const error: ApiError = {
        error: `Network error: ${response.statusText} (Status: ${status})`,
        details: { parseError: String(parseError), responseText }
      };
      
      this.logResponse(method, url, response, `Parse Error: ${parseError}`);
      
      return {
        error,
        status,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    try {
      this.logRequest('GET', url, undefined, headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return this.handleResponse<T>('GET', url, response);
    } catch (error) {
      this.logError('GET', url, error);
      
      const apiError: ApiError = {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error && error.stack ? { stack: error.stack } : undefined
      };
      
      return {
        error: apiError,
        status: 0,
      };
    }
  }

  async post<T, R = T>(endpoint: string, data?: R): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    try {
      this.logRequest('POST', url, data, headers);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>('POST', url, response);
    } catch (error) {
      this.logError('POST', url, error);
      
      // Special handling for CORS errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isCorsError = errorMessage.includes('CORS') || 
                         errorMessage.includes('blocked') || 
                         errorMessage.includes('cross-origin');
      
      const apiError: ApiError = {
        error: isCorsError 
          ? `CORS Error: ${errorMessage}. This usually means the server is not configured to allow requests from ${window.location.origin}` 
          : `Network error: ${errorMessage}`,
        details: error instanceof Error && error.stack ? { stack: error.stack, origin: window.location.origin } : undefined
      };
      
      return {
        error: apiError,
        status: 0,
      };
    }
  }

  async put<T, R = T>(endpoint: string, data?: R): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    try {
      this.logRequest('PUT', url, data, headers);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>('PUT', url, response);
    } catch (error) {
      this.logError('PUT', url, error);
      
      const apiError: ApiError = {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error && error.stack ? { stack: error.stack } : undefined
      };
      
      return {
        error: apiError,
        status: 0,
      };
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders();
    
    try {
      this.logRequest('DELETE', url, undefined, headers);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      return this.handleResponse<T>('DELETE', url, response);
    } catch (error) {
      this.logError('DELETE', url, error);
      
      const apiError: ApiError = {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error instanceof Error && error.stack ? { stack: error.stack } : undefined
      };
      
      return {
        error: apiError,
        status: 0,
      };
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient(); 