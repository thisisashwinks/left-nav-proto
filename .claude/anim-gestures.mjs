/*
 * Gestures for the left-nav prototype — every animation in the shell.
 *
 * Used by the `anim-record` skill. Opens and closes are separate entries
 * because a close is usually the more broken of the two.
 */

export const READY = '[aria-label="Collapse navigation"]';
export const VIEWPORT = { width: 1440, height: 900 };

const L1 = { x: 0, y: 30, width: 460, height: 620 };
const L2 = { x: 0, y: 30, width: 660, height: 620 };
const FULL = { x: 0, y: 0, width: 1440, height: 900 };
const RIGHT = { x: 620, y: 0, width: 820, height: 900 };

/** Resting on the account rail; the directory opens from here. */
const onRail = (p) => p.mouse.move(28, 400, { steps: 1 });

const openDirectory = async (p, { hit, settle }) => {
  await onRail(p); await settle();
  await hit('[aria-label="All accounts"]'); await settle();
};

/**
 * The rail at full height, for the variants whose tools sit at the foot.
 *
 * L1 starts at y=30 and stops at 650, which is fine for the rail's own rows
 * and cuts the bottom tools off entirely — the one thing the `bottom`
 * variant exists to show.
 */
const RAILFULL = { x: 0, y: 0, width: 460, height: 900 };

/**
 * Put the "Rail tools sit" axis on a given option, through the panel.
 *
 * There is no URL or storage hook for the theme — it is React state — so the
 * only honest way to reach an axis is the control a person would use. Scoped
 * by the control's own label rather than by the option text, because "Bottom"
 * is a word several segmented controls in that panel use and a bare text
 * match would set whichever one rendered first.
 *
 * The panel is opened, set and closed again inside `setup`, which runs at
 * full speed — so none of it lands in the captured frames.
 */
const setRailTool = async (p, { settle }, option) => {
  await p.evaluate(() => {
    document.querySelector('[aria-label="Open prototype controls"]')?.click();
  });
  await settle(400);
  const ok = await p.evaluate((want) => {
    const label = [...document.querySelectorAll("span")].find(
      (n) => n.textContent?.trim() === "Rail tools sit",
    );
    const row = label?.parentElement?.querySelector("div");
    const hit = [...(row?.querySelectorAll("button") ?? [])].find(
      (b) => b.textContent?.trim() === want,
    );
    if (!hit || hit.disabled) return false;
    hit.click();
    return true;
  }, option);
  if (!ok) throw new Error(`Rail tools sit: "${option}" not found or disabled`);
  await settle(400);
  /*
    Closed by its own X. Escape would do it too and also reaches the nav —
    a stray Escape here closes whatever panel the gesture is about to open.
  */
  await p.evaluate(() => {
    document.querySelector('[aria-label="Close prototype controls"]')?.click();
  });
  await settle(500);
};

/** The rail's own two gestures, under one setting of the tools axis. */
const railUnder = (option) => ({
  [`rail-hover-in__${option.toLowerCase().replace(/[^a-z]+/g, "-")}`]: {
    clip: RAILFULL,
    setup: async (p, h) => { await setRailTool(p, h, option); },
    go: (p) => onRail(p),
  },
  [`rail-hover-out__${option.toLowerCase().replace(/[^a-z]+/g, "-")}`]: {
    clip: RAILFULL,
    setup: async (p, h) => {
      await setRailTool(p, h, option);
      await onRail(p);
      await h.settle();
    },
    go: (p) => p.mouse.move(700, 400, { steps: 1 }),
  },
});

/**
 * The Launchpad card's two halves, set to one of the four combinations.
 *
 * Quick actions has a panel switch; the Launchpad half does not, so it is
 * hidden the way a person would — Edit, the eye menu, then Save layout. The
 * fresh browser each run starts on Launchpad on, Quick actions off.
 */
