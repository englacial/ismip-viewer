-- ISMIP6 Viewer Quarto Shortcode
--
-- Embeds the ISMIP6 ice sheet model viewer as an iframe.
-- Shortcodes can span multiple lines for readability.
--
-- Usage (single panel):
--   {{< ismip6-viewer
--     store_url="https://data.source.coop/englacial/ismip6/icechunk-ais/"
--     model="DOE_MALI"
--     experiment="ctrl_proj_std"
--     variable="lithk"
--     controls="time"
--   >}}
--
-- Multi-panel:
--   {{< ismip6-viewer
--     store_url="https://data.source.coop/englacial/ismip6/icechunk-ais/"
--     panels='[
--       {"model":"DOE_MALI","experiment":"exp05"},
--       {"model":"JPL1_ISSM","experiment":"exp05"}
--     ]'
--     variable="lithk"
--     controls="time"
--     height="750"
--     default_year="2025"
--     ignore_value="0"
--   >}}
--
-- Options:
--   store_url      - icechunk store URL (required)
--   store_ref      - Store version: branch, tag, or snapshot ID (default: main)
--   model          - Model name (e.g., DOE_MALI)
--   experiment     - Experiment name (e.g., ctrl_proj_std)
--   variable       - Variable to display (e.g., lithk)
--   time           - Initial time index
--   colormap       - Colormap name (viridis, plasma, etc.)
--   vmin           - Color scale minimum
--   vmax           - Color scale maximum
--   panels         - JSON array of panel configs (supports per-panel ignore_value)
--   controls       - Controls mode: all, time, none
--   default_year   - Default year to display on load (e.g., 2025)
--   ignore_value   - Value to treat as NaN (e.g., 0 for zero-filled regions)
--   layout         - Panel layout: auto (side-by-side) or vertical (stacked)
--   show_selectors - Show dropdowns when panels are pre-configured (true/false)
--   show_colorbar  - Show floating colorbar in embed mode (default: true)
--   width          - iframe width (default: 100%)
--   height         - iframe height (default: 700)
--   url            - Override viewer base URL

local DEFAULT_URL = "/static/models/"

local PARAM_KEYS = {
  "model", "experiment", "variable", "time",
  "colormap", "vmin", "vmax", "panels", "controls",
  "store_url", "store_ref", "group_path", "data_view",
  "grid_width", "grid_height", "cell_size", "x_min", "y_min",
  "default_year", "show_selectors", "show_colorbar", "ignore_value", "layout"
}

local function url_encode(str)
  str = string.gsub(str, "([^%w%-%.%_%~])", function(c)
    return string.format("%%%02X", string.byte(c))
  end)
  return str
end

return {
  ["ismip6-viewer"] = function(args, kwargs, meta)
    if not quarto.doc.is_format("html:js") then
      -- Non-HTML output: render a placeholder
      return pandoc.RawBlock("html",
        '<p><em>[Interactive ISMIP6 viewer — requires HTML output]</em></p>')
    end

    local base_url = pandoc.utils.stringify(kwargs["url"] or "")
    if base_url == "" then base_url = DEFAULT_URL end
    local width = pandoc.utils.stringify(kwargs["width"] or "")
    if width == "" then width = "100%" end
    local height = pandoc.utils.stringify(kwargs["height"] or "")
    if height == "" then height = "700" end

    -- Build query parameters
    local params = { "autoload=true" }

    for _, key in ipairs(PARAM_KEYS) do
      local val = kwargs[key]
      if val then
        val = pandoc.utils.stringify(val)
        if val ~= "" then
          table.insert(params, key .. "=" .. url_encode(val))
        end
      end
    end

    local query = table.concat(params, "&")
    local src = base_url .. "?" .. query

    local html = string.format(
      '<iframe src="%s" width="%s" height="%s" ' ..
      'style="border:1px solid #ccc;border-radius:5px" ' ..
      'frameborder="0" loading="lazy"></iframe>',
      src, width, height
    )

    return pandoc.RawBlock("html", html)
  end
}
