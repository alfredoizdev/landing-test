"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { shop } from "./content";

// Fraction of the scroll distance each layer is pushed back down by.
// The page moves at 1, so the photo ends up at 0.6 of the page speed and
// the text at 0.8: faster than the photo, slower than the rest of the page.
export const IMAGE_LAG = 0.4;
export const CONTENT_LAG = 0.2;
// The text is fully faded once this share of the banner has scrolled away.
export const FADE_END = 0.7;

export function parallaxAt(scroll: number, heroHeight: number) {
  const y = Math.min(Math.max(scroll, 0), heroHeight);
  return {
    imageY: y * IMAGE_LAG,
    contentY: y * CONTENT_LAG,
    opacity: Math.max(0, 1 - y / (heroHeight * FADE_END)),
  };
}

const noSubscribe = () => () => {};

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDetailsElement>(null);
  // False in the server HTML and until hydration, true once React handles clicks.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const closeNav = () => {
    if (navRef.current) navRef.current.open = false;
  };

  useEffect(() => {
    const hero = heroRef.current;
    const image = imageRef.current;
    const content = contentRef.current;
    if (!hero || !image || !content) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const height = hero.offsetHeight || window.innerHeight;
      const { imageY, contentY, opacity } = parallaxAt(window.scrollY, height);
      image.style.transform = `translate3d(0, ${imageY.toFixed(2)}px, 0)`;
      content.style.transform = `translate3d(0, ${contentY.toFixed(2)}px, 0)`;
      content.style.opacity = opacity.toFixed(3);
    };

    // At most one write per painted frame, however many scroll events arrive.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={heroRef} className="hero" aria-labelledby="hero-title">
      <div ref={imageRef} className="hero-bg" aria-hidden="true" />
      <nav aria-label="Page sections">
        {/* Until React can close the panel (before hydration or without
            JavaScript), show the plain links rather than a menu that would
            stay open after a link is followed. */}
        {hydrated ? (
          <details ref={navRef} className="nav-menu">
            <summary className="nav-toggle" aria-label="Page sections">
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </summary>
            <div className="nav-panel">
              <a href="#menu" onClick={closeNav}>
                Menu
              </a>
              <a href="#contact" onClick={closeNav}>
                Contact
              </a>
            </div>
          </details>
        ) : (
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <a href="#menu">Menu</a>
            <a href="#contact">Contact</a>
          </div>
        )}
      </nav>
      <div ref={contentRef} className="hero-content">
        <p className="brand">{shop.name}</p>
        <h1 id="hero-title">{shop.headline}</h1>
        <p className="welcome">{shop.welcome}</p>
        <a className="cta" href="#menu">
          See the menu
        </a>
        <p className="open-line">{shop.openLine}</p>
      </div>
    </section>
  );
}
