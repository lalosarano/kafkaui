import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmModal } from "./confirm-modal";

describe("ConfirmModal", () => {
  it("disables the destructive button until the user types the confirm text", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open
        onOpenChange={() => {}}
        title="Delete topic"
        description="This will delete the topic."
        confirmLabel="Delete"
        confirmText="orders.events.v3"
        onConfirm={onConfirm}
      />,
    );

    const confirmBtn = await screen.findByRole("button", { name: /Delete/i });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("orders.events.v3"), { target: { value: "orders.events.v3" } });
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
