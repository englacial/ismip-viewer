/**
 * Library entry: lets host pages embed the ISMIP6 viewer by calling
 * mount() with a DOM element and a config object — no iframe, no URL parsing.
 *
 * Usage from a host page:
 *
 *   import { mount } from "ismip6-viewer";
 *   mount(document.getElementById("viewer")!, {
 *     store_url: "https://data.source.coop/englacial/ismip6/icechunk-ais/",
 *     model: "DOE_MALI",
 *     experiment: "ctrl_proj_std",
 *     variable: "lithk",
 *   });
 *
 * The mount target must have an explicit height — the viewer fills its
 * container (width:100%, height:100%).
 *
 * Known limitation: the viewer's zustand store is a module-level singleton
 * (see stores/viewerStore.ts — `create()` returns a hook backed by shared
 * module state). Only one mount() per page is supported until that's
 * refactored to per-mount stores via `createStore()` + React Context.
 * Unrelated to which icechunk-js implementation is used.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import type { EmbedConfig } from "./utils/urlParams";

export type { EmbedConfig };

const roots = new WeakMap<HTMLElement, ReactDOM.Root>();

export function mount(el: HTMLElement, config: EmbedConfig): void {
  const root = ReactDOM.createRoot(el);
  roots.set(el, root);
  root.render(
    <React.StrictMode>
      <App embedConfigOverride={config} />
    </React.StrictMode>
  );
}

export function unmount(el: HTMLElement): void {
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
}
