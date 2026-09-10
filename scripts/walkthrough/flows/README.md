# Flows

One file per thing worth walking somebody through. A flow is **code**, not config, so it has the
whole Playwright API — the object it exports is only there to give the video its chapters.

```js
export default {
  title: 'Het portaaloverzicht',            // the opening card
  description: 'Wat een kandidaat ziet…',   // one line under it
  auth: { email: 'demo@…', metadata: {…} }, // optional: mints a real local session
  context: { colorScheme: 'light' },        // optional: passed to newContext()
  steps: [
    {
      chapter: 'De modules',                 // the card before the step
      description: 'Eén kaart per module.',  // why this step matters
      cardMs: 2200,                          // optional, how long the card holds
      async run(page, kit) { … },            // what the viewer watches
    },
  ],
};
```

`kit` is four helpers: `visit(path)`, `reveal(selector, {hold})`, `beat(ms)`, `fill(sel, text)`.

## Conventions, and why

- **A chapter says why, not which element.** "De modules" + "Eén kaart per module, met leren en
  oefenen apart" is a walkthrough; "Click .mod-card" is a test transcript read aloud.
- **Every step needs a beat.** Playwright acts faster than a person can read. `kit.reveal()` and
  `kit.beat()` exist so the viewer's eye arrives before the next thing moves.
- **Never assert.** A flow demonstrates; `tests/` proves. A flow that fails records the failure and
  exits non-zero, which is the useful half of an assertion without the flow turning into a
  second, worse test suite.
- **Prefer a real session over a screenshot of one.** `auth` mints a session against the **local**
  stack through the same GoTrue endpoint the app uses, so the video shows the product, not a
  logged-out shell. Give the demo user the `modules` metadata the flow needs to have bought.
- **Use role and text selectors, not the CSS the design system owns.** `.mod-card` is a class a
  restyle is allowed to rename; "Niveau A2" is what the page promises. A flow keyed on internal
  classes breaks on exactly the commit whose result you wanted to see.
- **Dutch chapters.** The owner watches these, and the product is Dutch.
