package com.flexfit.ttsservice.service;

import com.flexfit.ttsservice.dto.TtsRequest;
import com.flexfit.ttsservice.dto.TtsResponse;
import com.google.cloud.texttospeech.v1.*;
import com.google.protobuf.ByteString;
import com.google.auth.oauth2.GoogleCredentials;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Base64;

@Service
public class TtsServiceImpl implements TtsService {
    
    private static final Logger logger = LoggerFactory.getLogger(TtsServiceImpl.class);
    
    @Autowired
    private GoogleCredentials googleCredentials;
    
    @Value("${google.cloud.tts.voice-name:en-US-Neural2-F}")
    private String defaultVoiceName;
    
    @Value("${google.cloud.tts.language-code:en-US}")
    private String defaultLanguageCode;
    
    @Value("${google.cloud.tts.audio-encoding:MP3}")
    private String defaultAudioEncoding;
    
    @Override
    public byte[] textToSpeech(TtsRequest request) {
        try {
            logger.info("Converting text to speech: {}", request.getText().substring(0, Math.min(50, request.getText().length())));
            
            // Initialize the TTS client with custom credentials
            try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create(TextToSpeechSettings.newBuilder()
                    .setCredentialsProvider(() -> googleCredentials)
                    .build())) {
                
                // Set the text input to be synthesized
                SynthesisInput input = SynthesisInput.newBuilder()
                        .setText(request.getText())
                        .build();
                
                // Build the voice request
                VoiceSelectionParams voice = VoiceSelectionParams.newBuilder()
                        .setLanguageCode(request.getLanguageCode())
                        .setName(request.getVoiceName())
                        .build();
                
                // Select the type of audio file you want returned
                AudioConfig audioConfig = AudioConfig.newBuilder()
                        .setAudioEncoding(AudioEncoding.valueOf(request.getAudioEncoding()))
                        .build();
                
                // Perform the text-to-speech request
                SynthesizeSpeechResponse response = textToSpeechClient.synthesizeSpeech(input, voice, audioConfig);
                
                // Get the audio content from the response
                ByteString audioContents = response.getAudioContent();
                
                logger.info("Successfully generated audio for text length: {}", request.getText().length());
                return audioContents.toByteArray();
                
            }
        } catch (IOException e) {
            logger.error("Error converting text to speech", e);
            throw new RuntimeException("Failed to convert text to speech", e);
        }
    }
    
    @Override
    public TtsResponse generateAudio(TtsRequest request) {
        try {
            byte[] audioData = textToSpeech(request);
            
            // Generate a unique filename
            String filename = "audio_" + UUID.randomUUID().toString() + ".mp3";
            
            // Create response with metadata
            TtsResponse response = new TtsResponse();
            response.setAudioUrl("/api/tts/audio/" + filename);
            response.setAudioContent(Base64.getEncoder().encodeToString(audioData));
            response.setText(request.getText());
            response.setVoiceName(request.getVoiceName());
            response.setLanguageCode(request.getLanguageCode());
            response.setAudioEncoding(request.getAudioEncoding());
            response.setGeneratedAt(LocalDateTime.now());
            response.setAudioSizeBytes(audioData.length);
            
            logger.info("Generated audio response: {} bytes", audioData.length);
            return response;
            
        } catch (Exception e) {
            logger.error("Error generating audio response", e);
            throw new RuntimeException("Failed to generate audio", e);
        }
    }
    
    @Override
    public String getAvailableVoices() {
        try {
            logger.info("Fetching available voices from Google Cloud TTS");
            
            try (TextToSpeechClient textToSpeechClient = TextToSpeechClient.create(TextToSpeechSettings.newBuilder()
                    .setCredentialsProvider(() -> googleCredentials)
                    .build())) {
                
                // Performs the list voices request
                ListVoicesRequest request = ListVoicesRequest.newBuilder()
                        .setLanguageCode("en-US")
                        .build();
                
                ListVoicesResponse response = textToSpeechClient.listVoices(request);
                
                StringBuilder voices = new StringBuilder();
                voices.append("Available voices:\n");
                
                for (Voice voice : response.getVoicesList()) {
                    voices.append("Name: ").append(voice.getName()).append("\n");
                    voices.append("Language Codes: ").append(voice.getLanguageCodesList()).append("\n");
                    voices.append("SSML Gender: ").append(voice.getSsmlGender()).append("\n");
                    voices.append("Natural Sample Rate Hertz: ").append(voice.getNaturalSampleRateHertz()).append("\n");
                    voices.append("---\n");
                }
                
                logger.info("Successfully fetched {} voices", response.getVoicesCount());
                return voices.toString();
                
            }
        } catch (IOException e) {
            logger.error("Error fetching available voices", e);
            throw new RuntimeException("Failed to fetch available voices", e);
        }
    }
} 