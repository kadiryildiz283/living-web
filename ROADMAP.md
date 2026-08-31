# 🗺️ Living Web — Project Roadmap

> **Mission:** Transform any website into a living, responsive game world with autonomous browser agents.

---

## 📍 Version 1.0 (Current Release — Stable Prototype)

- [x] **Zero-Physics Developer Experience (`livingPet(config)` API)**
- [x] **Automatic DOM Geometry & Platform Extraction**
  - [x] Semantic classification (`header`, `main`, `section`, `article`, `card`, `button`, etc.)
  - [x] Declarative HTML hints (`data-living-platform`, `data-living-attractor`, `data-living-ignore`)
  - [x] Debounced DOM mutation and resize observation
- [x] **2D Physical Simulation**
  - [x] Gravity, horizontal velocity, and surface snapping without vibration
  - [x] Safe world bounds clamping and trapped character auto-recovery
- [x] **Personality-Driven Utility AI Engine**
  - [x] FSM states (`IDLE`, `WALK`, `RUN`, `JUMP`, `FALL`, `CLIMB`, `BARK`, `SLEEP`, `OBSERVE`, `INTERACT`)
  - [x] Repetition penalties via `RecentActionLog`
  - [x] Internal drives (energy depletion and sleep recovery, boredom)
- [x] **Interaction & Camera Management**
  - [x] Pointer proximity, click triggers, drag-and-drop
  - [x] Coordinate mapping between world space and scroll viewport
- [x] **Renderer**
  - [x] High-DPI canvas overlay with procedural pet graphics & sprite support
  - [x] XSS-sanitized dynamic speech bubbles
  - [x] Visual debug overlay mode
- [x] **Complete Test Suite (45+ unit & integration tests in Vitest)**

---

## 📍 Version 1.5 (Enhanced Interactions & Customization)

- [ ] **Sprite Sheet Atlas Packer**: Automated slicing and packaging for custom sprite sheets.
- [ ] **Sound & Audio Effects (Web Audio API)**: Optional cute footsteps, barks, purrs, and jump effects.
- [ ] **Extended Declarative Elements**:
  - `data-living-trampoline`: Bounces characters high into the air.
  - `data-living-portal`: Teleports pet from one DOM element to another.
  - `data-living-climbable`: Ladders, trees, or vertical sidebars.
- [ ] **Custom Pathfinding**: A* navigation across complex multi-tiered DOM platform trees.

---

## 📍 Version 2.0 (Multi-Pet Ecosystem & Cloud Intelligence)

- [ ] **Multi-Pet Social Behaviors**: Pets interact with each other (chasing, sleeping together, playing tag).
- [ ] **Optional Cloud AI Personality Engine**:
  - LLM-powered context-aware pet dialogue based on page content.
  - Periodic intelligent behavior recommendations without blocking real-time simulation.
- [ ] **WebGPU Rendering Pipeline**: Optional hardware-accelerated particle effects, shadows, and lighting.
- [ ] **Browser Extension Mode**: Enable Living Web on any webpage via Chrome / Firefox extension.

---

## 📍 Version 3.0 (Ecosystem & Creator Economy)

- [ ] **Community Character Marketplace**: Share and download custom character packs, animations, and behaviors.
- [ ] **Visual Studio Code / Web Studio Playground**: In-browser pet and behavior designer.
- [ ] **Cross-Tab Persistence**: Pets remember past visits, favorite spots, and earned badges across sessions.

---

## 💡 Proposing New Features

Have an idea for Living Web? Please open a feature request in [GitHub Discussions](https://github.com/kadiryildiz283/live-pet/discussions) or create an issue using the feature request template.
