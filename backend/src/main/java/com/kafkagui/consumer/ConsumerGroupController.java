package com.kafkagui.consumer;

import com.kafkagui.consumer.dto.ConsumerGroupDetail;
import com.kafkagui.consumer.dto.ConsumerGroupSummary;
import com.kafkagui.consumer.dto.ResetOffsetsRequest;
import com.kafkagui.consumer.dto.ResetOffsetsResult;
import com.kafkagui.consumer.dto.TopicConsumerGroup;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consumer-groups")
public class ConsumerGroupController {

    private final ConsumerGroupService service;

    public ConsumerGroupController(ConsumerGroupService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConsumerGroupSummary> list(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String q) {
        return service.list(state, q);
    }

    @GetMapping("/{id}")
    public ConsumerGroupDetail get(@PathVariable String id) {
        return service.get(id);
    }

    @GetMapping("/by-topic/{topic}")
    public List<TopicConsumerGroup> byTopic(@PathVariable String topic) {
        return service.groupsForTopic(topic);
    }

    @PostMapping("/{id}/reset-offsets")
    public ResetOffsetsResult resetOffsets(@PathVariable String id, @Valid @RequestBody ResetOffsetsRequest req) {
        return service.resetOffsets(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
