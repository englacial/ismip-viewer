import { useEffect, useRef } from "react";
import { Panel } from "./components/Panel";
import { Controls } from "./components/Controls";
import { useViewerStore } from "./stores/viewerStore";
import { yearRange } from "./utils/cftime";
import { formatValue } from "./utils/format";

function FloatingTimeSlider() {
  const { timeIndex, setTimeIndex, panels } = useViewerStore();
  const range = yearRange(panels.map((p) => p.timeLabels));
  const maxSlider = range ? range.maxYear - range.minYear : 0;
  const currentYear = range ? range.minYear + timeIndex : null;

  if (maxSlider === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(255,255,255,0.95)",
        padding: "8px 16px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "300px",
      }}
    >
      <span style={{ fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
        Year: {currentYear ?? timeIndex}
      </span>
      <input
        type="range"
        min={0}
        max={maxSlider}
        value={timeIndex}
        onChange={(e) => setTimeIndex(parseInt(e.target.value, 10))}
        style={{ flex: 1 }}
      />
    </div>
  );
}

const COLORMAP_GRADIENTS: Record<string, string> = {
  viridis: "#440154, #3b528b, #21918c, #5ec962, #fde725",
  plasma: "#0d0887, #7e03a8, #cc4778, #f89540, #f0f921",
  inferno: "#000004, #57106e, #bc3754, #f98e09, #fcffa4",
  magma: "#000004, #51127c, #b73779, #fc8961, #fcfdbf",
  cividis: "#1f9e89, #35b779, #6ece58, #a5db36, #fde725",
  turbo: "#30123b, #23bdd8, #d9f537, #f4650b, #7a0403",
  coolwarm: "#3b4cc0, #819fce, #dddddd, #f4987a, #b40426",
  RdBu: "#67001f, #d6604d, #f7f7f7, #4393c3, #053061",
  gray: "#000000, #ffffff",
};

function FloatingColorbar() {
  const { colormap, vmin, vmax, variableMetadata, panels, embedConfig } = useViewerStore();

  // Only show when data is loaded and colorbar isn't explicitly hidden
  const hasData = panels.some((p) => p.currentData !== null);
  if (!hasData || embedConfig?.show_colorbar === false) return null;

  const unitsLabel = variableMetadata?.units || null;
  const gradient = COLORMAP_GRADIENTS[colormap] || COLORMAP_GRADIENTS.viridis;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "56px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        background: "rgba(255,255,255,0.95)",
        padding: "6px 12px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "200px",
        maxWidth: "400px",
      }}
    >
      <span style={{ fontSize: "11px", whiteSpace: "nowrap" }}>{formatValue(vmin)}</span>
      <div
        style={{
          flex: 1,
          height: "14px",
          background: `linear-gradient(to right, ${gradient})`,
          borderRadius: "2px",
          minWidth: "80px",
        }}
      />
      <span style={{ fontSize: "11px", whiteSpace: "nowrap" }}>{formatValue(vmax)}</span>
      {unitsLabel && (
        <span style={{ fontSize: "10px", color: "#666", whiteSpace: "nowrap" }}>{unitsLabel}</span>
      )}
    </div>
  );
}

export default function App() {
  const { initialize, isInitializing, initError, panels, activePanelId, embedConfig, timeIndex, selectedVariable, loadAllPanels } =
    useViewerStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Debounced auto-load on time slider change (100ms debounce for drag behavior)
  const timeIndexRef = useRef(timeIndex);
  const isFirstTimeRender = useRef(true);

  useEffect(() => {
    if (embedConfig?.instant_load === false) return;

    if (isFirstTimeRender.current) {
      isFirstTimeRender.current = false;
      timeIndexRef.current = timeIndex;
      return;
    }

    if (timeIndexRef.current === timeIndex) return;
    timeIndexRef.current = timeIndex;

    const hasLoadedData = panels.some((p) => p.currentData !== null || p.timeLabels !== null);
    if (!hasLoadedData) return;

    const timer = setTimeout(() => loadAllPanels(), 100);
    return () => clearTimeout(timer);
  }, [timeIndex, loadAllPanels, panels, embedConfig?.instant_load]);

  // Immediate auto-load on variable change (no debounce needed for dropdown)
  const variableRef = useRef(selectedVariable);
  const isFirstVariableRender = useRef(true);

  useEffect(() => {
    if (embedConfig?.instant_load === false) return;

    if (isFirstVariableRender.current) {
      isFirstVariableRender.current = false;
      variableRef.current = selectedVariable;
      return;
    }

    if (variableRef.current === selectedVariable) return;
    variableRef.current = selectedVariable;

    const hasLoadedData = panels.some((p) => p.currentData !== null || p.timeLabels !== null);
    if (!hasLoadedData) return;

    loadAllPanels();
  }, [selectedVariable, loadAllPanels, panels, embedConfig?.instant_load]);

  const controlsMode = embedConfig?.controls || "all";
  const showSidebar = controlsMode === "all";
  const showFloatingSlider = controlsMode === "time";
  const showFloatingColorbar = embedConfig !== null && controlsMode !== "all";

  // Whether to force square aspect ratio on panels (2-panel embed layout)
  const useSquarePanels = embedConfig !== null && panels.length === 2;

  // Calculate grid layout based on number of panels
  const getGridStyle = (count: number): React.CSSProperties => {
    if (count === 1) {
      return { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" };
    } else if (count === 2) {
      if (useSquarePanels) {
        return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto", alignContent: "center" };
      }
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" };
    } else if (count <= 4) {
      return { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };
    } else if (count <= 6) {
      return { gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr" };
    } else {
      // For more than 6, use 3 columns with as many rows as needed
      const rows = Math.ceil(count / 3);
      return {
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: Array(rows).fill("1fr").join(" "),
      };
    }
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {showSidebar && <Controls />}
      <div style={{ flex: 1, position: "relative" }}>
        {/* Initialization loading */}
        {isInitializing && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              background: "rgba(255,255,255,0.9)",
              padding: "20px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            }}
          >
            Connecting to data store...
          </div>
        )}

        {/* Initialization error */}
        {initError && (
          <div
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 1000,
              background: "#ffebee",
              color: "#c62828",
              padding: "10px 20px",
              borderRadius: "4px",
              maxWidth: "400px",
            }}
          >
            {initError}
          </div>
        )}

        {/* Panel grid */}
        <div
          style={{
            display: "grid",
            ...getGridStyle(panels.length),
            gap: "8px",
            padding: "8px",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {panels.map((panel) => (
            <Panel
              key={panel.id}
              panel={panel}
              isActive={panel.id === activePanelId}
              canRemove={panels.length > 1}
              squareAspect={useSquarePanels}
            />
          ))}
        </div>

        {/* Floating colorbar for embed mode */}
        {showFloatingColorbar && <FloatingColorbar />}

        {/* Floating time slider for embed mode */}
        {showFloatingSlider && <FloatingTimeSlider />}
      </div>
    </div>
  );
}
