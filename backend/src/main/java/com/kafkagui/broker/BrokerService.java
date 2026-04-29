package com.kafkagui.broker;

import static com.kafkagui.common.KafkaFutures.await;

import com.kafkagui.broker.dto.Broker;
import com.kafkagui.cluster.ClusterContext;
import com.kafkagui.cluster.ClusterRegistry;
import java.util.List;
import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.apache.kafka.common.Node;
import org.springframework.stereotype.Service;

@Service
public class BrokerService {

    private final ClusterRegistry registry;

    public BrokerService(ClusterRegistry registry) {
        this.registry = registry;
    }

    public List<Broker> list() {
        AdminClient adminClient = registry.adminClient(ClusterContext.require());
        DescribeClusterResult res = adminClient.describeCluster();
        Node controller = await(res.controller());
        Integer controllerId = controller != null ? controller.id() : null;
        return await(res.nodes()).stream()
                .map(n -> new Broker(
                        n.id(),
                        n.host(),
                        n.port(),
                        n.rack(),
                        controllerId != null && n.id() == controllerId
                ))
                .sorted((a, b) -> Integer.compare(a.id(), b.id()))
                .toList();
    }
}
