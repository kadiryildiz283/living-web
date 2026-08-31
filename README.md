<div align="center">

# 🐾 Living Web (`@living-web/sdk`)

**Turn any website into a living, interactive world with autonomous browser agents.**

[![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen.svg)](https://github.com/kadiryildiz283/living-web/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Tests-46%20Passed-22c55e.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Zero-Dependency Runtime](https://img.shields.io/badge/Runtime%20Dependencies-0-success.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

<br/>

<img src="docs/demo.gif" alt="Living Web Demo" width="760px" style="border-radius: 12px; box-shadow: 0 20px 30px rgba(0,0,0,0.4);" />

<br/>
<br/>

> **"The user defines the character; Living Web defines the world."**

</div>

---

## 🌟 What is Living Web?

**Living Web** is an open-source browser runtime that places user-defined animated characters (dogs, cats, dragons, anime avatars, custom sprites) inside ordinary HTML pages and makes them behave like autonomous, physics-aware game agents.

You don't need to implement game loops, gravity, collision detection, sprite timing, or scroll mapping. The runtime automatically scans your DOM geometry, converts headers, cards, and buttons into physical platforms, and runs continuous simulation and utility-driven behavior.

---

## ✨ Key Features

- ⚡ **Zero-Physics Developer Experience**: No manual gravity equations, coordinate tracking, or collision loops.
- 🎨 **Bring Any Character (Custom Sprites & Manifests)**: Easily plug in custom sprite sheets, PNG sequences, or pixel art.
- 🧙‍♂️ **Custom Skill & Ability Engine**: Register infinite custom skills (spells, dances, acrobatic flips, feeding, page inspection).
- 🔍 **Automatic World Discovery**: Automatically turns semantic HTML (`header`, `main`, `section`, `button`, `.card`, etc.) into physical platforms with debounced `MutationObserver` & `ResizeObserver` tracking.
- 🧠 **Spatial Awareness & Utility AI**: Obstacle detection, smart stair climbing, energy depletion, boredom, curiosity, and sleep cycles.
- 🎯 **Declarative HTML Hints**: Guide character interactions via HTML markup (`data-living-platform`, `data-living-attractor`, `data-living-ignore`).
- 🖱️ **Interactive Signals**: Pointer hover, drag-and-drop, clicks, and page scroll synchronization.
- 🔒 **Zero-Dependency & Offline First**: 100% browser-authoritative real-time simulation; cloud AI is optional.

---

## 🚀 Installation & Quick Start

### 1. Installation

#### A. Install directly from GitHub (Recommended):
```bash
npm install github:kadiryildiz283/living-web
```

#### B. Or load via jsDelivr CDN directly into HTML:
```html
<script src="https://cdn.jsdelivr.net/gh/kadiryildiz283/living-web@main/dist/living-web.global.js"></script>
```

#### C. Or clone and build locally:
```bash
git clone https://github.com/kadiryildiz283/living-web.git
cd living-web
npm install
npm run build
```

> **Note:** Official NPM registry publication (`npm install living-web`) is scheduled for the upcoming public registry release.

---

### 2. Basic Usage

```typescript
import { livingPet } from "@living-web/sdk";

// Initialize your pet
const dog = await livingPet({
  name: "Boncuk",
  species: "dog",
  assets: "/pets/boncuk/",
  personality: {
    energy: 0.8,
    curiosity: 0.9,
    friendliness: 1.0,
    playfulness: 0.7
  }
});

// Start roaming the DOM
dog.start();

// Make pet speak or perform actions
dog.say("Hello Living World!");
dog.bark();
dog.jump();
```

---

## 🎨 Adding Your Own Custom Characters

Living Web is completely character-agnostic. You can bring **any character or creature** (cats, dragons, robots, monsters, anime heroes) simply by providing a sprite folder or an `AssetManifest`:

### Option A: Folder with Standard Frame Names

If you host a directory with standard PNG frames:
```text
/assets/dragon/
  ├── idle_0.png, idle_1.png
  ├── walk_0.png, walk_1.png, walk_2.png
  ├── jump_0.png, jump_1.png
  ├── sleep_0.png
  └── manifest.json (optional)
```

```typescript
const dragon = await livingPet({
  name: "Ignis",
  species: "dragon",
  assets: "/assets/dragon/",
  physics: {
    gravity: 500,       // Floats gracefully
    walkSpeed: 110,
    jumpImpulse: 400
  }
});
dragon.start();
```

### Option B: Explicit Asset Manifest (Sprite Sheets & Web Images)

```typescript
import { livingPet } from "@living-web/sdk";

const cat = await livingPet({
  name: "Pamuk",
  species: "cat",
  assets: {
    animations: {
      IDLE: {
        name: "IDLE",
        frames: ["/sprites/cat/idle-1.png", "/sprites/cat/idle-2.png"],
        fps: 4,
        loop: true,
        frameDurationMs: 250
      },
      WALK: {
        name: "WALK",
        frames: ["/sprites/cat/walk-1.png", "/sprites/cat/walk-2.png", "/sprites/cat/walk-3.png"],
        fps: 8,
        loop: true,
        frameDurationMs: 125
      },
      JUMP: {
        name: "JUMP",
        frames: ["/sprites/cat/jump.png"],
        fps: 6,
        loop: false,
        frameDurationMs: 160
      },
      SLEEP: {
        name: "SLEEP",
        frames: ["/sprites/cat/sleep.png"],
        fps: 2,
        loop: true,
        frameDurationMs: 500
      }
    }
  }
});
```

---

## 🧙‍♂️ Defining Custom Skills & Abilities

You can empower your characters with **unlimited custom skills**, cooldowns, acrobatic moves, interactive spells, and DOM manipulations:

```typescript
import { livingPet } from "@living-web/sdk";

const ninjaPet = await livingPet({
  name: "Kuro",
  species: "ninja-dog",
  assets: "/pets/kuro/",
  skills: [
    // 1. Acrobatic Backflip Skill
    {
      name: "backflip",
      description: "Performs an agile high backflip leap",
      cooldownMs: 2000,
      execute: (ctx) => {
        ctx.say("Ninja Taklası! 🦹✨", 2500);
        ctx.character.vy = -450;
        ctx.character.vx = ctx.character.direction === 1 ? 180 : -180;
        ctx.character.grounded = false;
      }
    },

    // 2. Dance Routine Skill
    {
      name: "dance",
      description: "Cute wiggle dance with music",
      cooldownMs: 4000,
      execute: async (ctx) => {
        ctx.say("La la la! 💃🎵 Dans zamanı!", 3000);
        for (let i = 0; i < 4; i++) {
          ctx.character.direction = ctx.character.direction === 1 ? -1 : 1;
          ctx.jump();
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    },

    // 3. Feed & Energy Recovery Skill
    {
      name: "feed",
      description: "Feed pet a delicious snack",
      cooldownMs: 2000,
      execute: (ctx) => {
        ctx.character.behavior.energy = 1.0;
        ctx.say("Ham ham! Lezzetli mama! 🍖😋 Enerjim %100!", 3500);
        ctx.bark();
      }
    },

    // 4. Intelligent DOM Inspector Skill
    {
      name: "inspectPage",
      description: "Counts and analyzes visible physical platforms",
      cooldownMs: 3000,
      execute: (ctx) => {
        const platformCount = ctx.world.surfaces.length;
        ctx.say(`Bu sayfada tam ${platformCount} adet fizik platformu keşfettim! 🔍🐾`, 4000);
      }
    }
  ]
});

// Trigger skills dynamically anytime
ninjaPet.useSkill("backflip");
ninjaPet.useSkill("dance");
ninjaPet.useSkill("feed");
ninjaPet.useSkill("inspectPage");

// Register new skills on the fly
ninjaPet.registerSkill({
  name: "lightningDash",
  cooldownMs: 5000,
  execute: (ctx) => {
    ctx.say("Şimşek Hızı! ⚡⚡", 2000);
    ctx.character.vx = 350;
  }
});
```

---

## 🏷️ Declarative HTML Hints

You can guide the character's world interactions directly in your HTML markup:

```html
<!-- Explicitly mark an element as a solid platform -->
<div class="custom-shelf" data-living-platform>
  Solid Platform
</div>

<!-- Attractor Zone: Pet will naturally be drawn here to play -->
<div class="toy-area" data-living-attractor="squeaky-ball">
  🎾 Toy Box
</div>

<!-- Ignore overlays, ad banners, or modals -->
<div class="cookie-banner" data-living-ignore>
  Do not land here
</div>
```

---

## 🏗️ Architecture

```text
Host Webpage (DOM)
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                      Living Web SDK                     │
│                                                         │
│  ┌───────────────┐     ┌──────────────┐     ┌────────┐  │
│  │  DOM Scanner  │ ──► │  World Model │ ──► │ Physics│  │
│  └───────────────┘     └──────────────┘     └────┬───┘  │
│                                                  │      │
│  ┌───────────────┐     ┌──────────────┐          │      │
│  │  Behavior &   │ ──► │  Animation   │ ◄────────┘      │
│  │ Skill Engine  │     │  Controller  │                 │
│  └───────────────┘     └──────┬───────┘                 │
│                               │                         │
│  ┌───────────────┐     ┌──────▼───────┐                 │
│  │ Camera/Scroll │ ──► │CanvasRenderer│                 │
│  └───────────────┘     └──────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## 📖 API Reference

### `livingPet(config: PetConfig): Promise<PetController>`

#### `PetConfig` Options:
| Option | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Name of the character (e.g. `"Boncuk"`). |
| `species` | `string` | Species identifier (`"dog"`, `"cat"`, `"dragon"`, `"robot"`). |
| `assets` | `string \| AssetManifest` | Path or manifest for character animations & frames. |
| `personality` | `PersonalityConfig` | Numerical drives (`energy`, `curiosity`, `friendliness`, `playfulness`). |
| `skills` | `CharacterSkill[]` | Array of custom abilities and executable routines. |
| `world` | `WorldConfig` | Custom platform and ignored CSS selectors. |
| `behavior` | `BehaviorConfig` | Decision intervals, action cooldowns, remote AI settings. |
| `physics` | `PhysicsConfig` | Gravity, walk speed, jump impulse configurations. |

#### `PetController` Methods:
- `pet.start()`: Initializes and starts the runtime simulation.
- `pet.stop()` / `pet.pause()` / `pet.resume()`: Controls simulation lifecycle.
- `pet.registerSkill(skill)`: Dynamically registers a custom skill.
- `pet.useSkill(name, ...args)`: Executes a custom skill with cooldown check.
- `pet.getSkills()`: Returns list of all registered skills.
- `pet.say(text, durationMs)`: Displays an XSS-sanitized speech bubble above the pet.
- `pet.bark()` / `pet.jump()` / `pet.walk()` / `pet.sleep()`: Triggers specific actions.
- `pet.teleport(x, y)`: Instantly repositions the pet in world space.
- `pet.getState()`: Returns an immutable snapshot of `CharacterState`.

---

## 🧪 Testing

Living Web comes with a comprehensive test suite covering physics, collisions, custom skills, state transitions, utility AI, camera transforms, and DOM scanning:

```bash
# Run unit & integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

---

## 🎮 Running the Local Playground

Experience Living Web on an interactive sample website with the Staircase Obstacle Course and Custom Skills:

```bash
# 1. Build distribution bundles
npm run build

# 2. Start local web server
python3 -m http.server 3000

# 3. Open browser at:
# http://localhost:3000/
```

---

## 🗺️ Roadmap

Check out our full development plan in [ROADMAP.md](ROADMAP.md) including:
- **v1.5**: Web Audio sound effects, sprite sheet atlas packer, custom pathfinding.
- **v2.0**: Multi-pet social ecosystems, LLM dialogue generation, WebGPU renderer.
- **v3.0**: Community character marketplace and cross-session persistence.

---

## 🤝 Contributing

We welcome contributions of all kinds! Please review our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

---

## ⚖️ License

Distributed under the **GNU General Public License v3.0 (GPL-3.0)**. See [`LICENSE`](LICENSE) for more information.

<div align="center">
Made with ❤️ by the Living Web Team & Community.
</div>
