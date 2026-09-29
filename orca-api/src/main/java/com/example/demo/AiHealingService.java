package com.example.demo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Slf4j
@Service
public class AiHealingService {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final int MAX_UNAVAILABLE_RETRIES = 2;
    private static final long RETRY_DELAY_MILLIS = 1_000;
    private static final String FALLBACK_MODEL = "gemini-2.0-flash";

    private final ChatClient chatClient;
    private final ChatModel chatModel;

    @Value("${spring.ai.google.genai.chat.options.model:gemini-3.8-flash}")
    private String primaryModel;

    @Value("${orca.healing.timeout:PT25S}")
    private Duration timeout;

    public AiHealingService(ObjectProvider<ChatModel> models) {
        this.chatModel = models.getIfAvailable();
        this.chatClient = chatModel == null ? null : ChatClient.create(chatModel);
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

        CompletableFuture<String> request = CompletableFuture.supplyAsync(
                () -> callPrimaryThenFallback(prompt));
        try {
            String result = request.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            return parseJsonObject(result);
        } catch (Exception e) {
            request.cancel(true);
            log.warn("Gemini healing unavailable; preserving downstream payload ({})", e.getClass().getSimpleName());
            return null;
        }
    }

    private String callPrimaryThenFallback(String prompt) {
        try {
            String response = callWithUnavailableRetries(
                    () -> callModel(prompt, primaryModel), Thread::sleep);
            log.info("Gemini healing response served by model {}.", primaryModel);
            return response;
        } catch (RuntimeException primaryError) {
            if (!isUnavailable(primaryError)) {
                throw primaryError;
            }
            log.warn("Primary Gemini model {} remained unavailable after retries; trying fallback model {}.",
                    primaryModel, FALLBACK_MODEL);
            String response = callModel(prompt, FALLBACK_MODEL);
            log.info("Gemini healing response served by model {}.", FALLBACK_MODEL);
            return response;
        }
    }

    private String callModel(String prompt, String modelName) {
        GoogleGenAiChatOptions options = (GoogleGenAiChatOptions) chatModel.getDefaultOptions().copy();
        options.setModel(modelName);
        return chatClient.prompt()
                .options(options)
                .user(prompt)
                .call()
                .content();
    }

    static String callWithUnavailableRetries(Supplier<String> call, Sleeper sleeper) {
        for (int attempt = 0; ; attempt++) {
            try {
                return call.get();
            } catch (RuntimeException error) {
                if (!isUnavailable(error) || attempt >= MAX_UNAVAILABLE_RETRIES) {
                    throw error;
                }
                log.warn("Gemini returned 503/UNAVAILABLE; retrying ({}/{}).", attempt + 1,
                        MAX_UNAVAILABLE_RETRIES);
                try {
                    sleeper.sleep(RETRY_DELAY_MILLIS);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrupted while waiting to retry Gemini", interrupted);
                }
            }
        }
    }

    static boolean isUnavailable(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof com.google.genai.errors.ApiException apiException) {
                return apiException.code() == 503 || "UNAVAILABLE".equalsIgnoreCase(apiException.status());
            }
            if (current instanceof org.springframework.web.reactive.function.client.WebClientResponseException response) {
                return response.getStatusCode().value() == 503;
            }
            if (current instanceof org.springframework.web.client.HttpStatusCodeException response) {
                return response.getStatusCode().value() == 503;
            }
            String message = current.getMessage();
            if (message != null) {
                if (message.matches("(?is).*\\b(?:400|403|429)\\b.*")) {
                    return false;
                }
                if (message.matches("(?is).*\\b503\\b.*")
                        || message.matches("(?is).*\\bUNAVAILABLE\\b.*")) {
                    return true;
                }
            }
        }
        return false;
    }

    @FunctionalInterface
    interface Sleeper {
        void sleep(long millis) throws InterruptedException;
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
