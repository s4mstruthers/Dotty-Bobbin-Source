// Makes everything outside an open overlay `inert` (no Tab, no click, hidden from screen readers),
// so an aria-modal panel really is modal. It walks from the panel up to <body> and marks the
// siblings at every level — that covers the header, #main, the footer and other islands whichever
// island the panel lives in. Counted per element, so two overlays open at once (a picker, then the
// cart drawer) don't undo each other; the newer one lifts the inert another put on its own island
// until it closes. Returns the release; call it before moving focus back.
const held = new Map<HTMLElement, number>();

export function inertOutside(panel: HTMLElement, keep: (Element | null)[] = []): () => void {
  const changed: HTMLElement[] = [];
  const lifted: HTMLElement[] = [];
  for (let a = panel.parentElement; a; a = a.parentElement) {
    if (a.inert && held.has(a)) {
      a.inert = false;
      lifted.push(a);
    }
  }
  for (let node: HTMLElement | null = panel; node && node !== document.body; node = node.parentElement) {
    for (const sib of Array.from(node.parentElement?.children ?? [])) {
      if (sib === node || keep.includes(sib) || !(sib instanceof HTMLElement) || sib.tagName === "SCRIPT") continue;
      const count = held.get(sib);
      if (count) held.set(sib, count + 1);
      else if (sib.inert) continue; // inert already, not ours to undo
      else {
        sib.inert = true;
        held.set(sib, 1);
      }
      changed.push(sib);
    }
  }
  return () => {
    for (const el of changed) {
      const count = (held.get(el) ?? 1) - 1;
      if (count > 0) held.set(el, count);
      else {
        held.delete(el);
        el.inert = false;
      }
    }
    for (const el of lifted) if (held.has(el)) el.inert = true;
  };
}
