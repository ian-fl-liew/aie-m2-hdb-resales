import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AgentForm from "./AgentForm";
import { normalizeSingaporePhone } from "../utils/agents";
import { validateAgent } from "../utils/validation";

const validValues = {
  name: "Aisha Rahman",
  email: "aisha@example.com",
  phone: "+65 9123 4567",
  specialty: "HDB",
  remarks: "Focuses on east-side resale transactions.",
};

describe("AgentForm validation", () => {
  it("accepts a complete agent", () => {
    expect(validateAgent(validValues)).toEqual({});
  });

  it("requires every field", () => {
    const errors = validateAgent({
      name: "",
      email: "",
      phone: "",
      specialty: "",
      remarks: "",
    });

    expect(errors).toEqual({
      name: expect.any(String),
      email: expect.any(String),
      phone: expect.any(String),
      specialty: expect.any(String),
      remarks: expect.any(String),
    });
  });

  it.each(["91234567", "9123 4567", "+6591234567", "+65 9123 4567"])(
    "accepts Singapore phone format %s",
    (phone) => {
      expect(validateAgent({ ...validValues, phone })).toEqual({});
    },
  );

  it.each(["51234567", "9123456", "+60 9123 4567", "not-a-phone"])(
    "rejects invalid phone format %s",
    (phone) => {
      expect(validateAgent({ ...validValues, phone })).toHaveProperty("phone");
    },
  );

  it("rejects malformed email, unsupported specialties, and short remarks", () => {
    expect(
      validateAgent({
        ...validValues,
        email: "invalid",
        specialty: "Commercial",
        remarks: "Too short",
      }),
    ).toEqual({
      email: expect.any(String),
      specialty: expect.any(String),
      remarks: expect.any(String),
    });
  });

  it("normalizes valid phone numbers for persistence", () => {
    expect(normalizeSingaporePhone("91234567")).toBe("+65 9123 4567");
    expect(normalizeSingaporePhone("+65 6123 4567")).toBe("+65 6123 4567");
  });

  it("offers exactly the supported specialties", () => {
    render(<AgentForm onSubmit={() => {}} submitting={false} />);

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual(["Select a specialty", "HDB", "Condo", "Landed"]);
  });

  it("shows validation errors and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<AgentForm onSubmit={() => {}} submitting={false} />);

    await user.click(screen.getByRole("button", { name: "Add agent" }));

    expect(screen.getAllByRole("alert")).toHaveLength(5);
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("submits trimmed values and a normalized phone number", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AgentForm
        initialValues={{
          ...validValues,
          name: "  Aisha Rahman  ",
          email: "  aisha@example.com  ",
          phone: "91234567",
          remarks: "  Focuses on east-side resale transactions.  ",
        }}
        onSubmit={onSubmit}
        submitting={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add agent" }));

    expect(onSubmit).toHaveBeenCalledWith(validValues);
  });
});