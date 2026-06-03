package com.kafkagui.broker;

import com.kafkagui.broker.dto.Broker;
import com.kafkagui.broker.dto.BrokerConfigEntry;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/brokers")
public class BrokerController {

    private final BrokerService service;

    public BrokerController(BrokerService service) {
        this.service = service;
    }

    @GetMapping
    public List<Broker> list() {
        return service.list();
    }

    @GetMapping("/{id}/configs")
    public List<BrokerConfigEntry> configs(@PathVariable int id) {
        return service.configs(id);
    }

    @PutMapping("/{id}/configs")
    public List<BrokerConfigEntry> updateConfigs(@PathVariable int id, @RequestBody Map<String, String> updates) {
        return service.updateConfigs(id, updates);
    }
}
