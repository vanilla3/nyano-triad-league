# OBS Scene Templates — Nyano Triad League Overlay

OBS Browser Source configuration guide for the Nyano Triad League stream overlay.

## Quick Start

1. Open OBS Studio
2. Add a **Browser Source** to your scene
3. Set the URL to your Overlay page (e.g., `http://localhost:5173/overlay`)
4. Configure the recommended size for your output resolution (see below)
5. Check **"Shutdown source when not visible"** to save resources

## URL Parameters

| Parameter | Values | Default | Description |
|-----------|--------|---------|-------------|
| `theme` | `720p-minimal`, `720p-standard`, `1080p-standard`, `1080p-full` | `1080p-standard` | Layout preset |
| `controls` | `0` / `1` | `1` | Hide/show theme switcher and controls |
| `bg` | `transparent`, `0`, `false` | (opaque) | Enable transparent background for chroma-key |
| `vote` | `0` / `1` | `1` | Hide/show chat voting panel |

### Example URLs

```
# OBS production (no controls, transparent BG, 1080p full):
http://localhost:5173/overlay?controls=0&bg=transparent&theme=1080p-full

# OBS 720p minimal (no controls, transparent BG):
http://localhost:5173/overlay?controls=0&bg=transparent&theme=720p-minimal

# Preview with controls (for setup/testing):
http://localhost:5173/overlay?theme=1080p-standard

# No vote panel:
http://localhost:5173/overlay?controls=0&bg=transparent&vote=0
```

## Layout Presets

### 720p-minimal

- **Target**: 1280x720 output, minimal HUD
- **Browser Source size**: 1280 x 720
- **Density**: `minimal` (hides flip trace details, advantage reasons)
- **Card size**: ~70px
- **Best for**: Low-bandwidth streams, mobile viewers

### 720p-standard

- **Target**: 1280x720 output, balanced info
- **Browser Source size**: 1280 x 720
- **Density**: `standard` (shows most panels)
- **Card size**: ~80px
- **Best for**: Standard 720p streams

### 1080p-standard (Default)

- **Target**: 1920x1080 output, balanced info
- **Browser Source size**: 1920 x 1080
- **Density**: `standard`
- **Card size**: ~96px
- **Best for**: Most 1080p streams

### 1080p-full

- **Target**: 1920x1080 output, maximum detail
- **Browser Source size**: 1920 x 1080
- **Density**: `full` (all panels, all details, large fonts)
- **Card size**: ~112px
- **Best for**: Tournament broadcasts, detailed analysis streams

## Transparent Background Mode

For compositing the overlay on top of game footage or camera:

1. Set URL parameter `bg=transparent`
2. In OBS Browser Source properties, check **"Custom CSS"** and add:
   ```css
   body { background: transparent !important; }
   ```
3. The overlay panels use semi-transparent white backgrounds for readability

### Panel Hierarchy (Visual Priority)

| Panel Class | Border | Opacity | Purpose |
|-------------|--------|---------|---------|
| `ol-panel-primary` | 4px rose-400 | 95% | Last move (most important) |
| `ol-panel-dramatic` | 4px nyano-400 + glow | 98% | Big moments (3+ flips, combos, traps) |
| `ol-panel-secondary` | 3px slate-300 | 90% | Advantage, AI, Voting |
| `ol-panel-tertiary` | 2px transparent | 75% | Minor info |

## Recommended OBS Scene Layout

```
+--------------------------------------------------+
|  [Title Bar]  Nyano Triad League  LIVE            |
|                                                   |
|  +------------------+  +---------------------+   |
|  |                  |  | Last move panel      |   |
|  |    3x3 Board     |  | (ol-panel-primary    |   |
|  |    (Cards)       |  |  or ol-panel-dramatic)|  |
|  |                  |  +---------------------+   |
|  +------------------+  | Now Playing         |   |
|                        +---------------------+   |
|  [Score Bar: A ████ B] | Advantage Bar       |   |
|                        | [reason tags]        |   |
|                        +---------------------+   |
|                        | AI / Vote panels    |   |
|                        +---------------------+   |
+--------------------------------------------------+
```

## Tips

- **Always use `controls=0`** for production OBS scenes to hide the theme switcher
- **Use `bg=transparent`** when compositing over other sources
- The overlay auto-refreshes data via BroadcastChannel (no polling needed)
- Theme is saved to localStorage, so it persists across reloads
- For multi-monitor setups, open the overlay in a separate browser window first to verify layout before capturing in OBS
