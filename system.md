# Living Web — System Specification

> Turn any website into a living world.

## 1. Purpose

Living Web is a browser runtime + optional cloud API that places user-defined animated characters inside ordinary HTML pages and makes those characters behave like lightweight autonomous game agents.

The developer provides character assets, a small behavior/personality configuration, and optional declarative HTML hints. The runtime automatically discovers the page geometry, converts relevant DOM elements into a world model, runs physics and behavior, and renders the character without requiring the developer to implement a game loop, collision system, gravity, animation timing, or scroll handling.

The primary product principle is:

> **The user defines the character; Living Web defines the world.**

---

## 2. Product Goals

### G1 — Zero-physics developer experience

A consumer of the SDK must not need to write:

```ts
dog.gravity = 9.8;
dog.velocityX = ...;
dog.checkCollision(...);
dog.handleScroll(...);
```

The intended API is closer to:

```ts
const dog = livingPet({
  name: "Boncuk",
  assets: "/pets/boncuk/",
  personality: {
    energy: 0.7,
    curiosity: 0.8,
    friendliness: 0.9
  }
});

dog.start();
```

### G2 — Automatic world extraction

The runtime must be able to inspect the host document and infer a usable 2D world from visible DOM geometry.

The runtime should recognize common semantic/layout elements such as `header`, `main`, `section`, `article`, `footer`, cards, buttons, images, and containers as potential surfaces, while ignoring irrelevant or dangerous elements.

Developers may override automatic classification with attributes such as:

```html
<div data-living-platform></div>
<div data-living-ignore></div>
<div data-living-attractor="play"></div>
```

### G3 — Autonomous behavior

The character must feel alive without a remote model call on every frame.

Behavior is divided into:

- deterministic real-time simulation;
- local low-frequency decision making;
- optional remote AI/behavior profile generation.

### G4 — Asset-driven characters

Animations must be supplied by the application developer or fetched from a configured asset manifest.

Example:

```text
pets/boncuk/
  idle-1.webp
  idle-2.webp
  idle-3.webp
  walk-1.webp
  walk-2.webp
  walk-3.webp
  run-1.webp
  run-2.webp
  run-3.webp
  bark-1.webp
  bark-2.webp
  fall-1.webp
  fall-2.webp
```

The asset pipeline may infer animation groups from filenames, but an explicit manifest is the authoritative format for production deployments.

### G5 — Smooth page integration

Living Web must behave as an overlay and must not take control of the host application's layout, routing, business logic, or DOM ownership.

### G6 — Performance first

The runtime must minimize layout reads, avoid unnecessary DOM mutation, cache decoded assets, pause work when the page is hidden, and degrade gracefully on constrained devices.

---

## 3. Non-Goals

Living Web is not initially intended to be:

1. a general-purpose multiplayer game engine;
2. a full rigid-body physics engine;
3. an LLM-driven agent that reasons continuously at 60 FPS;
4. a framework that requires React, Vue, Svelte, or another UI framework;
5. a system that mutates or restructures the application's DOM.

---

## 4. High-Level Architecture

```text
Host Website
    |
    v
+--------------------------+
| @living-web/sdk          |
|                          |
| Bootstrap / API          |
| Asset Manager            |
| DOM Scanner              |
| World Model              |
| Physics Engine           |
| Behavior Engine          |
| Interaction Manager      |
| Camera / Scroll Manager  |
| Renderer                 |
+------------+-------------+
             |
             | optional network
             v
+--------------------------+
| Living Web API           |
|                          |
| Character Service        |
| Behavior Profile Service |
| Asset Metadata           |
| AI/LLM Service           |
| Rate Limiter             |
| Auth / Tenant Service    |
+--------------------------+
```

The browser remains authoritative for real-time simulation. The cloud service is advisory and low-frequency.

---

## 5. Core Runtime Principles

### 5.1 Browser-authoritative simulation

Physics, collision, animation timing, DOM geometry, scroll response, and user interaction are local operations.

A temporary loss of network connectivity must not kill the pet.

### 5.2 AI is decision support, not the game loop

The remote AI layer may answer questions such as:

