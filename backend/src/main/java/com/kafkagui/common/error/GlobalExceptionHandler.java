package com.kafkagui.common.error;

import com.kafkagui.common.dto.ApiError;
import io.confluent.kafka.schemaregistry.client.rest.exceptions.RestClientException;
import jakarta.validation.ConstraintViolationException;
import org.apache.kafka.common.errors.AuthorizationException;
import org.apache.kafka.common.errors.GroupIdNotFoundException;
import org.apache.kafka.common.errors.InvalidPartitionsException;
import org.apache.kafka.common.errors.InvalidReplicationFactorException;
import org.apache.kafka.common.errors.TimeoutException;
import org.apache.kafka.common.errors.TopicExistsException;
import org.apache.kafka.common.errors.UnknownTopicOrPartitionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UnknownTopicOrPartitionException.class)
    public ResponseEntity<ApiError> notFound(UnknownTopicOrPartitionException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of("topic-not-found", e.getMessage()));
    }

    @ExceptionHandler(TopicExistsException.class)
    public ResponseEntity<ApiError> conflict(TopicExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiError.of("topic-exists", e.getMessage()));
    }

    @ExceptionHandler({InvalidPartitionsException.class, InvalidReplicationFactorException.class})
    public ResponseEntity<ApiError> badSpec(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiError.of("invalid-topic-spec", e.getMessage()));
    }

    @ExceptionHandler(GroupIdNotFoundException.class)
    public ResponseEntity<ApiError> groupNotFound(GroupIdNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of("group-not-found", e.getMessage()));
    }

    @ExceptionHandler(AuthorizationException.class)
    public ResponseEntity<ApiError> forbidden(AuthorizationException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of("forbidden", e.getMessage()));
    }

    @ExceptionHandler(TimeoutException.class)
    public ResponseEntity<ApiError> timeout(TimeoutException e) {
        return ResponseEntity.status(HttpStatus.GATEWAY_TIMEOUT)
                .body(ApiError.of("kafka-timeout", e.getMessage()));
    }

    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ApiError> registry(RestClientException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiError.of("registry-error", e.getMessage()));
    }

    @ExceptionHandler(SchemaRegistryNotConfiguredException.class)
    public ResponseEntity<ApiError> registryNotConfigured(SchemaRegistryNotConfiguredException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiError.of("schema-registry-not-configured", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {
        var first = e.getBindingResult().getFieldErrors().stream().findFirst();
        String details = first.map(f -> f.getField() + ": " + f.getDefaultMessage()).orElse("invalid request");
        return ResponseEntity.badRequest().body(ApiError.of("validation-failed", "Request validation failed", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> constraint(ConstraintViolationException e) {
        return ResponseEntity.badRequest().body(ApiError.of("validation-failed", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> illegal(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(ApiError.of("bad-request", e.getMessage()));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(ApiError.of("bad-request", "Request body is malformed"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> unhandled(Exception e) {
        log.error("Unhandled exception", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of("internal-error", e.getClass().getSimpleName() + ": " + e.getMessage()));
    }
}
