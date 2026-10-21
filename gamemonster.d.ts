// Type definitions for GameMonsterJS 3.0.0
// https://github.com/si0683/GameMonsterJS — MIT License

declare namespace GameMonster {
  type WorldName = 'sky' | 'space' | 'forest' | 'ocean' | 'night' | 'candy' | 'desert' | 'city';
  type KeyName = 'left' | 'right' | 'up' | 'down' | 'action' | 'tap' | (string & {});
  type ButtonName = 'left' | 'right' | 'up' | 'down' | 'action';
  type MusicName = 'adventure' | 'action' | 'boss' | 'calm' | 'menu' | (string & {});
  type Pose = 'idle' | 'walk' | 'jump' | 'fall' | 'hurt' | 'cheer' | 'duck' | 'attack' | (string & {});
  type GameState = 'menu' | 'countdown' | 'play' | 'pause' | 'quiz' | 'choose' | 'ending' | 'over';
  /** ZzFX parameter list: volume, randomness, frequency, attack, sustain, release, shape, … */
  type ZzfxParams = (number | undefined)[];

  interface QuizQuestion {
    text: string;
    answer: string;
    /** Wrong options (shuffled with the answer), or use `options` */
    wrong?: string[];
    options?: string[];
    hint?: string;
  }

  interface Card {
    icon?: string;
    title?: string;
    text?: string;
    [key: string]: any;
  }

  interface Texts {
    defaultTitle: string; play: string; settings: string; best: string; newRecord: string;
    sound: string; music: string; on: string; off: string; world: string; questions: string; difficulty: string;
    done: string; resume: string; restart: string; menu: string; paused: string; pause: string;
    win: string; over: string; playAgain: string; level: string; go: string;
    question: string; chooseUpgrade: string;
    helpMove: string; helpUpDown: string; helpAction: string; helpPause: string;
    easy: string; normal: string; hard: string; mathHint: string;
    rusHint: string; engHint: string; histHint: string;
    worlds: Partial<Record<WorldName, string>>;
    subjects: Record<string, string>;
  }

  interface PhysicsOptions {
    /** Gravity multiplier, 1 = normal */
    gravity?: number;
    /** Invisible walls and floor at the screen edges */
    walls?: boolean;
    /** Drag bodies with mouse/finger: true = any, or a tag */
    drag?: boolean | string;
  }

  interface Config {
    title?: string;
    subtitle?: string;
    /** Big emoji in the menu */
    emoji?: string;
    /** Controls hint in the menu (generated from `buttons` if empty) */
    help?: string;
    /** World size in pixels (the game is scaled to fit the window). Default 800 × 600 */
    width?: number;
    height?: number;
    world?: WorldName;
    /** Show world picker in settings: true = all, or a list */
    worlds?: boolean | WorldName[];
    /** 0 = no lives */
    lives?: number;
    heart?: string;
    /** Invulnerability after losing a life, seconds */
    hurtTime?: number;
    /** Quiz: true for built-in subjects, or your own questions */
    quiz?: boolean | { subject?: string; questions?: QuizQuestion[] };
    /** Difficulty picker in settings → game.diff (0.75 / 1 / 1.35) */
    difficulty?: boolean;
    countdown?: boolean;
    /** On-screen buttons on touch devices */
    buttons?: ButtonName[];
    actionLabel?: string;
    alwaysButtons?: boolean;
    sound?: boolean;
    volume?: number;
    /** Background music: built-in name or URL */
    music?: MusicName | false;
    musicVolume?: number;
    /** Kenney sounds to preload */
    sounds?: string[];
    /** 'twemoji' (default) draws emoji as images; 'system' uses the device font */
    emojiStyle?: 'twemoji' | 'system';
    /** Interface language. Default: browser language (ru → 'ru', otherwise 'en') */
    lang?: 'en' | 'ru';
    /** Override any interface text */
    texts?: Partial<Texts>;
    /** Where sounds/ and sprites/ are served from. Default: next to gamemonster.js or the CDN */
    assetsUrl?: string;
    /** Matter.js physics (loaded from CDN on demand) */
    physics?: boolean | PhysicsOptions;
    /** '3d' loads Three.js and enables game.add3d */
    mode?: '2d' | '3d';
    /** Background: CSS colour or your own drawing function */
    background?: string | ((game: Game, ctx: CanvasRenderingContext2D) => void);
    /** Element or selector to mount into. Default: #game or <body> */
    parent?: string | HTMLElement;
    autoStart?: boolean;