- Which behavior should happen next?
- What kind of behavior fits this personality?
- Which nearby interaction should be preferred?

It must not be required for:

- every animation frame;
- collision detection;
- gravity;
- sprite movement;
- interpolation;
- rendering.

### 5.3 Fixed simulation, variable rendering

The runtime should separate simulation rate from render rate.

Example target:

```text
Renderer      ~ 60 FPS
Physics       ~ 30–60 Hz
Animation     ~ 12–24 FPS per character
Behavior      ~ every 1–5 seconds or event-driven
DOM scan      event-driven + debounced
Remote AI     seconds/minutes or meaningful state transitions
```

### 5.4 Graceful degradation

When performance is constrained:

```text
Full simulation
   -> reduced AI frequency
   -> reduced physics frequency
   -> reduced animation FPS
   -> static/idle mode
```

When `prefers-reduced-motion` is enabled, automatic movement should be disabled or heavily reduced.

---

## 6. Subsystems

### 6.1 SDK Bootstrap

Responsibilities:

- validate user configuration;
- initialize the runtime;
- create or attach a rendering surface;
- register listeners;
- start and stop the runtime safely;
- expose the public developer API.

Public API examples:

```ts
livingPet(config)
pet.start()
pet.stop()
pet.destroy()
pet.do("bark")
pet.say("hello")
pet.pause()
pet.resume()
```

---

### 6.2 Asset Manager

Responsibilities:

- load animation metadata;
- discover filename-based animation groups;
- preload required assets;
- cache images;
- report missing assets;
- optionally convert individual images into an internal sprite atlas.

Recommended production manifest:

```ts
{
  idle: { frames: ["idle-1.webp", "idle-2.webp"], fps: 8, loop: true },
  walk: { frames: ["walk-1.webp", "walk-2.webp", "walk-3.webp"], fps: 12, loop: true },
  run:  { frames: ["run-1.webp", "run-2.webp", "run-3.webp"], fps: 16, loop: true },
  bark: { frames: ["bark-1.webp", "bark-2.webp"], fps: 10, loop: false },
  fall: { frames: ["fall-1.webp", "fall-2.webp"], fps: 10, loop: false }
}
```

---

### 6.3 DOM Scanner

Responsibilities:

- discover visible DOM elements;
- obtain bounding rectangles;
- classify potential world surfaces;
- observe DOM changes with a debounced `MutationObserver` strategy;
- avoid scanning the entire DOM every frame.

The scanner should produce an intermediate geometry representation rather than exposing raw DOM nodes to the physics system.

```ts
interface WorldSurface {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "platform" | "wall" | "attractor" | "hazard" | "ignore";
  sourceElement?: Element;
}
```

---

### 6.4 World Model

The world model is an engine-owned representation of the page.

It contains:

- world bounds;
- surfaces/platforms;
- walls/edges;
- interaction zones;
- scroll offset;
- viewport information;
- optional semantic metadata.

The world model must be independent from DOM implementation details.

---

### 6.5 Physics Engine

The initial physics model should remain intentionally small:

- gravity;
- horizontal velocity;
- vertical velocity;
- surface collision;
- wall collision;
- grounded state;
- falling state;
- optional jump/impulse;
- world bounds.

It is not necessary to implement a general rigid-body engine in V1.

Core state example:

```ts
interface BodyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
}
```

---

### 6.6 Animation System

Responsibilities:

- select the active animation;
- advance frames by elapsed time;
- support loop/non-loop animations;
- mirror direction when appropriate;
- avoid re-decoding already loaded assets.

Animation is independent from behavior. A `walk` decision produces an animation request, while the animation system decides how that animation is displayed.

---

### 6.7 Behavior Engine

The behavior engine should initially use a finite state machine plus weighted/utility decisions.

Example states:

```text
IDLE
WALK
RUN
JUMP
FALL
CLIMB
BARK
SLEEP
OBSERVE
INTERACT
```

The decision engine scores candidate behaviors based on:

- personality;
- energy;
- elapsed time;
- current movement state;
- nearby surfaces;
- recent actions;
- user interaction;
- page context;
- cooldowns.

Example:

