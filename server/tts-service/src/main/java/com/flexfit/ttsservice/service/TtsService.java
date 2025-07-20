package com.flexfit.ttsservice.service;

import com.flexfit.ttsservice.dto.TtsRequest;
import com.flexfit.ttsservice.dto.TtsResponse;
import org.springframework.core.io.Resource;

public interface TtsService {
    
    /**
     * Convert text to speech and return audio as byte array
     * @param request TTS request containing text and voice parameters
     * @return Audio data as byte array
     */
    byte[] textToSpeech(TtsRequest request);
    
    /**
     * Convert text to speech and return full response with metadata
     * @param request TTS request containing text and voice parameters
     * @return TTS response with audio URL and metadata
     */
    TtsResponse generateAudio(TtsRequest request);
    
    /**
     * Get available voices from Google Cloud TTS
     * @return List of available voices
     */
    String getAvailableVoices();
} 