package com.kafkagui.cluster;

import static org.junit.jupiter.api.Assertions.*;

import com.kafkagui.AbstractKafkaIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ClusterServiceIT extends AbstractKafkaIT {

    @Autowired ClusterService clusterService;

    @Test
    void cluster_info_reflects_a_running_broker() {
        var info = clusterService.current();
        assertNotNull(info.clusterId());
        assertTrue(info.brokerCount() >= 1);
        assertEquals(0, info.offlinePartitions(), "fresh cluster should have no offline partitions");
        assertNotNull(info.controllerId());
    }
}
