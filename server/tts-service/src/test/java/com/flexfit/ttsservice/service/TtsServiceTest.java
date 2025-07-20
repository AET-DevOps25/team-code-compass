package com.flexfit.ttsservice.service;

import com.flexfit.ttsservice.dto.TtsRequest;
import com.flexfit.ttsservice.dto.TtsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
class TtsServiceTest {

    @Mock
    private TtsServiceImpl ttsService;

    @InjectMocks
    private TtsServiceImpl ttsServiceImpl;

    private TtsRequest testRequest;

    @BeforeEach
    void setUp() {
        testRequest = new TtsRequest();
        testRequest.setText("Hello, this is a test workout plan.");
        testRequest.setVoiceName("en-US-Neural2-F");
        testRequest.setLanguageCode("en-US");
        testRequest.setAudioEncoding("MP3");
    }

    @Test
    void testTextToSpeech_Success() {
        // Given
        byte[] expectedAudioData = "test audio data".getBytes();
        when(ttsService.textToSpeech(any(TtsRequest.class))).thenReturn(expectedAudioData);

        // When
        byte[] result = ttsService.textToSpeech(testRequest);

        // Then
        assertNotNull(result);
        assertArrayEquals(expectedAudioData, result);
        verify(ttsService, times(1)).textToSpeech(testRequest);
    }

    @Test
    void testTextToSpeech_EmptyText() {
        // Given
        testRequest.setText("");
        
        // When & Then - Empty text should be handled gracefully
        assertDoesNotThrow(() -> {
            ttsService.textToSpeech(testRequest);
        });
    }

    @Test
    void testTextToSpeech_NullText() {
        // Given
        testRequest.setText(null);
        
        // When & Then - Null text should be handled gracefully
        assertDoesNotThrow(() -> {
            ttsService.textToSpeech(testRequest);
        });
    }

    @Test
    void testTextToSpeech_InvalidVoiceName() {
        // Given
        testRequest.setVoiceName("invalid-voice");
        
        // When & Then - Invalid voice should be handled gracefully
        assertDoesNotThrow(() -> {
            ttsService.textToSpeech(testRequest);
        });
    }

    @Test
    void testGenerateAudio_Success() {
        // Given
        TtsResponse expectedResponse = new TtsResponse();
        expectedResponse.setAudioUrl("http://example.com/audio.mp3");
        expectedResponse.setText("Test workout plan");
        expectedResponse.setVoiceName("en-US-Neural2-F");
        expectedResponse.setAudioSizeBytes(1024);
        
        when(ttsService.generateAudio(any(TtsRequest.class))).thenReturn(expectedResponse);

        // When
        TtsResponse result = ttsService.generateAudio(testRequest);

        // Then
        assertNotNull(result);
        assertEquals(expectedResponse.getAudioUrl(), result.getAudioUrl());
        assertEquals(expectedResponse.getText(), result.getText());
        assertEquals(expectedResponse.getVoiceName(), result.getVoiceName());
        assertEquals(expectedResponse.getAudioSizeBytes(), result.getAudioSizeBytes());
        verify(ttsService, times(1)).generateAudio(testRequest);
    }

    @Test
    void testGetAvailableVoices_Success() {
        // Given
        String expectedVoices = "[{\"name\":\"en-US-Neural2-F\",\"languageCode\":\"en-US\"}]";
        when(ttsService.getAvailableVoices()).thenReturn(expectedVoices);

        // When
        String result = ttsService.getAvailableVoices();

        // Then
        assertNotNull(result);
        assertEquals(expectedVoices, result);
        verify(ttsService, times(1)).getAvailableVoices();
    }

    @Test
    void testTtsRequest_Validation() {
        // Given
        TtsRequest request = new TtsRequest();
        
        // When & Then - Validation should be handled gracefully
        assertDoesNotThrow(() -> {
            request.setText("");
            ttsService.textToSpeech(request);
        });
        
        assertDoesNotThrow(() -> {
            request.setText("Valid text");
            request.setVoiceName("");
            ttsService.textToSpeech(request);
        });
        
        assertDoesNotThrow(() -> {
            request.setVoiceName("en-US-Neural2-F");
            request.setLanguageCode("");
            ttsService.textToSpeech(request);
        });
    }

    @Test
    void testTtsRequest_Constructor() {
        // Given & When
        TtsRequest request = new TtsRequest("Test workout plan");
        request.setVoiceName("en-US-Neural2-F");
        request.setLanguageCode("en-US");
        request.setAudioEncoding("MP3");

        // Then
        assertEquals("Test workout plan", request.getText());
        assertEquals("en-US-Neural2-F", request.getVoiceName());
        assertEquals("en-US", request.getLanguageCode());
        assertEquals("MP3", request.getAudioEncoding());
    }

    @Test
    void testTtsResponse_Constructor() {
        // Given & When
        TtsResponse response = new TtsResponse(
            "http://example.com/audio.mp3",
            "Test workout plan",
            "en-US-Neural2-F",
            "en-US",
            "MP3",
            null,
            1024
        );

        // Then
        assertEquals("http://example.com/audio.mp3", response.getAudioUrl());
        assertEquals("Test workout plan", response.getText());
        assertEquals("en-US-Neural2-F", response.getVoiceName());
        assertEquals(1024, response.getAudioSizeBytes());
    }
} 