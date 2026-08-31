# 🗺️ Living Web — Project Roadmap

> **Mission:** Transform any website into a living, responsive game world with autonomous browser agents.
> *"The user defines the character; Living Web defines the world."*

---

## 📍 Version 1.0 (Current Release — Production Ready Prototype)

- [x] **Zero-Physics Developer Experience (`livingPet(config)` API)**
- [x] **Automatic DOM Geometry & Platform Extraction**
  - [x] Semantic classification (`header`, `main`, `section`, `article`, `card`, `button`, etc.)
  - [x] Declarative HTML hints (`data-living-platform`, `data-living-attractor`, `data-living-ignore`)
  - [x] Debounced DOM mutation (`MutationObserver`) and resize observation (`ResizeObserver`)
  - [x] Dynamic topbar exclusion and safe ceiling detection
- [x] **2D Physical Simulation & Boundary Safety**
  - [x] Gravity, horizontal velocity, and surface snapping without vibration
  - [x] Strict document ceiling (`minY = 0`) & floor bounds clamping
  - [x] One-way jump-through surface semantics to eliminate container trapped bugs
- [x] **Spatial Awareness & Personality-Driven Utility AI**
  - [x] Lookahead sensor (`findObstacleAhead`) for stairs, stepped platforms, and obstacles
  - [x] Dynamic trajectory leaps with forward momentum for seamless staircase climbing
  - [x] Direction commitment hysteresis (prevents rapid left-right twitching/dithering)
  - [x] FSM states (`IDLE`, `WALK`, `RUN`, `JUMP`, `FALL`, `CLIMB`, `BARK`, `SLEEP`, `OBSERVE`, `INTERACT`)
  - [x] Internal drives (energy depletion, sleep recovery, curiosity, boredom)
- [x] **First-Class Custom Skill & Ability Engine**
  - [x] `CharacterSkill` interface with execution context and cooldown management
  - [x] `pet.registerSkill()` & `pet.useSkill()` runtime APIs
  - [x] Interactive skill demonstrations (Ninja flip, Dance, Feed, Page analysis)
- [x] **Character-Agnostic Asset Pipeline**
  - [x] Universal `AssetManifest` support for custom sprite sheets and PNG animations
  - [x] Procedural pixel art fallback engine
- [x] **Interaction & Camera Management**
  - [x] Pointer hover, proximity, click triggers, drag-and-drop
  - [x] Coordinate mapping between world space and scroll viewport
- [x] **High-DPI Renderer & Safe UI**
  - [x] 60 FPS hardware-accelerated canvas overlay
  - [x] XSS-sanitized dynamic speech bubbles
  - [x] Visual debug overlay mode
- [x] **Quality Assurance & Open Source Standards**
  - [x] 46 unit & integration tests in Vitest across 9 test suites
  - [x] GitHub Actions CI pipeline (Node.js 18, 20, 22)
  - [x] GNU General Public License v3.0 (GPL-3.0)
  - [x] 14.4s continuous Playwright showcase recording (`docs/demo.gif`)

---

## 📍 Version 1.5 (Enhanced Interactions & Customization)

- [ ] **Sprite Sheet Atlas Packer**: In-browser automated slicing, frame extraction, and packaging for custom sprite sheets.
- [ ] **Sound & Audio Effects (Web Audio API)**: Optional procedural or sampled cute footsteps, barks, meows, jumps, and sleep snores.
- [ ] **Extended Declarative Elements**:
  - `data-living-trampoline`: Bounces characters high into the air.
  - `data-living-portal`: Teleports pet between paired DOM elements.
  - `data-living-climbable`: Ladders, ropes, or vertical sidebars.
  - `data-living-skill="skillName"`: Triggers registered pet skills on user click.
- [ ] **A* Pathfinding**: Smart global route planning across complex multi-tiered DOM platform trees.

---

## 📍 Version 2.0 (Multi-Pet Ecosystem & Cloud Intelligence)

- [ ] **Multi-Pet Social Behaviors**: Multiple pets interacting simultaneously (tag, chasing, synchronized dancing, sleeping together).
- [ ] **Optional Cloud AI Personality Engine**:
  - LLM-powered context-aware pet dialogue based on webpage text content.
  - Periodic intelligent behavior recommendations without blocking 60 FPS simulation.
- [ ] **WebGPU Rendering Pipeline**: Optional hardware-accelerated particle effects, shadows, and dynamic lighting.
- [ ] **Browser Extension Mode**: Enable Living Web on any webpage via Chrome, Firefox, and Edge extension.

---

## 📍 Version 3.0 (Ecosystem & Creator Economy)

- [ ] **Community Character Marketplace**: Share and download custom character packs, animations, and custom behavior skills.
- [ ] **Web Studio Playground**: In-browser visual pet designer, sprite animator, and behavior curve tuner.
- [ ] **Cross-Tab Persistence**: Pets remember past visits, favorite spots, friendship level, and earned badges across sessions.

---

## 💡 Proposing New Features

Have an idea for Living Web? Please open a feature request in [GitHub Discussions](https://github.com/kadiryildiz283/living-web/discussions) or create an issue using the feature request template.
