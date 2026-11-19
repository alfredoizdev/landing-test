"use client";

import { useState } from "react";
import { contact, location } from "./content";

// The map spans the full screen width, so on a phone there is no side margin
// to swipe on. It ignores touches until the visitor asks to move it, so a
// swipe over it keeps scrolling the page down to the footer.
export default function LocationMap() {
  const [active, setActive] = useState(false);
  // Bumped when the visitor is done moving, so the map snaps back to the café.
  const [resets, setResets] = useState(0);

  return (
    <>
      <button
        type="button"
        className="location-toggle"
        aria-pressed={active}
        onClick={() => {
          if (active) setResets(resets + 1);
          setActive(!active);
        }}
      >
        {active ? "Done moving the map" : "Move the map"}
      </button>
      <iframe
        key={resets}
        className="location-map"
        data-active={active}
        tabIndex={active ? 0 : -1}
        title={`Map showing Ember & Oak at ${contact.address}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.006},${location.lat - 0.003},${location.lng + 0.006},${location.lat + 0.003}&layer=mapnik`}
        loading="lazy"
      />
      {/* The embedded map's own pin is always green, so the café gets a caramel
          pin of its own, drawn over the middle of the map where the café sits.
          It hides while the map is being moved, as it would no longer line up. */}
      {!active && (
        <svg className="location-pin" viewBox="0 0 24 34" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" />
          <circle cx="12" cy="12" r="4.5" />
        </svg>
      )}
    </>
  );
}
