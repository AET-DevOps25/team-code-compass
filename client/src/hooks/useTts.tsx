import { useState, useCallback } from 'react'
import { ttsService } from '../services/ttsService'

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

export const useTts = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [availableVoices, setAvailableVoices] = useState<Voice[]>([])
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)

  const generateAudio = useCallback(async (request: TtsRequest) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await ttsService.generateAudio(request)
      setAudioUrl(response.audioUrl || null)
      setAudioBlob(null) // Will be set when audio is loaded
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate audio'
      setError(errorMessage)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const synthesizeAudio = useCallback(async (request: TtsRequest) => {
    setIsSynthesizing(true)
    setError(null)
    
    try {
      const response = await ttsService.synthesizeAudio(request)
      
      // Convert base64 to blob
      if (response.audioContent) {
        const byteCharacters = atob(response.audioContent)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'audio/mp3' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to synthesize audio'
      setError(errorMessage)
      throw err
    } finally {
      setIsSynthesizing(false)
    }
  }, [])

  const loadAvailableVoices = useCallback(async () => {
    setIsLoadingVoices(true)
    setError(null)
    
    try {
      const voices = await ttsService.getAvailableVoices()
      setAvailableVoices(voices)
      return voices
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load voices'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoadingVoices(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearAudio = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioUrl(null)
    setAudioBlob(null)
  }, [audioUrl])

  return {
    isGenerating,
    isSynthesizing,
    error,
    audioUrl,
    audioBlob,
    availableVoices,
    isLoadingVoices,
    generateAudio,
    synthesizeAudio,
    loadAvailableVoices,
    clearError,
    clearAudio
  }
} 