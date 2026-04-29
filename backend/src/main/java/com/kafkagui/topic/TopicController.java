package com.kafkagui.topic;

import com.kafkagui.common.dto.PageResponse;
import com.kafkagui.topic.dto.CreateTopicRequest;
import com.kafkagui.topic.dto.Topic;
import com.kafkagui.topic.dto.TopicConfigEntry;
import com.kafkagui.topic.dto.TopicDetail;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/topics")
public class TopicController {

    private final TopicService service;

    public TopicController(TopicService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<Topic> list(
            @RequestParam(required = false) String q,
            @RequestParam(name = "showInternal", defaultValue = "false") boolean showInternal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return service.list(q, showInternal, page, size);
    }

    @GetMapping("/{name}")
    public TopicDetail get(@PathVariable String name) {
        return service.get(name);
    }

    @PostMapping
    public Topic create(@Valid @RequestBody CreateTopicRequest req) {
        return service.create(req);
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(@PathVariable String name) {
        service.delete(name);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{name}/configs")
    public List<TopicConfigEntry> configs(@PathVariable String name) {
        return service.configs(name);
    }

    @PutMapping("/{name}/configs")
    public List<TopicConfigEntry> updateConfigs(@PathVariable String name, @RequestBody Map<String, String> updates) {
        return service.updateConfigs(name, updates);
    }
}