```ts
score(explore) =
  personality.curiosity * 0.4 +
  energy * 0.2 +
  novelty * 0.3 -
  recentExplorePenalty * 0.1;
```

The exact formula is an implementation detail and may evolve into a utility-AI or behavior-tree model.

---

### 6.8 Personality Model

Personality should be numeric and bounded so it can be applied deterministically.

Suggested dimensions:

```ts
interface Personality {
  energy: number;
  curiosity: number;
  friendliness: number;
  playfulness?: number;
  bravery?: number;
  laziness?: number;
}
```

Values should normally be normalized to `[0, 1]`.

---

### 6.9 Interaction Manager

The interaction layer converts browser events into semantic signals.

Examples:

```text
pointer over pet
pet clicked
pet dragged
pointer near pet
button clicked
scroll started
scroll stopped
viewport resized
tab hidden
tab visible
```

The behavior engine consumes those signals rather than direct browser events.

---

### 6.10 Camera / Scroll Manager

The page is treated as a world larger than the current viewport.

Conceptually:

```text
screenX = worldX - cameraX
screenY = worldY - cameraY
```

The scroll manager translates browser scroll state into camera state and tells physics/renderer how the visible portion of the world changed.

The pet must not reset its world state simply because the user scrolls.

---

### 6.11 Renderer

V1 recommendation: a single dedicated canvas overlay or an isolated rendering layer.

Requirements:

- `requestAnimationFrame` loop;
- device pixel ratio awareness;
- batched drawing where practical;
- no unnecessary DOM layout work;
- pointer-event passthrough except when interaction is explicitly enabled.

The renderer should be replaceable without rewriting physics or behavior.

---

## 7. Runtime Loop

Conceptual loop:

```text
requestAnimationFrame
        |
        v
Read clock / delta
        |
        +--> process browser events
        |
        +--> update camera / scroll
        |
        +--> advance physics
        |
        +--> resolve collisions
        |
        +--> run due behavior decisions
        |
        +--> select / advance animation
        |
        +--> render
        |
        +--> schedule next frame
```

Behavior decisions must never block the render loop.

Remote API calls are asynchronous and must never run inline inside the frame-critical path.

---

## 8. Cloud API

The API exists for capabilities that benefit from centralized computation or persistence.

### 8.1 Candidate endpoints

```text
POST /v1/characters
GET  /v1/characters/:id
POST /v1/characters/:id/profile
POST /v1/behaviors/decide
POST /v1/assets/inspect
GET  /v1/assets/:id/manifest
```

The exact endpoint layout is not frozen by this document.

### 8.2 Remote decision contract

The browser should send a compact snapshot, not the DOM itself.

Example:

```json
{
  "character": {
    "species": "dog",
    "personality": {
      "energy": 0.7,
      "curiosity": 0.8,
      "friendliness": 0.9
    }
  },
  "state": {
    "currentAction": "idle",
    "energy": 0.61,
    "grounded": true,
    "nearbySurfaceCount": 3,
    "recentActions": ["walk", "idle"]
  },
  "allowedActions": ["idle", "walk", "run", "bark", "jump"]
}
```

The API returns a constrained action, for example:

```json
{
  "action": "walk",
  "durationMs": 2400,
  "target": "nearest-interesting-surface"
}
```

The browser remains responsible for executing and validating the result.

---

## 9. Security Model

Because the SDK is embedded into arbitrary websites, security must be conservative.

Requirements:

- never evaluate arbitrary JavaScript from an asset manifest;
- never execute HTML returned by the AI model;
- sanitize any text rendered into speech bubbles;
- restrict asset origins according to CSP/CORS expectations;
- validate all API payloads server-side;
- rate-limit remote AI decisions;
- tenant-isolate API keys and character configurations;
- do not send page text or private DOM content to the cloud unless the developer explicitly opts into a feature that requires it.

The default runtime should transmit only minimal telemetry or no telemetry.

---

## 10. Performance Strategy

Primary rules:

