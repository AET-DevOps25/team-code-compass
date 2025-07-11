import { apiClient } from './apiClient';
import { UserResponse, ApiResponse, UserUpdateRequest } from '../types/user';

export class UserService {
  async getUserProfile(): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>('/user-service/api/v1/users/me');
  }

  async getUserById(id: string): Promise<ApiResponse<UserResponse>> {
    return apiClient.get<UserResponse>(`/user-service/api/v1/users/${id}`);
  }

  async updateUserProfile(userData: UserUpdateRequest): Promise<ApiResponse<UserResponse>> {
    return apiClient.put<UserResponse, UserUpdateRequest>('/user-service/api/v1/users/me', userData);
  }

  async checkHealthStatus(): Promise<ApiResponse<{ service: string; status: string; message: string }>> {
    return apiClient.get('/user-service/api/v1/users/health');
  }
}

// Create a singleton instance
export const userService = new UserService(); 