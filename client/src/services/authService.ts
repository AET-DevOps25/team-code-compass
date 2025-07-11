import { apiClient } from './apiClient';
import { LoginRequest, UserRegistrationRequest, AuthResponse, ApiResponse } from '../types/user';

export class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse, LoginRequest>('/user-service/auth/login', credentials);
    
    // If login is successful, store the token
    if (response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData: UserRegistrationRequest): Promise<ApiResponse<AuthResponse>> {
    // First register the user
    const registerResponse = await apiClient.post('/user-service/api/v1/users/register', userData);
    
    if (registerResponse.error) {
      return registerResponse as ApiResponse<AuthResponse>;
    }
    
    // If registration is successful, automatically log in the user
    const loginCredentials: LoginRequest = {
      email: userData.email,
      password: userData.password
    };
    
    return this.login(loginCredentials);
  }

  async logout(): Promise<void> {
    // Clear the token from storage and API client
    apiClient.setToken(null);
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return apiClient.get('/user-service/api/v1/users/me');
  }

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }

  getToken(): string | null {
    return apiClient.getToken();
  }

  async checkAuthStatus(): Promise<boolean> {
    const token = apiClient.getToken();
    if (!token) {
      return false;
    }

    // Verify the token is still valid by making a request to get current user
    const response = await this.getCurrentUser();
    
    if (response.error) {
      // Token is invalid, clear it
      this.logout();
      return false;
    }

    return true;
  }
}

// Create a singleton instance
export const authService = new AuthService(); 