/**
 * MyST directive for embedding the ISMIP6 viewer.
 *
 * Emits a mount <div> + module <script> that imports the viewer library
 * bundle and calls mount(div, config). No iframe — the viewer renders into
 * the host page's DOM.
 *
 * Usage:
 *   ```{ismip6-viewer}
 *   :store_url: https://data.source.coop/englacial/ismip6/icechunk-ais/
 *   :model: DOE_MALI
 *   :experiment: ctrl_proj_std
 *   :variable: lithk
 *   :controls: time
 *   :height: 600px
 *   ```
 *
 * The host site must serve the viewer library bundle at the path given by
 * `:bundle:` (default `/ismip6-viewer.js`). Build the bundle with
 * `cd js-viewer && npm run build:lib` in the ismip-viewer repo, then place
 * `dist-lib/ismip6-viewer.js` under the site's static assets.
 *
 * Register in myst.yml:
 *   project:
 *     plugins:
 *       - ismip6-viewer.mjs
 */

const DEFAULT_BUNDLE_URL = '/ismip6-viewer.js';

// JSON.stringify produces strings safe for inclusion in JS source, but `</`
// would prematurely close the surrounding <script> tag. Escape '<' to its
// unicode form so the parser stays inside the script.
function safeJsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function buildConfig(options) {
  const config = {};
  if (options.model) config.model = options.model;
  if (options.experiment) config.experiment = options.experiment;
  if (options.variable) config.variable = options.variable;
  if (options.time !== undefined) config.time = options.time;
  if (options.colormap) config.colormap = options.colormap;
  if (options.vmin !== undefined) config.vmin = options.vmin;
  if (options.vmax !== undefined) config.vmax = options.vmax;
  if (options.controls) config.controls = options.controls;
  if (options.store_url) config.store_url = options.store_url;
  if (options.store_ref) config.store_ref = options.store_ref;
  if (options.group_path) config.group_path = options.group_path;
  if (options.data_view) config.data_view = options.data_view;
  if (options.grid_width !== undefined) config.grid_width = options.grid_width;
  if (options.grid_height !== undefined) config.grid_height = options.grid_height;
  if (options.cell_size !== undefined) config.cell_size = options.cell_size;
  if (options.x_min !== undefined) config.x_min = options.x_min;
  if (options.y_min !== undefined) config.y_min = options.y_min;
  if (options.default_year !== undefined) config.default_year = options.default_year;
  if (options.show_selectors) config.show_selectors = options.show_selectors === 'true';
  if (options.show_colorbar) config.show_colorbar = options.show_colorbar !== 'false';
  config.autoload = true;

  if (options.panels) {
    try {
      config.panels = JSON.parse(options.panels.replace(/'/g, '"'));
    } catch (e) {
      console.warn('ismip6-viewer: failed to parse panels option:', e);
    }
  }
  return config;
}

const ismip6ViewerDirective = {
  name: 'ismip6-viewer',
  doc: 'Embed an interactive ISMIP6 ice sheet model viewer (mounts the viewer library bundle into a div on the page).',
  arg: {
    type: String,
    doc: 'Optional override for the viewer library bundle URL (default: /ismip6-viewer.js)',
    required: false,
  },
  options: {
    bundle: {
      type: String,
      doc: 'URL of the viewer library bundle (alternative to the positional arg)',
    },
    model: { type: String, doc: 'Model name (e.g., "DOE_MALI", "JPL1_ISSM")' },
    experiment: { type: String, doc: 'Experiment name (e.g., "ctrl_proj_std", "exp05")' },
    variable: { type: String, doc: 'Variable to display (e.g., "lithk", "acabf", "orog")' },
    time: { type: Number, doc: 'Initial time index' },
    colormap: {
      type: String,
      doc: 'Colormap name (viridis, plasma, inferno, magma, cividis, turbo, coolwarm, RdBu, gray)',
    },
    vmin: { type: Number, doc: 'Color scale minimum value' },
    vmax: { type: Number, doc: 'Color scale maximum value' },
    panels: {
      type: String,
      doc: 'JSON array of panel configs: [{"model": "X", "experiment": "Y"}, ...]',
    },
    controls: { type: String, doc: 'Which controls to show: "all", "time", or "none"' },
    store_url: { type: String, doc: 'icechunk store URL (required)', required: true },
    store_ref: {
      type: String,
      doc: 'Store version: branch name, tag, or snapshot ID (default: "main")',
    },
    group_path: {
      type: String,
      doc: 'Override group path within store (e.g., "model/experiment")',
    },
    data_view: {
      type: String,
      doc: 'Data view: "combined" (default), "state", or "flux"',
    },
    grid_width: { type: Number, doc: 'Grid width in cells (fallback)' },
    grid_height: { type: Number, doc: 'Grid height in cells (fallback)' },
    cell_size: { type: Number, doc: 'Cell size in coordinate units (fallback)' },
    x_min: { type: Number, doc: 'Grid origin X coordinate (fallback)' },
    y_min: { type: Number, doc: 'Grid origin Y coordinate (fallback)' },
    default_year: {
      type: Number,
      doc: 'Default year to display on load (e.g., 2025). Overrides raw time index.',
    },
    show_selectors: {
      type: String,
      doc: 'Show model/experiment dropdown selectors when panels are pre-configured: "true" or "false"',
    },
    show_colorbar: {
      type: String,
      doc: 'Show floating colorbar in embed mode: "true" (default) or "false"',
    },
    width: { type: String, doc: 'Container width in CSS units (default: "100%")' },
    height: { type: String, doc: 'Container height in CSS units (default: "700px")' },
    class: { type: String, doc: 'Space-delimited CSS class names' },
  },
  run(data) {
    const { arg, options = {} } = data;
    const bundleUrl = arg || options.bundle || DEFAULT_BUNDLE_URL;
    const config = buildConfig(options);
    const id = `ismip6-viewer-${Math.random().toString(36).slice(2, 11)}`;
    const width = options.width || '100%';
    const height = options.height || '700px';
    const classAttr = options.class ? ` class="${options.class}"` : '';
    const style = `width: ${width}; height: ${height}; border: 1px solid #ccc; border-radius: 5px;`;
    const configJson = safeJsonForScript(config);

    // Single raw HTML payload: the mount div + a module script that imports
    // the bundle and calls mount(). The script's import path is the bundle
    // URL (defaults to /ismip6-viewer.js — override via the positional arg
    // or :bundle: option when BASE_URL prefixes are needed).
    const html = [
      `<div id="${id}"${classAttr} style="${style}"></div>`,
      `<script type="module">`,
      `import { mount } from ${JSON.stringify(bundleUrl)};`,
      `mount(document.getElementById(${JSON.stringify(id)}), ${configJson});`,
      `</script>`,
    ].join('\n');

    return [{ type: 'html', value: html }];
  },
};

const plugin = {
  name: 'ISMIP6 Viewer Plugin',
  directives: [ismip6ViewerDirective],
};

export default plugin;
