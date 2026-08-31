# Living Web — Professional Mermaid Class Diagram

```mermaid
classDiagram
    direction TB

    %% =========================================================
    %% PUBLIC SDK
    %% =========================================================
    class LivingWebSDK {
        +livingPet(config: PetConfig) PetController
        +createRuntime(config: RuntimeConfig) LivingRuntime
        +version: string
    }

    class PetConfig {
        +string name
        +string species
        +AssetSource assets
        +PersonalityConfig personality
        +WorldConfig world
        +BehaviorConfig behavior
        +InteractionConfig interactions
    }

    class PetController {
        +start() void
        +stop() void
        +pause() void
        +resume() void
        +destroy() void
        +do(action: string) void
        +say(text: string) void
        +on(event: string, handler: Function) void
    }

    class LivingRuntime {
        -RuntimeState state
        +start() void
        +stop() void
        +tick(timestamp: number) void
        +dispatch(event: RuntimeEvent) void
    }

    LivingWebSDK --> PetConfig : accepts
    LivingWebSDK --> LivingRuntime : creates
    LivingRuntime --> PetController : exposes
    PetController --> LivingRuntime : controls

    %% =========================================================
    %% CORE STATE
    %% =========================================================
    class RuntimeState {
        +boolean running
        +boolean paused
        +number deltaTime
        +number time
        +ViewportState viewport
        +CameraState camera
    }

    class CharacterState {
        +string id
        +string name
        +string species
        +number x
        +number y
        +number vx
        +number vy
        +number width
        +number height
        +boolean grounded
        +Direction direction
        +ActionState action
    }

    class Personality {
        +number energy
        +number curiosity
        +number friendliness
        +number playfulness
        +number bravery
        +number laziness
    }

    class Character {
        +CharacterState state
        +Personality personality
        +AnimationController animation
        +BehaviorController behavior
    }

    LivingRuntime --> RuntimeState
    LivingRuntime --> Character
    Character --> CharacterState
    Character --> Personality

    %% =========================================================
    %% ASSET / ANIMATION
    %% =========================================================
    class AssetSource {
        <<interface>>
        +resolve() Promise~AssetManifest~
    }

    class AssetManifest {
        +Map~string,AnimationDefinition~ animations
        +string spriteAtlasUrl
    }

    class AnimationDefinition {
        +string name
        +string[] frames
        +number fps
        +boolean loop
        +number frameDurationMs
    }

    class AssetManager {
        +load(source: AssetSource) Promise~AssetManifest~
        +preload(animation: string) Promise~void~
        +get(animation: string) AnimationDefinition
        +clear() void
    }

    class FrameCache {
        +Map~string,ImageBitmap~ frames
        +get(url: string) ImageBitmap
        +set(url: string, image: ImageBitmap) void
        +has(url: string) boolean
    }

    class AnimationController {
        +string current
        +number frameIndex
        +number elapsed
        +play(name: string) void
        +stop() void
        +update(deltaMs: number) void
        +setDirection(direction: Direction) void
    }

    LivingRuntime --> AssetManager
    AssetManager --> AssetSource
    AssetManager --> AssetManifest
    AssetManifest --> AnimationDefinition
    AssetManager --> FrameCache
    Character --> AnimationController
    AnimationController --> AnimationDefinition

    %% =========================================================
    %% WORLD DISCOVERY
    %% =========================================================
    class DOMScanner {
        +scan(root: Element) WorldSnapshot
        +reconcile() void
        +startObserving() void
        +stopObserving() void
    }

    class ElementClassifier {
        +classify(element: Element) SurfaceType
        +score(element: Element) number
        +isIgnored(element: Element) boolean
    }

    class GeometryResolver {
        +measure(element: Element) Rect
        +resolveViewport() ViewportState
    }

    class WorldBuilder {
        +build(snapshot: WorldSnapshot) WorldModel
        +merge(previous: WorldModel, snapshot: WorldSnapshot) WorldModel
    }

    class WorldSnapshot {
        +WorldSurface[] surfaces
        +ViewportState viewport
        +number timestamp
    }

    class WorldModel {
        +WorldBounds bounds
        +WorldSurface[] surfaces
        +InteractionZone[] zones
        +getNearbySurfaces(rect: Rect) WorldSurface[]
        +getGroundBelow(x: number, y: number) WorldSurface
        +findSafeSpawn() Vector2
    }

    class WorldSurface {
        +string id
        +number x
        +number y
        +number width
        +number height
        +SurfaceType type
        +number priority
        +Element source
    }

    class InteractionZone {
        +string id
        +Rect bounds
        +string type
        +number attraction
        +Map metadata
    }

    class WorldBounds {
        +number minX
        +number minY
        +number maxX
        +number maxY
    }

    class Rect {
        +number x
        +number y
        +number width
        +number height
    }

    class Vector2 {
        +number x
        +number y
    }

    class ViewportState {
        +number width
        +number height
        +number devicePixelRatio
        +boolean visible
    }

    LivingRuntime --> DOMScanner
    DOMScanner --> ElementClassifier
    DOMScanner --> GeometryResolver
    DOMScanner --> WorldSnapshot
    WorldSnapshot --> WorldSurface
    DOMScanner --> WorldBuilder
    WorldBuilder --> WorldModel
    WorldModel --> WorldSurface
    WorldModel --> InteractionZone
    WorldModel --> WorldBounds
    WorldSurface --> Rect
    InteractionZone --> Rect
    WorldModel --> Vector2

    %% =========================================================
    %% PHYSICS
    %% =========================================================
    class PhysicsEngine {
        +PhysicsConfig config
        +update(character: CharacterState, world: WorldModel, dt: number) void
        +applyGravity(character: CharacterState, dt: number) void
        +resolveCollisions(character: CharacterState, world: WorldModel) CollisionResult
    }

    class PhysicsConfig {
        +number gravity
        +number maxFallSpeed
        +number walkSpeed
        +number runSpeed
        +number jumpImpulse
        +number collisionPadding
    }

    class CollisionDetector {
        +detect(body: CharacterState, world: WorldModel) Collision[]
    }

    class CollisionResolver {
        +resolve(body: CharacterState, collisions: Collision[]) CollisionResult
    }

    class Collision {
        +CollisionType type
        +WorldSurface surface
        +Vector2 normal
        +number penetration
    }

    class CollisionResult {
        +boolean grounded
        +boolean landed
        +boolean hitWall
        +boolean falling
        +Vector2 correction
    }

    PhysicsEngine --> PhysicsConfig
    PhysicsEngine --> CollisionDetector
    PhysicsEngine --> CollisionResolver
    CollisionDetector --> Collision
    CollisionResolver --> CollisionResult
    Collision --> WorldSurface
    Collision --> Vector2
    CollisionResult --> Vector2
    LivingRuntime --> PhysicsEngine

    %% =========================================================
    %% BEHAVIOR / AI
    %% =========================================================
    class BehaviorController {
        +BehaviorState currentState
        +transition(state: BehaviorState) void
        +requestAction(action: BehaviorAction) void
        +update(context: BehaviorContext) void
    }

    class StateMachine {
        +Map~string,BehaviorState~ states
        +transition(from: string, to: string) boolean
        +current() BehaviorState
    }

    class BehaviorState {
        +string name
        +BehaviorAction[] allowedActions
        +number minDurationMs
        +number maxDurationMs
        +enter(context: BehaviorContext) void
        +update(context: BehaviorContext) void
        +exit(context: BehaviorContext) void
    }

    class BehaviorAction {
        +string name
        +number score
        +number durationMs
        +string target
    }

    class UtilityDecisionEngine {
        +score(context: BehaviorContext, action: BehaviorAction) number
        +choose(context: BehaviorContext) BehaviorAction
    }

    class BehaviorContext {
        +CharacterState character
        +Personality personality
        +WorldModel world
        +InteractionSnapshot interactions
        +RecentActionLog history
        +number energy
        +number boredom
        +number novelty
    }

    class LocalBrain {
        +decide(context: BehaviorContext) BehaviorAction
    }

    class RemoteBrainClient {
        +string endpoint
        +decide(request: BrainRequest) Promise~BrainDecision~
        +abort(requestId: string) void
    }

    class BrainRequest {
        +string characterId
        +BehaviorContextSummary context
        +string[] allowedActions
    }

    class BrainDecision {
        +string action
        +number durationMs
        +string target
        +number confidence
    }

    class BehaviorContextSummary {
        +string currentAction
        +number energy
        +boolean grounded
        +number nearbySurfaceCount
        +string[] recentActions
    }

    class RecentActionLog {
        +record(action: string) void
        +penalty(action: string) number
    }

    BehaviorController --> StateMachine
    StateMachine --> BehaviorState
    BehaviorState --> BehaviorAction
    BehaviorController --> UtilityDecisionEngine
    UtilityDecisionEngine --> BehaviorContext
    BehaviorController --> BehaviorContext
    BehaviorContext --> Personality
    BehaviorContext --> CharacterState
    BehaviorContext --> WorldModel
    BehaviorContext --> InteractionSnapshot
    BehaviorContext --> RecentActionLog
    LocalBrain --> UtilityDecisionEngine
    RemoteBrainClient --> BrainRequest
    RemoteBrainClient --> BrainDecision
    BrainRequest --> BehaviorContextSummary
    BehaviorController --> LocalBrain
    BehaviorController --> RemoteBrainClient

    %% =========================================================
    %% INTERACTIONS / INPUT
    %% =========================================================
    class InteractionManager {
        +start() void
        +stop() void
        +emit(event: InteractionEvent) void
        +getSnapshot() InteractionSnapshot
    }

    class InteractionEvent {
        +InteractionType type
        +number timestamp
        +Vector2 position
        +Map metadata
    }

    class InteractionSnapshot {
        +boolean pointerNear
        +boolean pointerOver
        +boolean dragged
        +boolean scrolling
        +string lastAction
    }

    class InteractionConfig {
        +boolean draggable
        +boolean clickActions
        +boolean hoverActions
        +boolean followPointer
    }

    LivingRuntime --> InteractionManager
    InteractionManager --> InteractionEvent
    InteractionManager --> InteractionSnapshot
    InteractionManager --> InteractionConfig
    BehaviorContext --> InteractionSnapshot

    %% =========================================================
    %% CAMERA / SCROLL
    %% =========================================================
    class CameraController {
        +CameraState state
        +update(scrollX: number, scrollY: number) void
        +worldToScreen(position: Vector2) Vector2
        +screenToWorld(position: Vector2) Vector2
    }

    class CameraState {
        +number x
        +number y
    }

    CameraController --> CameraState
    CameraController --> Vector2
    LivingRuntime --> CameraController
    RuntimeState --> CameraState

    %% =========================================================
    %% RENDERING
    %% =========================================================
    class Renderer {
        <<interface>>
        +initialize() void
        +render(frame: RenderFrame) void
        +resize(viewport: ViewportState) void
        +destroy() void
    }

    class CanvasRenderer {
        +HTMLCanvasElement canvas
        +CanvasRenderingContext2D context
        +initialize() void
        +render(frame: RenderFrame) void
        +resize(viewport: ViewportState) void
        +destroy() void
    }

    class RenderFrame {
        +CharacterRenderState[] characters
        +CameraState camera
        +ViewportState viewport
    }

    class CharacterRenderState {
        +Vector2 position
        +number width
        +number height
        +string animation
        +number frameIndex
        +Direction direction
        +number opacity
    }

    Renderer <|.. CanvasRenderer
    CanvasRenderer --> RenderFrame
    RenderFrame --> CharacterRenderState
    CharacterRenderState --> Vector2
    RenderFrame --> CameraState
    RenderFrame --> ViewportState
    LivingRuntime --> Renderer

    %% =========================================================
    %% LOOP / SCHEDULING
    %% =========================================================
    class GameLoop {
        +number targetFPS
        +start() void
        +stop() void
        +frame(timestamp: number) void
    }

    class Scheduler {
        +schedule(task: Function, delayMs: number) void
        +cancel(id: string) void
        +flushDue(now: number) void
    }

    GameLoop --> Scheduler
    LivingRuntime --> GameLoop
    GameLoop --> PhysicsEngine
    GameLoop --> BehaviorController
    GameLoop --> AnimationController
    GameLoop --> Renderer

    %% =========================================================
    %% CLOUD / CONFIGURATION
    %% =========================================================
    class LivingWebAPIClient {
        +string baseUrl
        +string apiKey
        +getCharacter(id: string) Promise~CharacterProfile~
        +createCharacter(profile: CharacterProfile) Promise~CharacterProfile~
        +getBehaviorProfile(id: string) Promise~BehaviorProfile~
        +decide(request: BrainRequest) Promise~BrainDecision~
    }

    class CharacterProfile {
        +string id
        +string species
        +Personality personality
        +AssetManifest assets
        +string policyVersion
    }

    class BehaviorProfile {
        +string id
        +string policyVersion
        +Map actionWeights
        +Map cooldowns
    }

    LivingRuntime --> LivingWebAPIClient
    LivingWebAPIClient --> CharacterProfile
    LivingWebAPIClient --> BehaviorProfile
    CharacterProfile --> Personality
    CharacterProfile --> AssetManifest
    BehaviorController --> BehaviorProfile

    %% =========================================================
    %% CONFIG TYPES
    %% =========================================================
    class WorldConfig {
        +boolean autoDetect
        +boolean useSemanticElements
        +string[] ignoredSelectors
        +string[] platformSelectors
    }

    class BehaviorConfig {
        +boolean localAI
        +string remoteAI
        +number decisionIntervalMs
        +number actionCooldownMs
    }

    class RuntimeConfig {
        +number targetFPS
        +boolean reducedMotionAware
        +number maxCharacters
    }

    PetConfig --> WorldConfig
    PetConfig --> BehaviorConfig
    PetConfig --> InteractionConfig
    LivingRuntime --> RuntimeConfig

    %% =========================================================
    %% ENUMS / VALUE TYPES
    %% =========================================================
    class Direction {
        <<enumeration>>
        LEFT
        RIGHT
    }

    class ActionState {
        <<enumeration>>
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
    }

    class BehaviorActionType {
        <<enumeration>>
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
    }

    class SurfaceType {
        <<enumeration>>
        PLATFORM
        WALL
        ATTRACTOR
        HAZARD
        IGNORE
    }

    class CollisionType {
        <<enumeration>>
        FLOOR
        CEILING
        WALL
        EDGE
        NONE
    }

    class InteractionType {
        <<enumeration>>
        POINTER_ENTER
        POINTER_LEAVE
        CLICK
        DRAG_START
        DRAG_END
        SCROLL_START
        SCROLL_END
        RESIZE
        TAB_HIDDEN
        TAB_VISIBLE
        CUSTOM
    }

    %% =========================================================
    %% API RELATIONS
    %% =========================================================
    PetConfig --> AssetSource
    CharacterState --> Direction
    CharacterState --> ActionState
    WorldSurface --> SurfaceType
    Collision --> CollisionType
    InteractionEvent --> InteractionType
```

## Architectural interpretation

The diagram intentionally keeps four concerns separate:

1. **Runtime mechanics** — game loop, physics, world model, camera, rendering.
2. **Character intelligence** — behavior state machine, local utility AI, optional remote brain.
3. **Page integration** — DOM scanner, element classifier, interaction manager, scroll/camera mapping.
4. **Developer/cloud surface** — SDK API, assets, character profiles, behavior profiles, optional Living Web API.

The most important dependency direction is:

```text
DOM -> World Model -> Physics
                 \-> Behavior
Character State -> Behavior -> Animation
Character State + Camera + Animation -> Renderer
Remote AI -> Behavior recommendation only
```

The remote API is deliberately not in the frame-critical path.
