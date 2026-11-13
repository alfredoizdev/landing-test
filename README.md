# Landing-test

## What this is

A one-page website for a coffee shop called Ember & Oak Coffee, built with [Next.js](https://nextjs.org).

## What is on the page

- **Hero** – the shop's name, a one-line welcome message, and a "See the menu" button.
- **Menu** – five drinks, each with a short description and a price (for example, Espresso at $3.00).
- **Contact** – the address, opening hours, email and phone number.

## How to run it

You need [Node.js](https://nodejs.org) installed. In a terminal, from this folder:

```
npm install
npm run dev
```

Then open http://localhost:3000 in your browser. The page reloads by itself when you save a change.

## How to run the tests

```
npm test
```

The tests are in `app/page.test.tsx`. They check that the hero, the menu and the contact section show up correctly.

## Where to change the shop's details

Almost everything is in one file, `app/content.ts`:

- **Shop name and welcome message** – the `shop` block.
- **Menu items and prices** – the `menuItems` list. Each line is one drink with a `name`, `description` and `price`. Write prices like `"$4.25"`.
- **Address, opening hours, email and phone** – the `contact` block.

The title shown on the browser tab is separate: change `title` in `app/layout.tsx`.

The tests look for the current shop name, the Espresso at $3.00 and the current phone number. If you change any of those, update `app/page.test.tsx` to match, or `npm test` will fail.
