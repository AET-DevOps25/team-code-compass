package com.flexfit.ttsservice.dto;

import java.time.LocalDateTime;

public class TtsResponse {
    
    private String audioUrl;
    private String text;
    private String voiceName;
    private String languageCode;
    private String audioEncoding;
    private LocalDateTime generatedAt;
    private long audioSizeBytes;
    
    // Default constructor
    public TtsResponse() {}
    
    // Constructor with all fields
    public TtsResponse(String audioUrl, String text, String voiceName, 
                      String languageCode, String audioEncoding, 
                      LocalDateTime generatedAt, long audioSizeBytes) {
        this.audioUrl = audioUrl;
        this.text = text;
        this.voiceName = voiceName;
        this.languageCode = languageCode;
        this.audioEncoding = audioEncoding;
        this.generatedAt = generatedAt;
        this.audioSizeBytes = audioSizeBytes;
    }
    
    // Getters and Setters
    public String getAudioUrl() {
        return audioUrl;
    }
    
    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public String getVoiceName() {
        return voiceName;
    }
    
    public void setVoiceName(String voiceName) {
        this.voiceName = voiceName;
    }
    
    public String getLanguageCode() {
        return languageCode;
    }
    
    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }
    
    public String getAudioEncoding() {
        return audioEncoding;
    }
    
    public void setAudioEncoding(String audioEncoding) {
        this.audioEncoding = audioEncoding;
    }
    
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
    
    public long getAudioSizeBytes() {
        return audioSizeBytes;
    }
    
    public void setAudioSizeBytes(long audioSizeBytes) {
        this.audioSizeBytes = audioSizeBytes;
    }
} 