1. Never call `getBoundingClientRect()` for every character on every frame.
2. Cache world geometry and refresh it only on scroll, resize, relevant DOM mutations, or a controlled reconciliation interval.
3. Keep rendering separate from DOM scanning.
4. Pause or reduce simulation when `document.hidden === true`.
5. Cache image assets and avoid repeated decoding.
6. Use a single renderer per page for multiple characters where feasible.
7. Cap the number of active pets according to device capability.
8. Make remote AI decisions low-frequency and cancelable/stale-safe.

Target initial budget for one normal character:

```text
Renderer        < 1–3 ms/frame target
Physics         < 0.5 ms/update target
Behavior        negligible between decisions
DOM scanning   event-driven / amortized
Network        outside frame-critical path
```

These are engineering targets, not guaranteed benchmarks.

---

## 11. State Ownership

### Browser owns

- current position;
- velocity;
- collision state;
- animation frame;
- current behavior state;
- current world geometry;
- camera/scroll position;
- ephemeral user interaction.

### Cloud may own

- character templates;
- generated personality profiles;
- behavior policy versions;
- asset metadata;
- optional persistent configuration;
- optional AI-generated recommendations.

This prevents the cloud from becoming a mandatory real-time dependency.

---

## 12. Failure Handling

### Asset failure

Fallback:

```text
missing requested animation
        |
        v
nearest compatible animation
        |
        v
idle fallback
```

### API unavailable

Continue with the local behavior engine.

### DOM changes rapidly

Debounce world reconciliation and use the last valid world snapshot between scans.

### Pet gets trapped

Recovery behavior should detect impossible/no-progress conditions and relocate the character to a safe world position.

### Host page throws errors

Living Web errors must be isolated so they do not interrupt application code.

---

## 13. Versioned Developer API

The public configuration should be versioned independently from internal engine classes.

Example:

```ts
livingPet({
  apiKey: "...",
  name: "Boncuk",
  assets: "/pets/boncuk/",
  personality: {
    energy: 0.7,
    curiosity: 0.8,
    friendliness: 0.9
  },
  world: {
    autoDetect: true
  },
  behavior: {
    remoteAI: "optional"
  }
});
```

The developer should never need to know the internal class graph.

---

## 14. Recommended V1 Boundary

Build V1 with:

```text
TypeScript
Canvas
requestAnimationFrame
DOM geometry APIs
MutationObserver
ResizeObserver
Pointer Events
Finite State Machine
Weighted local decisions
WebP/PNG image assets
```

Avoid making V1 dependent on:

```text
LLM inference
WebGPU
multiplayer
full rigid-body physics
large framework dependencies
server-side frame simulation
```

The architecture must allow those capabilities later without changing the public API.

---

## 15. Future Extensions

Possible V2/V3 capabilities:

- multiple cooperating pets;
- behavior trees;
- richer utility AI;
- remote AI personalities;
- voice/sound behaviors;
- speech bubbles;
- semantic page understanding;
- site-wide persistent characters;
- browser extension mode;
- developer dashboard;
- hosted asset CDN;
- analytics with privacy-preserving opt-in telemetry;
- WebGPU renderer;
- plugin system for custom behaviors;
- character marketplace.

---

## 16. Architectural Decision Summary

The central architectural decision is:

> **Keep the real-time simulation local; keep centralized AI optional and low-frequency.**

This provides:

- low latency;
- predictable performance;
- offline resilience;
- lower API costs;
- better privacy;
- easier debugging;
- simpler scaling.

The cloud API is an intelligence/configuration service, not a remote game server.

---

## 17. Definition of Done for the First Real Prototype

A prototype is successful when the following scenario works on an ordinary web page without page-specific physics code:

1. Developer provides a character and five animation groups.
2. SDK loads and caches the assets.
3. SDK scans the page and builds world surfaces automatically.
4. Character spawns at a safe location.
5. Character idles, walks, changes direction, and falls under gravity.
6. Character lands on detected DOM surfaces.
7. Character reacts correctly to browser scroll.
8. Character can bark/perform an action from a developer command.
9. Local behavior continues when the API is unavailable.
10. The host site's own layout and application logic continue unaffected.
11. One character consumes minimal CPU and does not perform full-page layout scans every frame.

That prototype establishes the core technology. Everything else should be layered on top.
