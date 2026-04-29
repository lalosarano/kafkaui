package com.kafkagui.common.dto;

public record ApiError(String error, String message, String details) {
    public static ApiError of(String error, String message) {
        return new ApiError(error, message, null);
    }
    public static ApiError of(String error, String message, String details) {
        return new ApiError(error, message, details);
    }
}
