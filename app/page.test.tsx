import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { contact, menuItems, shop } from "./content";
import Home from "./page";

afterEach(cleanup);

describe("landing page", () => {
  it("shows the hero with the shop name and welcome line", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Ember & Oak Coffee");
    expect(screen.getByText(shop.welcome)).toBeTruthy();
  });

  it("lists the menu items with their prices", () => {
    render(<Home />);
    const menu = screen.getByRole("region", { name: "Menu" });
    const rows = within(menu).getAllByRole("listitem");
    expect(menuItems.length).toBeGreaterThanOrEqual(3);
    expect(rows).toHaveLength(menuItems.length);
    menuItems.forEach((item, i) => {
      expect(within(rows[i]).getByRole("heading", { name: item.name })).toBeTruthy();
      expect(within(rows[i]).getByText(item.price)).toBeTruthy();
      expect(item.price).toMatch(/^\$\d+\.\d{2}$/);
    });
    expect(within(menu).getByText("Espresso")).toBeTruthy();
    expect(within(menu).getByText("$3.00")).toBeTruthy();
  });

  it("shows the address, opening hours, email and phone", () => {
    render(<Home />);
    const section = screen.getByRole("region", { name: "Contact" });
    expect(within(section).getByText("214 Alder Street, Portland, OR 97204")).toBeTruthy();
    contact.hours.forEach((slot) => {
      expect(within(section).getByText(`${slot.days}: ${slot.time}`)).toBeTruthy();
    });
    const email = within(section).getByRole("link", { name: contact.email });
    expect(email.getAttribute("href")).toBe(`mailto:${contact.email}`);
    const phone = within(section).getByRole("link", { name: contact.phone });
    expect(phone.getAttribute("href")).toBe("tel:5035550142");
  });
});
