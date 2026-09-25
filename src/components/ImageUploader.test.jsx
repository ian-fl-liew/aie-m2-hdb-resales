import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageUploader from "./ImageUploader";

describe("ImageUploader", () => {
  it("adds only enough URLs to reach the five-image limit", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ImageUploader
        images={[
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
        ]}
        onChange={onChange}
      />,
    );

    await user.type(
      screen.getByRole("textbox"),
      "https://example.com/5.jpg, https://example.com/6.jpg",
    );
    await user.click(screen.getByRole("button", { name: "Add URL" }));

    expect(onChange).toHaveBeenCalledWith([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
      "https://example.com/3.jpg",
      "https://example.com/4.jpg",
      "https://example.com/5.jpg",
    ]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "You can upload up to 5 images.",
    );
  });

  it("disables file uploads once five images exist", () => {
    render(
      <ImageUploader
        images={[
          "https://example.com/1.jpg",
          "https://example.com/2.jpg",
          "https://example.com/3.jpg",
          "https://example.com/4.jpg",
          "https://example.com/5.jpg",
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /limit reached/i }),
    ).toBeDisabled();
  });
});
