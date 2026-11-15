import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { contact, menuItems, reviews, shop } from "./content";
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

  it("shows each menu item as a card with its own photo", () => {
    render(<Home />);
    const menu = screen.getByRole("region", { name: "Menu" });
    const cards = within(menu).getAllByRole("listitem");
    expect(menuItems).toHaveLength(5);
    expect(new Set(menuItems.map((item) => item.image)).size).toBe(menuItems.length);
    menuItems.forEach((item, i) => {
      expect(cards[i].classList.contains("menu-card")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", item.image))).toBe(true);
      const photo = within(cards[i]).getByRole("img", { name: item.alt });
      expect(decodeURIComponent(photo.getAttribute("src") ?? "")).toContain(item.image);
      // name, price and description all sit on the card, over the photo
      const body = cards[i].querySelector(".menu-card-body")!;
      expect(within(body as HTMLElement).getByText(item.name)).toBeTruthy();
      expect(within(body as HTMLElement).getByText(item.price)).toBeTruthy();
      expect(within(body as HTMLElement).getByText(item.description)).toBeTruthy();
    });
  });

  it("lays the menu cards out as a mosaic, with larger cards in the first row", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const grid = css.match(/\.menu \{([^}]*)\}/)?.[1] ?? "";
    expect(grid).toMatch(/display:\s*grid/);
    const columns = Number(grid.match(/grid-template-columns:\s*repeat\((\d+),/)?.[1]);
    const span = (rule: RegExp) => Number(css.match(rule)?.[1]);
    const small = span(/\.menu-card \{[^}]*grid-column:\s*span (\d+)/);
    const large = span(/\.menu-card:nth-child\(5n \+ 1\),\s*\.menu-card:nth-child\(5n \+ 2\) \{[^}]*grid-column:\s*span (\d+)/);
    expect(large).toBeGreaterThan(small);
    // two large cards fill the first row, three small ones the second
    expect(large * 2).toBe(columns);
    expect(small * 3).toBe(columns);
    expect(css.match(/\.menu-card img \{([^}]*)\}/)?.[1]).toMatch(/object-fit:\s*cover/);
  });

  it("gives the menu cards tall rows, on desktop and on smaller screens", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const rows = [...css.matchAll(/\.menu \{[^}]*grid-auto-rows:\s*([\d.]+)rem/g)].map((m) => Number(m[1]));
    // first the desktop rule, then the tablet override
    expect(rows).toHaveLength(2);
    expect(rows[0]).toBeGreaterThanOrEqual(23);
    expect(rows[1]).toBeGreaterThanOrEqual(19);
  });

  it("zooms the photo and reveals the description when a card is hovered", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const rule = (selector: string) =>
      css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{([^}]*)\\}`))?.[1] ?? "";

    expect(rule(".menu-card")).toMatch(/overflow:\s*hidden/);
    expect(rule(".menu-card img")).toMatch(/transition:\s*transform/);
    const zoom = Number(rule(".menu-card:hover img").match(/transform:\s*scale\(([\d.]+)\)/)?.[1]);
    expect(zoom).toBeGreaterThan(1);

    // hidden at rest, shown on hover
    expect(rule(".menu-card-more")).toMatch(/opacity:\s*0;/);
    expect(rule(".menu-card-more")).toMatch(/grid-template-rows:\s*0fr/);
    expect(rule(".menu-card:hover .menu-card-more")).toMatch(/opacity:\s*1;/);
    expect(rule(".menu-card:hover .menu-card-more")).toMatch(/grid-template-rows:\s*1fr/);

    // phones cannot hover, so they always see the description
    const touch = css.match(/@media \(hover: none\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(touch).toMatch(/\.menu-card-more \{[^}]*opacity:\s*1;/);
    // and people who ask for reduced motion get no zoom
    const calm = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(calm).toMatch(/\.menu-card:hover img \{[^}]*transform:\s*none/);
  });

  it("shows three customer reviews between the menu and the contact details", () => {
    render(<Home />);
    const section = screen.getByRole("region", { name: "What our customers say" });
    const menu = screen.getByRole("region", { name: "Menu" });
    const contactSection = screen.getByRole("region", { name: "Contact" });
    expect(menu.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(section.compareDocumentPosition(contactSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const cards = within(section).getAllByRole("listitem");
    expect(reviews).toHaveLength(3);
    expect(cards).toHaveLength(3);
    reviews.forEach((review, i) => {
      expect(cards[i].classList.contains("review-card")).toBe(true);
      expect(within(cards[i]).getByText(review.quote)).toBeTruthy();
      expect(within(cards[i]).getByText(review.name)).toBeTruthy();
      // first name and the initial of the surname only
      expect(review.name).toMatch(/^\p{Lu}\p{Ll}+ \p{Lu}\.$/u);
      const stars = within(cards[i]).getByRole("img", { name: "5 out of 5 stars" });
      expect(stars.textContent?.trim()).toBe("★★★★★");
    });
  });

  it("styles the review cards dark brown, rounded and softly shadowed, with readable off-white text and light gold stars", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const token = (name: string) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`))?.[1] ?? "";
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => {
        const c = parseInt(hex.slice(i, i + 2), 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    const card = css.match(/\.review-card \{([^}]*)\}/)?.[1] ?? "";
    expect(card).toMatch(/background:\s*var\(--brown\)/);
    expect(card).toMatch(/color:\s*var\(--bg\)/);
    expect(card).toMatch(/border-radius:\s*[\d.]+rem/);
    const shadow = Number(card.match(/box-shadow:[^;]*rgba\(42, 28, 20, ([\d.]+)\)/)?.[1]);
    expect(shadow).toBeGreaterThan(0);
    expect(shadow).toBeLessThanOrEqual(0.15);
    expect(css.match(/\.review-card \.stars \{([^}]*)\}/)?.[1]).toMatch(/color:\s*var\(--gold\)/);
    expect(css.match(/\.review-card figcaption \{([^}]*)\}/)?.[1]).toMatch(/color:\s*var\(--line\)/);

    // off-white rather than pure white, and every colour on the card clears WCAG AAA (7:1)
    expect(token("bg")).not.toBe("#ffffff");
    for (const name of ["bg", "gold", "line"]) {
      expect(contrast(token(name), token("brown"))).toBeGreaterThanOrEqual(7);
    }
  });

  it("puts the review cards in a row of three, and one under another on phones", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const row = css.match(/\.reviews \{([^}]*)\}/)?.[1] ?? "";
    expect(row).toMatch(/display:\s*grid/);
    expect(row).toMatch(/grid-template-columns:\s*repeat\(3, 1fr\)/);
    const phone = css.match(/@media \(max-width: 40rem\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
    expect(phone).toMatch(/\.reviews \{[^}]*grid-template-columns:\s*1fr;/);
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