    setup?(game: Game): void;
    update?(game: Game, dt: number): void;
    draw?(game: Game, ctx: CanvasRenderingContext2D): void;
    drawBehind?(game: Game, ctx: CanvasRenderingContext2D): void;
    onOver?(game: Game, win: boolean): void;
  }

  interface ObjectProps {
    x?: number; y?: number;
    vx?: number; vy?: number; ax?: number; ay?: number;
    gravity?: number; friction?: number; maxSpeed?: number;
    size?: number; w?: number; h?: number;
    emoji?: string;
    /** Sprite name from the built-in catalogue ('knight') or an image URL */
    image?: string;
    pose?: Pose;
    animSpeed?: number;
    text?: string; font?: string;
    shape?: 'rect' | 'circle' | 'emoji' | 'text' | 'image';
    color?: string; radius?: number; glow?: string;
    angle?: number; spin?: number; alpha?: number; flip?: boolean; z?: number;
    tag?: string;
    fixed?: boolean;
    bounce?: boolean; wrap?: boolean; inside?: boolean;
    oneWay?: boolean;
    /** Lifetime in seconds (0 = forever); fade while dying */
    life?: number; fade?: boolean;
    removeOffscreen?: boolean;
    blink?: number;
    hitbox?: number;
    hp?: number;
    /** Matter.js body (needs physics: true) */
    body?: boolean | 'static';
    bodyShape?: 'box' | 'circle';
    restitution?: number; density?: number;
    [key: string]: any;
  }

  interface GameObject extends ObjectProps {
    x: number; y: number; vx: number; vy: number; w: number; h: number; angle: number; tag: string;
    dead: boolean;
    onGround: boolean;
    remove(): void;
  }

  interface Object3DProps {
    shape?: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'emoji' | 'image';
    x?: number; y?: number; z?: number;
    vx?: number; vy?: number; vz?: number;
    w?: number; h?: number; d?: number; size?: number;
    gravity?: number; spin?: number;
    rx?: number; ry?: number; rz?: number;
    color?: string; emoji?: string; image?: string;
    tag?: string; life?: number; blink?: number; hitbox?: number;
    shadow?: boolean; removeOffscreen?: boolean;
    [key: string]: any;
  }

  interface Object3D extends Object3DProps {
    is3d: true; dead: boolean; onGround: boolean;
    /** The Three.js mesh or sprite */
    mesh: any;
    remove(): void;
  }

  interface Sides { top: boolean; bottom: boolean; left: boolean; right: boolean; }

  interface DrawOptions { fixed?: boolean; radius?: number; size?: number; color?: string; align?: CanvasTextAlign; font?: string; bold?: boolean; shadow?: boolean; }

  interface Game {
    readonly version: string;
    width: number;
    height: number;
    state: GameState;
    score: number;
    best: number;
    lives: number;
    level: number;
    /** Seconds since the round started */
    time: number;
    frame: number;
    /** Difficulty multiplier: 0.75 / 1 / 1.35 */
    diff: number;
    /** Your own variables; reset every round */
    data: Record<string, any>;
    objects: (GameObject | Object3D)[];
    camera: { x: number; y: number };
    pointer: { x: number; y: number; down: boolean; worldX?: number; worldY?: number };
    swipe: 'left' | 'right' | 'up' | 'down' | null;
    key: Record<'left' | 'right' | 'up' | 'down' | 'action', boolean>;
    lang: 'en' | 'ru';
    texts: Texts;
    config: Config;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    /** Resolves when add-on libraries (Matter.js / Three.js) are loaded */
    ready: Promise<void>;
    physics?: { Matter: any; engine: any };
    three?: { THREE: any; scene: any; camera: any; renderer: any; sun: any };

