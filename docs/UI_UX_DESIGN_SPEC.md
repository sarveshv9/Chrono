# UI/UX Design Specification & Guidelines: ChronoCraft (Android)

**Platform:** Android Exclusive (Android 10+ / API 29 through Android 15+, React Native / Expo New Architecture)  
**Design Philosophy:** Radical Simplicity with Infinite Customization (Material 3 + Zen Focus Studio)  
**Document Status:** Approved for Design System Implementation  

---

## 1. Core Design Philosophy: "Zen Canvas with Infinite Studio Power"

ChronoCraft avoids the two pitfalls of mobile productivity apps:
- It does **not** clutter the user with dashboards and charts during focus time.
- It does **not** restrict the user with rigid, hardcoded timer rules or fixed color schemes.

### Three Progressive Interaction Levels
- **Level 0 (Zen Canvas):** Distraction Zero. Only the active clock visualizer, session counter, and active task tag are visible. Controls fade to 15% opacity after 3 seconds of undisturbed focus.
- **Level 1 (Quick Customization Drawer):** In-context bottom sheet (`@gorhom/bottom-sheet`). Quickly adjust durations (15m, 25m, 45m, 60m), swap themes, switch clock styles, or change ambient soundscapes in under 2 seconds.
- **Level 2 (Focus Studio & Matrix):** Modular deep settings grid for custom sequence creation, hex palette builder, Android Glance widget configurations, and soundscape tuning.

---

## 2. Screen Hierarchy & Wireframe Descriptions

### 2.1 Main Focus Screen (Zen Canvas)

```
+---------------------------------------------------+
|  [Status Bar: Time, Wi-Fi, Battery]                |
|                                                   |
|  ( o )  [ #DeepWork v ]              [ [Stats] ]   |
|                                                   |
|                     24:58                         |
|            . - ~ ~ ~ ~ ~ ~ ~ - .                  |
|        . '                       ' .              |
|       /                             \             |
|      |        [ Minimal Ring ]       |            |
|       \                             /             |
|        . '                       ' .              |
|            ' - ~ ~ ~ ~ ~ ~ ~ - '                  |
|                                                   |
|                 FOCUS (1 of 4)                    |
|             "Backend Architecture"                |
|                                                   |
|       [ |> Tap anywhere to Play/Pause ]           |
|                                                   |
|  [ Sound: Brown Noise 30% ]      [ Style: Ring v ]|
|          ▲ Swipe up for Quick Adjust              |
|  -----------------------------------------------  |
+---------------------------------------------------+
```
- **Top Rail:** Pulsing status dot, active task/tag selector pill, statistics & analytics icon.
- **Center Canvas:** Large tabular numerals (64pt font), active visual timer render (Ring / Flip / Sandglass / Zen Breathing), session counter (`FOCUS 1 OF 4`).
- **Bottom Rail:** Active sound badge with inline volume level, clock style switch badge, bottom sheet drag handle.

---

### 2.2 Quick Customization Drawer (Bottom Sheet)

```
+---------------------------------------------------+
|                     [====]                        |
|  QUICK ADJUST                                [X]  |
|                                                   |
|  SESSION DURATION                                 |
|  +-------+  +-------+  +-------+  +-------+       |
|  |  15m  |  | [25m] |  |  45m  |  |  60m  |  +More |
|  +-------+  +-------+  +-------+  +-------+       |
|                                                   |
|  AMBIENT SOUNDSCAPE                               |
|  [ None ]  [ (*) Rain ]  [ Brown Noise ]  [ Cafe ]|
|  Volume: (---o------------) 30%                   |
|                                                   |
|  THEME PRESET                                     |
|  (*) Material You  ( ) OLED Black  ( ) Papyrus    |
|                                                   |
|  VISUAL CLOCK STYLE                               |
|  [*] Ring   [ ] Flip   [ ] Sandglass   [ ] Breath |
|                                                   |
|  [ Open Focus Studio for Deep Settings > ]        |
+---------------------------------------------------+
```

---

### 2.3 Visual Clock Renderers

