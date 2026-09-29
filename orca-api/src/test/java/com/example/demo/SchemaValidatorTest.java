package com.example.demo;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SchemaValidatorTest {
    private final SchemaValidator validator = new SchemaValidator();

    @Test void detectsMissingRequiredFields() { assertFalse(validator.getValidationErrors("{\"id\":1}").isEmpty()); }
    @Test void detectsWrongFieldType() { assertFalse(validator.getValidationErrors("{\"userId\":\"1\",\"id\":1,\"heading\":\"h\",\"body\":\"b\"}").isEmpty()); }
    @Test void acceptsExpectedShape() { assertTrue(validator.getValidationErrors("{\"userId\":1,\"id\":1,\"heading\":\"h\",\"body\":\"b\"}").isEmpty()); }
}
