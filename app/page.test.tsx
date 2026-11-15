import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { contact, menuItems, shop } from "./content";
import { parallaxAt } from "./hero";
import Home from "./page";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

let frames: FrameRequestCallback[] = [];

// Frames are held back so a test decides when the browser "paints".
function holdFrames() {
  frames = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
}

function paint() {
  const due = frames.splice(0);
  act(() => due.forEach((cb) => cb(0)));
}

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => {
    fireEvent.scroll(window);
  });
}

describe("landing page", () => {
  it("shows the hero with an enticing title, the shop name and welcome line", () => {
    render(<Home />);
    const title = screen.getByRole("heading", { level: 1 });
    expect(title.textContent).toBe("Fall in Love at First Sip");
    expect(title.textContent).toBe(shop.headline);
    // the shop name stays visible as a small line above the title
    const brand = screen.getByText("Ember & Oak Coffee");
    expect(brand.classList.contains("brand")).toBe(true);
    expect(brand.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

  it("uses the coffee beans photo as a full-size hero background under a brown overlay", () => {
    const { container } = render(<Home />);
    expect(container.querySelector("section.hero")).toBeTruthy();
    expect(existsSync(join(process.cwd(), "public", "hero-beans.jpg"))).toBe(true);

    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const hero = css.match(/\.hero-bg \{([^}]*)\}/)?.[1] ?? "";
    expect(hero).toContain('url("/hero-beans.jpg")');
    expect(hero).toMatch(/background-size:\s*cover/);
    // the brown overlay is listed first, so it is painted on top of the photo
    expect(hero).toMatch(/linear-gradient\(rgba\(42, 28, 20, 0\.6\)[^;]*url\("\/hero-beans\.jpg"\)/);
  });

  it("makes the hero banner tall, with its content centred in the extra height", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const hero = css.match(/\.hero \{([^}]*)\}/)?.[1] ?? "";
    const minHeight = Number(hero.match(/min-height:\s*(\d+)vh/)?.[1] ?? 0);
    expect(minHeight).toBeGreaterThanOrEqual(80);
    expect(hero).toMatch(/display:\s*flex/);
    expect(hero).toMatch(/flex-direction:\s*column/);
  });

  it("shows the Menu title larger than the other section titles", () => {
    render(<Home />);
    const title = screen.getByRole("heading", { level: 2, name: "Menu" });
    expect(title.closest("section")?.id).toBe("menu");

    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const base = Number(css.match(/\.section h2 \{[^}]*font-size:\s*([\d.]+)rem/)?.[1]);
    const menu = css.match(/#menu h2 \{[^}]*font-size:\s*clamp\(([\d.]+)rem,[^,]*,\s*([\d.]+)rem\)/);
    expect(base).toBeGreaterThan(0);
    expect(Number(menu?.[1])).toBeGreaterThan(base);
    expect(Number(menu?.[2])).toBeGreaterThan(base);
  });

  it("shows the hero title and welcome line in large type", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const title = css.match(/\.hero h1 \{[^}]*font-size:\s*clamp\(([\d.]+)rem,\s*([\d.]+)vw,\s*([\d.]+)rem\)/);
    // larger than the previous clamp(2.5rem, 8vw, 5rem)
    expect(Number(title?.[1])).toBeGreaterThan(2.5);
    expect(Number(title?.[2])).toBeGreaterThan(8);
    expect(Number(title?.[3])).toBeGreaterThan(5);

    const welcome = css.match(/\.welcome \{[^}]*font-size:\s*clamp\(([\d.]+)rem,[^,]*,\s*([\d.]+)rem\)/);
    // larger than the previous 1.25rem at every screen width
    expect(Number(welcome?.[1])).toBeGreaterThan(1.25);
    expect(Number(welcome?.[2])).toBeGreaterThan(Number(welcome?.[1]));
  });

  it("shows the See the menu button square-cornered and large", () => {
    render(<Home />);
    const button = screen.getByRole("link", { name: "See the menu" });
    expect(button.classList.contains("cta")).toBe(true);
    expect(button.getAttribute("href")).toBe("#menu");

    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const cta = css.match(/\.cta \{([^}]*)\}/)?.[1] ?? "";
    expect(cta).toMatch(/border-radius:\s*0;/);
    const padding = cta.match(/padding:\s*([\d.]+)rem\s+([\d.]+)rem/);
    // larger than the previous 0.85rem 1.75rem padding and inherited 1rem text
    expect(Number(padding?.[1])).toBeGreaterThan(0.85);
    expect(Number(padding?.[2])).toBeGreaterThan(1.75);
    expect(Number(cta.match(/font-size:\s*([\d.]+)rem/)?.[1])).toBeGreaterThan(1);
  });

  describe("hero parallax", () => {
    const layers = (container: HTMLElement) => ({
      image: container.querySelector<HTMLElement>(".hero-bg")!,
      content: container.querySelector<HTMLElement>(".hero-content")!,
    });
    const shift = (el: HTMLElement) => Number(el.style.transform.match(/translate3d\(0(?:px)?, ([\d.]+)px/)?.[1]);

    it("keeps the title, welcome line and button together in the layer that moves and fades", () => {
      const { container } = render(<Home />);
      const { image, content } = layers(container);
      expect(image.closest("section.hero")).toBeTruthy();
      expect(within(content).getByRole("heading", { level: 1 })).toBeTruthy();
      expect(within(content).getByText(shop.welcome)).toBeTruthy();
      expect(within(content).getByRole("link", { name: "See the menu" })).toBeTruthy();
      // the page links stay put and fully visible
      expect(within(content).queryByRole("navigation")).toBeNull();
    });

    it("moves the photo slower than the page, and the text faster than the photo", () => {
      holdFrames();
      const { container } = render(<Home />);
      const { image, content } = layers(container);
      expect(shift(image)).toBe(0);
      expect(Number(content.style.opacity)).toBe(1);

      scrollTo(200);
      paint();
      // each layer is pushed back down by part of the 200px the page moved up
      expect(shift(image)).toBeGreaterThan(0);
      expect(shift(image)).toBeLessThan(200);
      expect(shift(content)).toBeGreaterThan(0);
      expect(shift(content)).toBeLessThan(shift(image));
    });

    it("fades the text out gradually as the banner leaves the screen", () => {
      holdFrames();
      const { container } = render(<Home />);
      const { content } = layers(container);
      const seen = [0, 0.2, 0.4, 0.6, 1].map((part) => {
        scrollTo(window.innerHeight * part);
        paint();
        return Number(content.style.opacity);
      });
      expect(seen[0]).toBe(1);
      expect(seen[4]).toBe(0);
      for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeLessThan(seen[i - 1] || 2);
      expect(seen[2]).toBeGreaterThan(0);
    });

    it("changes by small even steps, with no jumps, and stops once the banner is gone", () => {
      let last = parallaxAt(0, 800);
      for (let y = 1; y <= 800; y++) {
        const now = parallaxAt(y, 800);
        expect(now.imageY - last.imageY).toBeLessThan(1);
        expect(now.contentY - last.contentY).toBeLessThan(1);
        expect(last.opacity - now.opacity).toBeLessThan(0.01);
        last = now;
      }
      expect(parallaxAt(5000, 800)).toEqual(parallaxAt(800, 800));
      expect(parallaxAt(-50, 800)).toEqual(parallaxAt(0, 800));
    });

    it("writes at most once per frame, however many scroll events arrive", () => {
      holdFrames();
      const { container } = render(<Home />);
      const { image } = layers(container);
      scrollTo(100);
      scrollTo(200);
      scrollTo(300);
      expect(frames).toHaveLength(1);
      expect(shift(image)).toBe(0);
      paint();
      expect(shift(image)).toBe(parallaxAt(300, window.innerHeight).imageY);
      // and the next scroll gets a frame of its own
      scrollTo(400);
      expect(frames).toHaveLength(1);
    });

    it("leaves the banner still for people who ask for reduced motion", () => {
      vi.stubGlobal("matchMedia", () => ({ matches: true }));
      const { container } = render(<Home />);
      const { image, content } = layers(container);
      scrollTo(300);
      expect(image.style.transform).toBe("");
      expect(content.style.opacity).toBe("");
    });

    it("moves the layers with transforms only, and clips the photo to the banner", () => {
      const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
      expect(css.match(/\.hero \{([^}]*)\}/)?.[1]).toMatch(/overflow:\s*hidden/);
      expect(css.match(/\.hero-bg \{([^}]*)\}/)?.[1]).toMatch(/will-change:\s*transform/);
      expect(css).not.toMatch(/background-attachment:\s*fixed/);
    });
  });
});
