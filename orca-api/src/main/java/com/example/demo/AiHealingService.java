package com.example.demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AiHealingService {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final ChatClient chatClient;

    @Value("${orca.healing.timeout:PT25S}")
    private Duration timeout;

    public AiHealingService(ObjectProvider<ChatModel> models) {
        ChatModel model = models.getIfAvailable();
        this.chatClient = model == null ? null : ChatClient.create(model);
    }

    public String getHealedMapping(String brokenJson, String missingFields) {
        if (chatClient == null) {
            log.warn("Gemini is not configured; preserving downstream payload.");
            return null;
        }
        String prompt = """
            You are a strict JSON mapping API.
            Expected fields: %s
            Actual JSON: %s
            
            Return a JSON object containing only the missing expected fields. Copy values from
            semantically equivalent fields in the actual JSON; use null when no equivalent exists.
            CRITICAL: Return ONLY a valid JSON object. No markdown or conversational text.
            """.formatted(missingFields, brokenJson);

        CompletableFuture<String> request = CompletableFuture.supplyAsync(() -> chatClient.prompt()
                .user(prompt)
                .call()
                .content());
        try {
            String result = request.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            return parseJsonObject(result);
        } catch (Exception e) {
            request.cancel(true);
            log.warn("Gemini healing unavailable; preserving downstream payload ({})", e.getClass().getSimpleName());
            return null;
        }
    }

    static String parseJsonObject(String raw) {
        if (raw == null) return null;
        String result = raw.trim()
                .replaceFirst("(?is)^```(?:json)?\\s*", "")
                .replaceFirst("(?s)\\s*```$", "")
                .trim();
        try {
            JsonNode parsed = JSON.readTree(result);
            return parsed != null && parsed.isObject() ? result : null;
        } catch (Exception e) {
            return null;
        }
    }
}
