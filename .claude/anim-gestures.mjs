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

export const GESTURES = {
  // ---- L1 column ----
  'l1-collapse': { clip: L1, go: (p, { hit }) => hit('[aria-label="Collapse navigation"]') },
  'l1-expand': { clip: L1,
    setup: async (p, { hit, settle }) => { await hit('[aria-label="Collapse navigation"]'); await settle(); },
    go: (p, { hit }) => hit('[aria-label="Expand navigation"]') },

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
};
