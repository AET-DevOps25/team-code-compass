import { apiClient } from './apiClient'

export interface TtsRequest {
  text: string
  voiceName?: string
  languageCode?: string
  audioEncoding?: string
}

export interface TtsResponse {
  audioContent: string
  audioUrl?: string
}

export interface Voice {
  name: string
  languageCode: string
  displayName: string
}

class TtsService {
  private baseUrl = '/api/tts'

  async generateAudio(request: TtsRequest): Promise<TtsResponse> {
    const response = await apiClient.post(`${this.baseUrl}/generate`, request)
    return response.data
  }

  async synthesizeAudio(request: TtsRequest): Promise<TtsResponse> {
    const response = await apiClient.post(`${this.baseUrl}/synthesize`, request)
    return response.data
  }

  async getAvailableVoices(): Promise<Voice[]> {
    const response = await apiClient.get(`${this.baseUrl}/voices`)
    return response.data
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/health`)
      return response.status === 200
    } catch {
      return false
    }
  }
}

export const ttsService = new TtsService() 