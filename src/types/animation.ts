export interface AnimationDefinition {
  name: string;
  frames: (string | CanvasImageSource)[];
  fps: number;
  loop: boolean;
  frameDurationMs: number;
}

export interface AssetManifest {
  animations: Record<string, AnimationDefinition>;
  spriteAtlasUrl?: string;
}

export interface AssetSourceInterface {
  resolve(): Promise<AssetManifest>;
}

export type AssetSource = string | AssetManifest | AssetSourceInterface | (() => Promise<AssetManifest>);
