package com.flexfit.ttsservice.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;

@RestController
@RequestMapping("/api/tts")
public class TtsController {
    @PostMapping
    public ResponseEntity<String> synthesize(@RequestBody String text) {
        
        String fakeAudio = "This would be audio for: " + text;
        String base64Audio = Base64.getEncoder().encodeToString(fakeAudio.getBytes());
        return ResponseEntity.ok(base64Audio);
    }
} 