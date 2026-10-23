import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CategoryLabel from "./CategoryLabel";

afterEach(cleanup);
it("keeps the category readable and hides the decorative emoji from assistive technology", () => {
  const transaction = Object.freeze({ categoryName: "Transporte", description: "paguei uber 25 reais", amount: "25.00", type: "EXPENSE" });
  const { container } = render(<CategoryLabel name={transaction.categoryName} />);
  expect(screen.getByText("Transporte")).toBeVisible();
  expect(container.querySelector("[aria-hidden='true']")).toHaveTextContent("🚗");
  expect(transaction.description).toBe("paguei uber 25 reais");
  expect(transaction.amount).toBe("25.00");
});
