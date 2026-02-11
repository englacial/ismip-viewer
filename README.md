# ISMIP6 Viewer

Quarto shortcode extension and MyST directive for embedding the [ISMIP6 ice sheet model viewer](https://models.englacial.org/) into scientific documents.

The viewer is a client-side React application backed by an [icechunk](https://icechunk.io) store containing Zarr v3 arrays of ISMIP6 Antarctic ice sheet model output.

## Installation

### Quarto

```bash
quarto add englacial/ismip-viewer --no-prompt
```

### MyST Markdown

Copy `ismip6-viewer.mjs` into your project and register it in `myst.yml`:

```yaml
project:
  plugins:
    - ismip6-viewer.mjs
```

## Usage

### Quarto shortcode

```markdown
{{< ismip6-viewer store_url="https://data.source.coop/englacial/ismip6/icechunk-ais/" model="DOE_MALI" experiment="ctrl_proj_std" variable="lithk" >}}
```

Multi-panel comparison:

```markdown
{{< ismip6-viewer store_url="https://data.source.coop/englacial/ismip6/icechunk-ais/" panels='[{"model":"DOE_MALI","experiment":"exp05"},{"model":"JPL1_ISSM","experiment":"exp05"}]' variable="lithk" controls="time" >}}
```

With a default year and compact headers (no dropdowns):

```markdown
{{< ismip6-viewer store_url="https://data.source.coop/englacial/ismip6/icechunk-ais/" panels='[{"model":"DOE_MALI","experiment":"exp05"},{"model":"JPL1_ISSM","experiment":"exp05"}]' variable="lithk" controls="time" default_year="2025" >}}
```

### MyST directive

````markdown
```{ismip6-viewer}
:store_url: https://data.source.coop/englacial/ismip6/icechunk-ais/
:model: DOE_MALI
:experiment: ctrl_proj_std
:variable: lithk
```
````

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `store_url` | string | **yes** | icechunk store URL |
| `store_ref` | string | no | Store version: branch, tag, or snapshot ID (default: `main`) |
| `data_view` | string | no | Data view: `combined` (default), `state`, or `flux` |
| `model` | string | no | Pre-select a model |
| `experiment` | string | no | Pre-select an experiment |
| `variable` | string | no | Pre-select a variable |
| `time` | integer | no | Initial time step index (0-based) |
| `default_year` | integer | no | Default year to display on load (e.g., `2025`). Overrides `time`. |
| `panels` | JSON string | no | Multi-panel config |
| `colormap` | string | no | Colormap name (default: `viridis`) |
| `vmin` / `vmax` | number | no | Fix color scale range |
| `controls` | string | no | `all`, `time`, or `none` |
| `show_selectors` | string | no | Show model/experiment dropdowns when panels are pre-configured: `true` or `false` (default: `false` when `panels` is set) |
| `width` | string | no | iframe width (default: `100%`) |
| `height` | string | no | iframe height (default: `700px` / `700`) |

See [embedding documentation](docs/embedding.md) for full details.

## License

MIT
