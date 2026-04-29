package com.kafkagui.cluster;

import com.kafkagui.cluster.dto.ClusterInfo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/clusters")
public class ClusterController {

    private final ClusterService service;

    public ClusterController(ClusterService service) {
        this.service = service;
    }

    @GetMapping("/current")
    public ClusterInfo current() {
        return service.current();
    }
}
