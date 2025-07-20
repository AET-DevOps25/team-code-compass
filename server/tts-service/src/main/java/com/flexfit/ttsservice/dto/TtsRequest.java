package com.flexfit.ttsservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TtsRequest {
    
    @NotBlank(message = "Text content is required")
    @Size(max = 5000, message = "Text content must not exceed 5000 characters")
    private String text;
    
    private String voiceName = "en-US-Neural2-F";
    private String languageCode = "en-US";
    private String audioEncoding = "MP3";
    
    // Default constructor
    public TtsRequest() {}
    
    // Constructor with text
    public TtsRequest(String text) {
        this.text = text;
    }
    
    // Getters and Setters
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
} 