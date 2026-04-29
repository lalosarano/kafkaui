package com.kafkagui.common.dto;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
    public static <T> PageResponse<T> of(List<T> all, int page, int size) {
        if (size <= 0) size = 50;
        if (page < 0) page = 0;
        long total = all.size();
        int totalPages = (int) Math.max(1, Math.ceil((double) total / size));
        int from = Math.min(page * size, all.size());
        int to = Math.min(from + size, all.size());
        return new PageResponse<>(all.subList(from, to), total, totalPages, page, size);
    }
}
