package com.kafkagui.cluster;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Resolves the active cluster for each REST request.
 * Looks at (in order): {@code X-Cluster-Id} header, {@code clusterId} query param, the store's
 * default cluster. The /api/v1/cluster-configs endpoints are exempt — those manage clusters
 * and shouldn't require one to already be selected.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ClusterContextFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Cluster-Id";
    private static final String QUERY_PARAM = "clusterId";

    private final ClusterConfigStore store;

    public ClusterContextFilter(ClusterConfigStore store) {
        this.store = store;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String header = request.getHeader(HEADER);
            String param = request.getParameter(QUERY_PARAM);
            String resolved = (header != null && !header.isBlank()) ? header
                    : (param != null && !param.isBlank()) ? param
                    : store.defaultClusterId().orElse(null);
            if (resolved != null) ClusterContext.set(resolved);
            chain.doFilter(request, response);
        } finally {
            ClusterContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator");
    }
}