```
+-------------------+ +-------------------+ +-------------------+ +-------------------+
|   CIRCULAR RING   | |   DIGITAL FLIP    | | MINIMAL SANDGLASS | |   ZEN BREATHING   |
|         |         | |     +---+---+     | |        \ /        | |        ,-''-.     |
|    .-'""'""'-.    | |     | 2 | 5 |     | |        |X|        | |      .'      '.   |
|   /           \   | |     +===+===+     | |        / \        | |     /    25    \  |
|  |    25:00    |  | |     | 0 | 0 |     | |       /   \       | |    |    MIN     | |
|   \           /   | |     +---+---+     | |      '-----'      | |     \          /  |
|    '-......-'     | |                   | |                   | |      '.      .'   |
|                   | |                   | |       24:45       | |        '-..-'     |
+-------------------+ +-------------------+ +-------------------+ +-------------------+
```

1. **Circular Ring:** Hardware-accelerated SVG/Skia stroke animation with rounded caps and custom stroke width.
2. **Digital Flip Clock:** Mechanical perspective flip chronometer with split upper and lower flaps.
3. **Minimalist Sandglass:** Procedural particle canvas rendering falling sand micro-dots.
4. **Zen Breathing Circle:** Algorithmic expanding and contracting gradient orb tuned to 4-4 or 4-7-8 breathing cadences for anxiety-free focus.

---

## 3. Gesture Navigation Map

| Gesture | Target Area | Action Executed | Android Haptic Response |
|---|---|---|---|
| **Single Tap** | Anywhere on Canvas | **Play / Pause Timer** | `HapticFeedbackConstants.CONFIRM` |
| **Double Tap** | Center Timer Digits | **Add +5 Minutes** | Double selection tick |
| **Swipe Left → Right** | Center Canvas | **Skip / Complete Stage** | Success haptic vibration |
| **Swipe Right → Left** | Center Canvas | **Open Analytics** | Light transition detent |
| **Pull Down (>80dp)** | Top Canvas | **Immersive OLED Mode** | Screen dims to pure black, interface hides |
| **Swipe Up (>60dp)** | Bottom Edge | **Open Quick Customizer** | Bottom sheet opens with light tick |
| **Long Press (600ms)** | Center Timer Digits | **Reset Session** | Warning buzz pattern |

---

## 4. Android Surfaces: Widgets, Notification & Quick Settings

```
+---------------------------------------------------+
|              ANDROID NOTIFICATION SHADE           |
+---------------------------------------------------+
|  [🍅] ChronoCraft · Focus: Deep Work              |
|      00:23:45 remaining                           |
|      [ ⏸ Pause ]   [ ⏭ Skip ]   [ ➕ +5m ]       |
+---------------------------------------------------+
```

### 4.1 Ongoing Chronometer Notification
- Persistent notification attached to a Foreground Service.
- System chronometer updates automatically in the notification shade with zero JavaScript battery consumption.
- Action buttons allow users to pause, skip, or extend sessions without unlocking the app.

### 4.2 Jetpack Compose Glance AppWidgets
- **Small (2x1 / 2x2):** Progress circle, remaining time, stage badge, tap to launch app.
- **Medium (4x2):** Active task title, remaining time, and instant action buttons (`Play/Pause`, `+5m`, `Skip`).
- Fully supports Android 12+ Material You dynamic color extraction (`GlanceTheme`).

### 4.3 Android Quick Settings Tile (`TileService`)
- Quick Settings tile added to the notification drawer:
  - Inactive State: "Start Focus" (Tap launches default 25m session).
  - Active State: "Focusing (18m left)" (Tap pauses or opens current session).

---

## 5. Design Tokens & Theme Palettes

### 5.1 Curated Color Presets

| Token | Material You (Dynamic) | OLED Obsidian | Warm Papyrus | Cyber Neon |
|---|---|---|---|---|
| **Canvas Background** | `colorSurface` (Monet) | `#000000` (True Black) | `#FBF8F2` (Book Cream) | `#080B10` |
| **Surface Card** | `colorSurfaceVariant` | `#121212` | `#F2ECE1` | `#111622` |
| **Text Primary** | `colorOnSurface` | `#FFFFFF` | `#2C2825` | `#00FFCC` |
| **Text Secondary** | `colorOnSurfaceVariant` | `#888888` | `#70665D` | `#8E8EAD` |
| **Accent Focus** | `colorPrimary` | `#E65100` / `#FFFFFF` | `#B85D36` | `#FF0055` |
| **Accent Break** | `colorSecondary` | `#00897B` | `#5C7C64` | `#00FFCC` |

### 5.2 Typography Tokens
- **Tabular Numerals:** `Roboto Mono` / `JetBrains Mono` (`fontVariant: ['tabular-nums']`).
- **Body & Headings:** `Roboto` / `Inter`.
- **Editorial Mode:** `Newsreader` / `Lora`.
