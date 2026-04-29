package com.kafkagui.metrics;

import com.kafkagui.metrics.dto.ThroughputSeries;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private final MetricsService service;

    public MetricsController(MetricsService service) {
        this.service = service;
    }

    @GetMapping("/throughput")
    public ThroughputSeries throughput() {
        return service.throughput();
    }
}
