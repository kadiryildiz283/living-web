export enum Direction {
  LEFT = "LEFT",
  RIGHT = "RIGHT"
}

export enum ActionState {
  IDLE = "IDLE",
  WALK = "WALK",
  RUN = "RUN",
  JUMP = "JUMP",
  FALL = "FALL",
  CLIMB = "CLIMB",
  BARK = "BARK",
  SLEEP = "SLEEP",
  OBSERVE = "OBSERVE",
  INTERACT = "INTERACT"
}

export enum BehaviorActionType {
  IDLE = "IDLE",
  WALK = "WALK",
  RUN = "RUN",
  JUMP = "JUMP",
  FALL = "FALL",
  CLIMB = "CLIMB",
  BARK = "BARK",
  SLEEP = "SLEEP",
  OBSERVE = "OBSERVE",
  INTERACT = "INTERACT"
}

export enum SurfaceType {
  PLATFORM = "PLATFORM",
  WALL = "WALL",
  ATTRACTOR = "ATTRACTOR",
  HAZARD = "HAZARD",
  IGNORE = "IGNORE"
}

export enum CollisionType {
  FLOOR = "FLOOR",
  CEILING = "CEILING",
  WALL = "WALL",
  EDGE = "EDGE",
  NONE = "NONE"
}

export enum InteractionType {
  POINTER_ENTER = "POINTER_ENTER",
  POINTER_LEAVE = "POINTER_LEAVE",
  CLICK = "CLICK",
  DRAG_START = "DRAG_START",
  DRAG_END = "DRAG_END",
  SCROLL_START = "SCROLL_START",
  SCROLL_END = "SCROLL_END",
  RESIZE = "RESIZE",
  TAB_HIDDEN = "TAB_HIDDEN",
  TAB_VISIBLE = "TAB_VISIBLE",
  CUSTOM = "CUSTOM"
}