    add(props: ObjectProps): GameObject;
    add3d(props: Object3DProps): Object3D;
    remove(obj: GameObject | Object3D): void;
    all(tag?: string): (GameObject | Object3D)[];
    first(tag: string): GameObject | null;
    count(tag?: string): number;
    clear(tag?: string): void;
    hit(a: any, b: any): boolean;
    hitAny(a: any, tag: string): GameObject | null;
    hitAll(a: any, tag: string): GameObject[];
    collide(a: GameObject, tag: string): Sides;
    follow(obj: GameObject | Object3D, options?: { x?: boolean; y?: boolean; atX?: number; atY?: number; smooth?: number; minX?: number; maxX?: number; minY?: number; maxY?: number; offset?: { x: number; y: number; z: number }; lookUp?: number }): void;

    isDown(key: KeyName): boolean;
    pressed(key: KeyName): boolean;

    addScore(points?: number, x?: number, y?: number): void;
    loseLife(): boolean;
    addLife(n?: number): void;
    nextLevel(): number;
    hud(label: string, value: string | number): void;
    message(text: string, seconds?: number): void;
    over(win?: boolean): void;
    win(): void;
    start(): void;
    restart(): void;
    pause(): void;
    menu(): void;
    setWorld(name: WorldName): void;
    step(dt: number): void;

    every(seconds: number, fn: (game: Game) => void): number;
    after(seconds: number, fn: (game: Game) => void): number;
    stopTimer(id: number): void;

    burst(x: number, y: number, options?: { emoji?: string; color?: string; count?: number; speed?: number; size?: number; time?: number; gravity?: number }): void;
    popup(x: number, y: number, text: string | number, color?: string): void;
    shake(power?: number, seconds?: number): void;
    flash(color?: string, seconds?: number): void;

    /** Built-in, Kenney or ZzFX preset name, or a ZzFX parameter array */
    sound(name: string | ZzfxParams, volume?: number): void;
    music(name: MusicName | false): void;

    text(text: string, x: number, y: number, options?: DrawOptions): void;
    emoji(emoji: string, x: number, y: number, size?: number, options?: DrawOptions): void;
    rect(x: number, y: number, w: number, h: number, color?: string, options?: DrawOptions): void;
    circle(x: number, y: number, r: number, color?: string, options?: DrawOptions): void;
    line(x1: number, y1: number, x2: number, y2: number, color?: string, width?: number, options?: DrawOptions): void;

    ask(question?: QuizQuestion): Promise<boolean>;
    choose<T extends Card>(cards: T[], title?: string): Promise<T>;

    velocity(obj: GameObject, vx: number, vy: number): void;
    push(obj: GameObject, vx: number, vy: number): void;
    onCollide(tagA: string, tagB: string, fn: (a: GameObject, b: GameObject, game: Game) => void): void;
    link(a: GameObject, b: GameObject | { x: number; y: number }, options?: { length?: number; stiffness?: number; color?: string; width?: number }): any;
    unlink(link: any): void;

    rand(min: number, max: number): number;
    randInt(min: number, max: number): number;
    pick<T>(list: T[]): T;
    chance(probability: number): boolean;
    clamp(value: number, min: number, max: number): number;
    shuffle<T>(list: T[]): T[];
    dist(a: { x: number; y: number }, b: { x: number; y: number }): number;
    angleTo(a: { x: number; y: number }, b: { x: number; y: number }): number;
  }

  interface GameMonsterStatic {
    readonly version: string;
    create(config: Config): Game;
    /** The game created on this page (handy in the console) */
    game?: Game;
    worlds: WorldName[];
    sounds: string[];
    music: string[];
    sprites: string[];
    subjects: string[];
    languages: string[];
    rand(min: number, max: number): number;
    randInt(min: number, max: number): number;
    pick<T>(list: T[]): T;
    chance(probability: number): boolean;
    clamp(value: number, min: number, max: number): number;
    shuffle<T>(list: T[]): T[];
    dist(a: { x: number; y: number }, b: { x: number; y: number }): number;
    angleTo(a: { x: number; y: number }, b: { x: number; y: number }): number;
  }
}

declare const GameMonster: GameMonster.GameMonsterStatic;

interface Window { GameMonster: GameMonster.GameMonsterStatic; }

declare module 'gamemonsterjs' {
  const GameMonster: GameMonster.GameMonsterStatic;
  export default GameMonster;
  export const create: (config: GameMonster.Config) => GameMonster.Game;
  export const version: string;
  export type Game = GameMonster.Game;
  export type Config = GameMonster.Config;
  export type GameObject = GameMonster.GameObject;
}
