package com.kafkagui.netalias;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.net.spi.InetAddressResolver;
import java.net.spi.InetAddressResolverProvider;
import java.util.stream.Stream;

/**
 * Installs a JVM-wide DNS resolver that consults {@link HostAliasRegistry} before falling through
 * to the built-in OS resolver. Registered via META-INF/services so the JDK loads it before any
 * Kafka client opens a socket.
 */
public class KafkaGuiResolverProvider extends InetAddressResolverProvider {

    @Override
    public InetAddressResolver get(Configuration configuration) {
        InetAddressResolver builtin = configuration.builtinResolver();
        return new InetAddressResolver() {
            @Override
            public Stream<InetAddress> lookupByName(String host, LookupPolicy lookupPolicy) throws UnknownHostException {
                InetAddress[] hit = HostAliasRegistry.lookup(host);
                if (hit != null) return Stream.of(hit);
                return builtin.lookupByName(host, lookupPolicy);
            }

            @Override
            public String lookupByAddress(byte[] addr) throws UnknownHostException {
                return builtin.lookupByAddress(addr);
            }
        };
    }

    @Override
    public String name() {
        return "kafka-gui-alias-resolver";
    }
}
