package com.example.demo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.networknt.schema.JsonSchema;
import com.networknt.schema.JsonSchemaFactory;
import com.networknt.schema.SpecVersion;
import com.networknt.schema.ValidationMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SchemaValidator {
    
    private final ObjectMapper mapper = new ObjectMapper();
    private final JsonSchema schema;

    public SchemaValidator() {
        // 1. Initialize the factory for Draft 2020-12
        JsonSchemaFactory factory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V202012);
        
        // 2. Load the schema from your resources folder
        InputStream schemaStream = getClass().getResourceAsStream("/schemas/post-schema.json");
        
        if (schemaStream == null) {
            throw new RuntimeException("CRITICAL: Could not find /schemas/post-schema.json!");
        }
        
        this.schema = factory.getSchema(schemaStream);
        log.info("ORCA: Enterprise JSON Schema loaded successfully.");
    }

    // Returns a list of specific errors, or an empty list if healthy!
    public List<String> getValidationErrors(String rawJson) {
        try {
            JsonNode root = mapper.readTree(rawJson);
            
            // 3. NetworkNT does all the heavy lifting here
            Set<ValidationMessage> validationMessages = schema.validate(root);
            
            if (!validationMessages.isEmpty()) {
                List<String> errors = validationMessages.stream()
                        .map(ValidationMessage::getMessage)
                        .collect(Collectors.toList());
                        
                log.warn("DRIFT DETECTED: {}", errors);
                return errors;
            }
            
            return List.of(); // Empty list means no drift
            
        } catch (Exception e) {
            log.error("ORCA: Failed to parse JSON for validation", e);
            return List.of("Invalid JSON format: " + e.getMessage());
        }
    }
}
