package com.kafkagui.message;

import com.kafkagui.message.dto.Message;
import com.kafkagui.message.dto.ProduceRequest;
import com.kafkagui.message.dto.ProduceResult;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/topics/{name}/messages")
public class MessageController {

    private final MessageService service;

    public MessageController(MessageService service) {
        this.service = service;
    }

    /**
     * Historical fetch.
     * <ul>
     *   <li>{@code fromOffset} — seek to a specific offset (inclusive) on the given partition.</li>
     *   <li>{@code fromTimestamp} — seek to the first record at or after this epoch-ms timestamp.</li>
     *   <li>{@code seek=earliest} — read from the start of the partition.</li>
     *   <li>(none) — default behaviour, read the last {@code limit} records from the end.</li>
     * </ul>
     */
    @GetMapping
    public List<Message> fetch(
            @PathVariable String name,
            @RequestParam(required = false) Integer partition,
            @RequestParam(required = false) Long fromOffset,
            @RequestParam(required = false) Long fromTimestamp,
            @RequestParam(required = false) String seek,
            @RequestParam(defaultValue = "100") int limit) {
        return service.fetch(name, partition, fromOffset, fromTimestamp, seek, limit);
    }

    @PostMapping
    public ProduceResult produce(@PathVariable String name, @Valid @RequestBody ProduceRequest req) {
        return service.produce(name, req);
    }
}
