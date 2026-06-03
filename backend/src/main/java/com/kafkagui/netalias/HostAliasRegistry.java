package com.kafkagui.netalias;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Process-wide holder for the active hostname→addresses map.
 *
 * <p>The {@link KafkaGuiResolverProvider} is instantiated by the JDK {@link java.util.ServiceLoader},
 * not Spring, so the SPI side cannot inject a service bean. This static registry is the bridge:
 * Spring writes via {@link #replaceAll(List)}, the SPI reads via {@link #lookup(String)}.
 */
public final class HostAliasRegistry {

    private static final AtomicReference<Map<String, InetAddress[]>> MAP =
            new AtomicReference<>(Map.of());

    private HostAliasRegistry() {}

    /**
     * Replace the active alias map. Invalid entries (bad IP literal) are skipped silently;
     * the caller is expected to have validated input already.
     */
    public static void replaceAll(List<HostAlias> aliases) {
        Map<String, List<InetAddress>> grouped = new HashMap<>();
        for (HostAlias a : aliases) {
            if (a == null || a.hostname() == null || a.ip() == null) continue;
            InetAddress addr = tryParse(a.hostname(), a.ip());
            if (addr == null) continue;
            grouped.computeIfAbsent(a.hostname().toLowerCase(Locale.ROOT), k -> new ArrayList<>()).add(addr);
        }
        Map<String, InetAddress[]> next = new HashMap<>(grouped.size());
        for (var e : grouped.entrySet()) next.put(e.getKey(), e.getValue().toArray(new InetAddress[0]));
        MAP.set(Map.copyOf(next));
    }

    /** Returns matching addresses for the given hostname, or {@code null} if no alias is configured. */
    public static InetAddress[] lookup(String hostname) {
        if (hostname == null) return null;
        InetAddress[] hit = MAP.get().get(hostname.toLowerCase(Locale.ROOT));
        return hit == null || hit.length == 0 ? null : hit;
    }

    private static InetAddress tryParse(String hostname, String ip) {
        try {
            // InetAddress.getByAddress requires raw bytes; parse the literal first via getByName,
            // which for numeric strings is a pure parse with no DNS lookup, then re-wrap so the
            // returned address reports the user-supplied hostname (not the literal).
            InetAddress parsed = InetAddress.getByName(ip);
            return InetAddress.getByAddress(hostname, parsed.getAddress());
        } catch (UnknownHostException e) {
            return null;
        }
    }
}
