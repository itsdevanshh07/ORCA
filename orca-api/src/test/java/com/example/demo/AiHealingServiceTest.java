package com.example.demo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AiHealingServiceTest {
    @Test
    void acceptsJsonObjectResponse() {
        assertEquals("{\"heading\":\"A title\"}", AiHealingService.parseJsonObject("```json\n{\"heading\":\"A title\"}\n```"));
    }

    @Test
    void rejectsMalformedJsonResponse() {
        assertNull(AiHealingService.parseJsonObject("{heading: nope}"));
    }

    @Test
    void rejectsNonObjectJsonResponse() {
        assertNull(AiHealingService.parseJsonObject("[1, 2, 3]"));
    }
}
