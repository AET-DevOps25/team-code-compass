package com.flexfit.ttsservice.controller;

import com.flexfit.ttsservice.dto.TtsRequest;
import com.flexfit.ttsservice.dto.TtsResponse;
import com.flexfit.ttsservice.metrics.TtsMetrics;
import com.flexfit.ttsservice.service.TtsService;
import io.micrometer.core.instrument.Timer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")
@Tag(name = "Text-to-Speech Service", description = "API for converting text to speech using Google Cloud TTS")
public class TtsController {
    
    private static final Logger logger = LoggerFactory.getLogger(TtsController.class);
    
    private final TtsService ttsService;
    private final TtsMetrics ttsMetrics;
    
    public TtsController(TtsService ttsService, TtsMetrics ttsMetrics) {
        this.ttsService = ttsService;
        this.ttsMetrics = ttsMetrics;
    }
    
    @PostMapping("/synthesize")
    @Operation(summary = "Convert text to speech", description = "Converts the provided text to speech and returns audio data")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Audio generated successfully",
                    content = @Content(mediaType = "audio/mpeg", schema = @Schema(type = "string", format = "binary"))),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<byte[]> synthesizeSpeech(
            @Parameter(description = "TTS request containing text and voice parameters")
            @Valid @RequestBody TtsRequest request) {
        
        ttsMetrics.incrementVoiceSynthesisRequests();
        Timer.Sample timer = ttsMetrics.startVoiceSynthesisTimer();
        
        try {
            logger.info("Received TTS request for text length: {}", request.getText().length());
            
            byte[] audioData = ttsService.textToSpeech(request);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentLength(audioData.length);
            headers.set("Content-Disposition", "attachment; filename=\"audio.mp3\"");
            
            logger.info("Successfully generated audio: {} bytes", audioData.length);
            ttsMetrics.incrementVoiceSynthesisSuccess();
            ttsMetrics.stopVoiceSynthesisTimer(timer);
            return new ResponseEntity<>(audioData, headers, HttpStatus.OK);
            
        } catch (Exception e) {
            logger.error("Error synthesizing speech", e);
            ttsMetrics.incrementVoiceSynthesisErrors();
            ttsMetrics.stopVoiceSynthesisTimer(timer);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/generate")
    @Operation(summary = "Generate audio with metadata", description = "Converts text to speech and returns response with metadata")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Audio generated successfully",
                    content = @Content(schema = @Schema(implementation = TtsResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<TtsResponse> generateAudio(
            @Parameter(description = "TTS request containing text and voice parameters")
            @Valid @RequestBody TtsRequest request) {
        
        ttsMetrics.incrementAudioGenerationRequests();
        Timer.Sample timer = ttsMetrics.startAudioGenerationTimer();
        
        try {
            logger.info("Received audio generation request for text length: {}", request.getText().length());
            
            TtsResponse response = ttsService.generateAudio(request);
            
            logger.info("Successfully generated audio response");
            ttsMetrics.incrementAudioGenerationSuccess();
            ttsMetrics.stopAudioGenerationTimer(timer);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error generating audio", e);
            ttsMetrics.incrementAudioGenerationErrors();
            ttsMetrics.stopAudioGenerationTimer(timer);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/voices")
    @Operation(summary = "Get available voices", description = "Returns list of available voices from Google Cloud TTS")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Voices retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<String> getAvailableVoices() {
        
        ttsMetrics.incrementAvailableVoicesRequests();
        
        try {
            logger.info("Received request for available voices");
            
            String voices = ttsService.getAvailableVoices();
            
            logger.info("Successfully retrieved available voices");
            return ResponseEntity.ok(voices);
            
        } catch (Exception e) {
            logger.error("Error retrieving available voices", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Simple health check endpoint")
    public ResponseEntity<String> health() {
        ttsMetrics.incrementHealthCheckRequests();
        logger.info("Health check requested");
        String response = "TTS Service is running";
        logger.info("Health check response: {}", response);
        return ResponseEntity.ok(response);
    }
} 