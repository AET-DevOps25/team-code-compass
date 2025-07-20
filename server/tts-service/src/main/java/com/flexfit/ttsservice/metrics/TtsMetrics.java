package com.flexfit.ttsservice.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class TtsMetrics {

    private final Counter audioGenerationRequests;
    private final Counter audioGenerationSuccess;
    private final Counter audioGenerationErrors;
    private final Timer audioGenerationDuration;
    private final Counter voiceSynthesisRequests;
    private final Counter voiceSynthesisSuccess;
    private final Counter voiceSynthesisErrors;
    private final Timer voiceSynthesisDuration;
    private final Counter availableVoicesRequests;
    private final Counter healthCheckRequests;

    public TtsMetrics(MeterRegistry meterRegistry) {
        // Audio Generation Metrics
        this.audioGenerationRequests = Counter.builder("tts_audio_generation_requests_total")
                .description("Total number of audio generation requests")
                .register(meterRegistry);
        
        this.audioGenerationSuccess = Counter.builder("tts_audio_generation_success_total")
                .description("Total number of successful audio generations")
                .register(meterRegistry);
        
        this.audioGenerationErrors = Counter.builder("tts_audio_generation_errors_total")
                .description("Total number of audio generation errors")
                .register(meterRegistry);
        
        this.audioGenerationDuration = Timer.builder("tts_audio_generation_duration_seconds")
                .description("Time taken for audio generation")
                .register(meterRegistry);

        // Voice Synthesis Metrics
        this.voiceSynthesisRequests = Counter.builder("tts_voice_synthesis_requests_total")
                .description("Total number of voice synthesis requests")
                .register(meterRegistry);
        
        this.voiceSynthesisSuccess = Counter.builder("tts_voice_synthesis_success_total")
                .description("Total number of successful voice synthesis")
                .register(meterRegistry);
        
        this.voiceSynthesisErrors = Counter.builder("tts_voice_synthesis_errors_total")
                .description("Total number of voice synthesis errors")
                .register(meterRegistry);
        
        this.voiceSynthesisDuration = Timer.builder("tts_voice_synthesis_duration_seconds")
                .description("Time taken for voice synthesis")
                .register(meterRegistry);

        // Available Voices Metrics
        this.availableVoicesRequests = Counter.builder("tts_available_voices_requests_total")
                .description("Total number of available voices requests")
                .register(meterRegistry);

        // Health Check Metrics
        this.healthCheckRequests = Counter.builder("tts_health_check_requests_total")
                .description("Total number of health check requests")
                .register(meterRegistry);
    }

    // Audio Generation Methods
    public void incrementAudioGenerationRequests() {
        audioGenerationRequests.increment();
    }

    public void incrementAudioGenerationSuccess() {
        audioGenerationSuccess.increment();
    }

    public void incrementAudioGenerationErrors() {
        audioGenerationErrors.increment();
    }

    public Timer.Sample startAudioGenerationTimer() {
        return Timer.start();
    }

    public void stopAudioGenerationTimer(Timer.Sample sample) {
        sample.stop(audioGenerationDuration);
    }

    // Voice Synthesis Methods
    public void incrementVoiceSynthesisRequests() {
        voiceSynthesisRequests.increment();
    }

    public void incrementVoiceSynthesisSuccess() {
        voiceSynthesisSuccess.increment();
    }

    public void incrementVoiceSynthesisErrors() {
        voiceSynthesisErrors.increment();
    }

    public Timer.Sample startVoiceSynthesisTimer() {
        return Timer.start();
    }

    public void stopVoiceSynthesisTimer(Timer.Sample sample) {
        sample.stop(voiceSynthesisDuration);
    }

    // Available Voices Methods
    public void incrementAvailableVoicesRequests() {
        availableVoicesRequests.increment();
    }

    // Health Check Methods
    public void incrementHealthCheckRequests() {
        healthCheckRequests.increment();
    }
} 