package com.kafkagui.common.dto;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class PageResponseTest {

    @Test
    void slices_correctly() {
        List<Integer> data = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        var p0 = PageResponse.of(data, 0, 3);
        assertEquals(List.of(1, 2, 3), p0.content());
        assertEquals(10, p0.totalElements());
        assertEquals(4, p0.totalPages());

        var p3 = PageResponse.of(data, 3, 3);
        assertEquals(List.of(10), p3.content());
    }

    @Test
    void out_of_range_returns_empty() {
        var p = PageResponse.of(List.of(1, 2), 5, 10);
        assertTrue(p.content().isEmpty());
    }

    @Test
    void normalizes_invalid_size_and_page() {
        var p = PageResponse.of(List.of(1, 2, 3), -1, 0);
        assertEquals(50, p.size());
        assertEquals(0, p.page());
    }
}
