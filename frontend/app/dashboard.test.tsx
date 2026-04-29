/**
 * Screen-level smoke test for the dashboard. Mocks API.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./page";

vi.mock("@/lib/api/cluster", () => ({
  clusterApi: {
    current: vi.fn(async () => ({
      clusterId: "test-cluster",
      controllerId: 1,
      brokerCount: 3,
      kafkaVersion: "3.7.0",
      totalTopics: 5,
      totalPartitions: 18,
      underReplicatedPartitions: 0,
      offlinePartitions: 0,
    })),
  },
}));

vi.mock("@/lib/api/brokers", () => ({
  brokersApi: {
    list: vi.fn(async () => [
      { id: 1, host: "localhost", port: 9092, rack: null, isController: true },
      { id: 2, host: "localhost", port: 9093, rack: null, isController: false },
    ]),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("DashboardPage", () => {
  it("renders cluster KPIs and broker table once data loads", async () => {
    renderWithQuery(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getAllByText("test-cluster").length).toBeGreaterThan(0);
    });
    // brokers table renders rows
    expect(await screen.findByText("localhost:9092")).toBeInTheDocument();
    expect(await screen.findByText("localhost:9093")).toBeInTheDocument();
  });
});