const setCardHalves = async (p, { settle }, { launchpad, quickActions }) => {
  if (quickActions) {
    await p.evaluate(() => {
      document.querySelector('[aria-label="Open prototype controls"]')?.click();
    });
    await settle(400);
    const ok = await p.evaluate(() => {
      const sw = [...document.querySelectorAll("button[role=switch]")].find(
        (b) => b.textContent?.trim() === "Quick actions",
      );
      if (!sw) return false;
      if (sw.getAttribute("aria-checked") !== "true") sw.click();
      return true;
    });
    if (!ok) throw new Error('"Quick actions" switch not found');
    await settle(300);
    await p.evaluate(() => {
      document.querySelector('[aria-label="Close prototype controls"]')?.click();
    });
    await settle(400);
  }
  if (!launchpad) {
    await p.evaluate(() => document.querySelector('[aria-label="Edit navigation"]')?.click());
    await settle(500);
    await p.evaluate(() => document.querySelector('[aria-label="Show or hide parts of the nav"]')?.click());
    await settle(400);
    const ok = await p.evaluate(() => {
      const sw = [...document.querySelectorAll("[role=dialog] button[role=switch]")].find(
        (b) => b.textContent?.trim() === "Launchpad",
      );
      if (!sw) return false;
      if (sw.getAttribute("aria-checked") === "true") sw.click();
      return true;
    });
    if (!ok) throw new Error('"Launchpad" switch not found in the eye menu');
    await settle(300);
    await p.keyboard.press("Escape");
    await settle(300);
    // Done becomes "Save layout" once something changed; it opens a naming dialog.
    await p.evaluate(() => {
      [...document.querySelectorAll("button")]
        .find((b) => b.getBoundingClientRect().left < 340 && /^(Done|Save layout)$/.test(b.textContent?.trim() ?? ""))
        ?.click();
    });
    await settle(500);
    await p.evaluate(() => {
      [...document.querySelectorAll("[role=dialog] button")]
        .find((b) => b.textContent?.trim() === "Save layout")
        ?.click();
    });
    await settle(600);
  }
  // A setup that silently missed would record the wrong case under the right name.
  const got = await p.evaluate(() => {
    const card = document.querySelector("[data-launchpad-card]");
    return {
      launchpad: !!document.querySelector('[aria-label="Open Launchpad"]'),
      quickActions: !!card && /Quick actions/i.test(card.textContent ?? ""),
      editing: [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Discard"),
    };
  });
  if (got.launchpad !== launchpad || got.quickActions !== quickActions || got.editing) {
    throw new Error(`card halves: wanted ${JSON.stringify({ launchpad, quickActions })}, got ${JSON.stringify(got)}`);
  }
};

/**
 * L1 collapse and expand under each card combination, Oct 16.
 *
 * The strip and the expanded face carry different rows at the top for each
 * one, so the hand-over between them is a different picture in all four.
 */
const CARD_CASES = {
  "lp-only": { launchpad: true, quickActions: false },
  "qa-only": { launchpad: false, quickActions: true },
  both: { launchpad: true, quickActions: true },
  none: { launchpad: false, quickActions: false },
};

const cardCases = () =>
  Object.fromEntries(
    Object.entries(CARD_CASES).flatMap(([name, halves]) =>
      [["", L1], ["__full", FULL]].flatMap(([suffix, clip]) => [
        [`l1-collapse__${name}${suffix}`, {
          clip,
          setup: async (p, h) => { await setCardHalves(p, h, halves); },
          go: (p, { hit }) => hit('[aria-label="Collapse navigation"]'),
        }],
        [`l1-expand__${name}${suffix}`, {
          clip,
          setup: async (p, h) => {
            await setCardHalves(p, h, halves);
            await h.hit('[aria-label="Collapse navigation"]');
            await h.settle();
          },
          go: (p, { hit }) => hit('[aria-label="Expand navigation"]'),
        }],
      ]),
    ),
  );

export const GESTURES = {
  // ---- L1 column ----
  'l1-collapse': { clip: L1, go: (p, { hit }) => hit('[aria-label="Collapse navigation"]') },
  'l1-expand': { clip: L1,
    setup: async (p, { hit, settle }) => { await hit('[aria-label="Collapse navigation"]'); await settle(); },
    go: (p, { hit }) => hit('[aria-label="Expand navigation"]') },

  /*
   * The same pair at full width, Oct 16.
   *
   * The 460px clip proves the nav and the canvas move in lockstep and says
   * nothing about the rest of the window — and the thing Ashwin reported, a
   * white band during the narrowing, is by definition somewhere the narrow
   * clip does not look.
   */
  'l1-collapse__full': { clip: FULL, go: (p, { hit }) => hit('[aria-label="Collapse navigation"]') },
  'l1-expand__full': { clip: FULL,
    setup: async (p, { hit, settle }) => { await hit('[aria-label="Collapse navigation"]'); await settle(); },
    go: (p, { hit }) => hit('[aria-label="Expand navigation"]') },

  ...cardCases(),

  // ---- L2 flyout ----
  'l2-open': { clip: L2, go: (p, { hitText }) => hitText('CRM') },
  'l2-close': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },

  /*
   * The same two gestures again, under a v1 name.
   *
   * Oct 7: the exit was re-sequenced so the contents leave before the
   * ground (see `.motion-panel-out` in motion.css). Recorded beside the
   * originals rather than over them — the point of the pair is the
   * before-and-after, and overwriting the before destroys the comparison.
   */
  'l2-open__v1': { clip: L2, go: (p, { hitText }) => hitText('CRM') },
  'l2-close__v1': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },

  'recents-open': { clip: L2, go: (p, { hitText }) => hitText('View all') },
  'recents-close': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('View all'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },

  /* The L3 accordion inside an L2 panel — a height change, not a fade. */
  'l3-expand': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); },
    go: (p, { hitText }) => hitText('Calendars') },
  'l3-collapse': { clip: L2,
    setup: async (p, { hitText, settle }) => {
      await hitText('CRM'); await settle();
      await hitText('Calendars'); await settle();
    },
    go: (p, { hitText }) => hitText('Calendars') },

  /* Pinning moves a row between two lists — the one gesture with real travel. */
  'pin-row': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); await p.mouse.move(400, 300); },
    go: (p, { hit }) => hit('[aria-label="Pin"]') },
  'unpin-row': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); await p.mouse.move(400, 300); },
    go: (p, { hit }) => hit('[aria-label="Unpin"]') },

  // ---- account rail and directory ----
  'rail-hover-in': { clip: L1, go: (p) => onRail(p) },
  'rail-hover-out': { clip: L1,
    setup: async (p, { settle }) => { await onRail(p); await settle(); },
    go: (p) => p.mouse.move(700, 400, { steps: 1 }) },

  'accounts-open': { clip: L1,
    setup: async (p, { settle }) => { await onRail(p); await settle(); },
    go: (p, { hit }) => hit('[aria-label="All accounts"]') },
  'accounts-close': { clip: L1, setup: openDirectory, go: (p) => p.keyboard.press('Escape') },
  /* Closing by the X rather than Escape — the way it is actually done. */
  'accounts-close-x': { clip: L1, setup: openDirectory,
    go: (p, { hit }) => hit('[aria-label="Close accounts"]') },

  'select-on': { clip: L1, setup: openDirectory, go: (p, { hitText }) => hitText('Select') },
  /*
   * Leaving select mode is NOT the inverse of entering it: the header swaps
   * Select -> Cancel and the close X -> a "select all" checkbox, so two
   * controls cross-fade while every row loses its checkbox.
   */
  'select-off': { clip: L1,
    setup: async (p, h) => { await openDirectory(p, h); await h.hitText('Select'); await h.settle(); },
    go: (p, { hitText }) => hitText('Cancel') },

  /* Switching account re-skins the whole shell. */
  'account-switch': { clip: FULL, setup: openDirectory,
    go: (p, { hit }) => hit('[aria-label="Northwind Realty"]') },

  // ---- edit mode ----
  'edit-l1-enter': { clip: L1, go: (p, { hit }) => hit('[aria-label="Edit navigation"]') },
  'edit-l1-exit': { clip: L1,
    setup: async (p, { hit, settle }) => { await hit('[aria-label="Edit navigation"]'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },
  'edit-l2-enter': { clip: L2,
    setup: async (p, { hitText, settle }) => { await hitText('CRM'); await settle(); },
    go: (p, { hit }) => hit('[aria-label="Edit navigation"]') },
  'edit-l2-exit': { clip: L2,
    setup: async (p, { hitText, hit, settle }) => {
      await hitText('CRM'); await settle();
      await hit('[aria-label="Edit navigation"]'); await settle();
    },
    go: (p) => p.keyboard.press('Escape') },

  // ---- header and overlays ----
  'ask-ai-open': { clip: RIGHT, go: (p, { hit }) => hit('header [aria-label="Ask AI"]') },
  'ask-ai-close': { clip: RIGHT,
    setup: async (p, { hit, settle }) => { await hit('header [aria-label="Ask AI"]'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },

  'search-open': { clip: FULL, go: (p, { hit }) => hit('header [title="Search"]') },
  'search-close': { clip: FULL,
    setup: async (p, { hit, settle }) => { await hit('header [title="Search"]'); await settle(); },
    go: (p) => p.keyboard.press('Escape') },

  'notifications-open': { clip: RIGHT, go: (p, { hit }) => hit('header [aria-label="Notifications"]') },
  'account-menu-open': { clip: RIGHT, go: (p, { hit }) => hit('header [aria-label="Account"]') },
  'help-open': { clip: RIGHT, go: (p, { hit }) => hit('header [aria-label="Help"]') },
  'launchpad-switch': { clip: L2, go: (p, { hit }) => hit('[aria-label="Switch Launchpad"]') },

  'banner-next': { clip: { x: 0, y: 0, width: 1440, height: 80 },
    go: (p, { hit }) => hit('[aria-label="Next banner"]') },

  /* Launchpad's own accordion cards. Addressed by position: '[aria-expanded]'
     alone also matches the header's switcher, which is a different gesture. */
  'card-expand': { clip: { x: 560, y: 30, width: 880, height: 620 },
    go: (p) => p.evaluate(() => {
      const el = [...document.querySelectorAll('[aria-expanded="false"]')]
        .find((n) => n.offsetParent && n.getBoundingClientRect().x > 560);
      if (!el) throw new Error('no collapsed Launchpad card');
      el.click();
    }) },

  /* A tooltip on the collapsed rail: the smallest transition in the shell. */
  'rail-tooltip': { clip: L1,
    setup: async (p, { hit, settle }) => { await hit('[aria-label="Collapse navigation"]'); await settle(); },
    go: (p) => p.mouse.move(88, 329, { steps: 1 }) },

  /*
   * The rail's hover, under the three placements of its tools row.
   *
   * Ashwin, Oct 16. Each variant puts the search/edit row somewhere else in
   * the strip, so the thing that animates on hover is a different shape in
   * each — the point of recording all three rather than trusting one.
   */
  ...railUnder("Bottom"),
  ...railUnder("In the agency bar"),
  ...railUnder("Below the agency"),
};
