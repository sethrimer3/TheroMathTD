// Shared enemy shell utilities for Thero Idle.
// Each shell has a front sprite (rendered in front of enemy)
// and a back sprite (rendered behind enemy). Shells are randomly assigned to enemies.

/** One decorative shell definition with optional back sprite. */
export interface EnemyShellDefinition {
  id: string;
  name: string;
  frontSprite: string;
  backSprite: string | null;
}

/** Mutable enemy record that carries assigned shell metadata. */
export interface EnemyShellCarrier {
  shellId?: string;
  shellFrontSprite?: string;
  shellBackSprite?: string | null;
  [key: string]: unknown;
}

/** Loaded front/back sprite pair returned once images are ready. */
export interface EnemyShellSprites {
  front: HTMLImageElement;
  back: HTMLImageElement | null;
}

interface ShellSpriteRecord {
  image: HTMLImageElement;
  loaded: boolean;
  error: boolean;
}

export const ENEMY_SHELL_DEFINITIONS: EnemyShellDefinition[] = [
  {
    id: 'armadillo_blue',
    name: 'Blue Armadillo Shell',
    frontSprite: './assets/sprites/enemies/shells/front/armadillo_shell_blue_front.png',
    backSprite: './assets/sprites/enemies/shells/back/armadillo_shell_blue_back.png',
  },
  {
    id: 'armadillo_white',
    name: 'White Armadillo Shell',
    frontSprite: './assets/sprites/enemies/shells/front/armadillo_shell_white_front.png',
    backSprite: './assets/sprites/enemies/shells/back/armadillo_shell_white_back.png',
  },
  {
    id: 'hecatontagon_pink',
    name: 'Pink Hecatontagon Shell',
    frontSprite: './assets/sprites/enemies/shells/front/hecatontagon_pink_front.png',
    backSprite: './assets/sprites/enemies/shells/back/hecatontagon_pink_back.png',
  },
  {
    id: 'octahedron_purple',
    name: 'Purple Octahedron Shell',
    frontSprite: './assets/sprites/enemies/shells/front/octahedron_purple_front.png',
    backSprite: './assets/sprites/enemies/shells/back/octahedron_purple_back.png',
  },
  {
    id: 'icosahedron_purple',
    name: 'Purple Icosahedron',
    frontSprite: './assets/sprites/enemies/shells/front/icosahedron_purple.png',
    backSprite: null, // No back sprite for this one
  },
  {
    id: 'dodecahedron_red',
    name: 'Red Dodecahedron',
    frontSprite: './assets/sprites/enemies/shells/front/dodecahedron_red.png',
    backSprite: null, // No back sprite for this one
  },
  {
    id: 'dodecahedron_yellow',
    name: 'Yellow Dodecahedron',
    frontSprite: './assets/sprites/enemies/shells/front/dodecahedron_yellow.png',
    backSprite: null, // No back sprite for this one
  },
  {
    id: 'metatron_purple',
    name: 'Purple Metatron Cube',
    frontSprite: './assets/sprites/enemies/shells/front/metatron_cube_purple.png',
    backSprite: null, // No back sprite for this one
  },
  {
    id: 'metatron_white',
    name: 'White Metatron Cube',
    frontSprite: './assets/sprites/enemies/shells/front/metatron_cube_white.png',
    backSprite: null, // No back sprite for this one
  },
  {
    id: 'pyramid_red',
    name: 'Red Pyramid',
    frontSprite: './assets/sprites/enemies/shells/front/pyramid_red.png',
    backSprite: null, // No back sprite for this one
  },
];

// Cache shell sprite images for efficient rendering
const SHELL_SPRITE_CACHE = new Map<string, ShellSpriteRecord>();

// Load and cache a shell sprite image
function loadShellSprite(spritePath: string | null | undefined): HTMLImageElement | null {
  if (!spritePath || typeof Image === 'undefined') {
    return null;
  }

  const cached = SHELL_SPRITE_CACHE.get(spritePath);
  if (cached && cached.loaded && !cached.error) {
    return cached.image;
  }
  if (cached && cached.error) {
    return null;
  }

  // If already loading, return the cached image (even if not yet loaded)
  if (cached) {
    return cached.image;
  }

  const image = new Image();
  const record: ShellSpriteRecord = { image, loaded: false, error: false };
  image.addEventListener('load', () => {
    record.loaded = true;
  });
  image.addEventListener('error', () => {
    record.error = true;
  });
  image.src = spritePath;
  SHELL_SPRITE_CACHE.set(spritePath, record);
  return image;
}

// Assign a random shell to an enemy. The shell persists on the enemy object.
export function assignRandomShell(enemy: EnemyShellCarrier | null | undefined): void {
  if (!enemy || enemy.shellId) {
    return; // Enemy already has a shell assigned
  }

  if (ENEMY_SHELL_DEFINITIONS.length === 0) {
    return; // No shells available
  }

  // Select a random shell
  const randomIndex = Math.floor(Math.random() * ENEMY_SHELL_DEFINITIONS.length);
  const shell = ENEMY_SHELL_DEFINITIONS[randomIndex];

  // Store shell info on enemy
  enemy.shellId = shell.id;
  enemy.shellFrontSprite = shell.frontSprite;
  enemy.shellBackSprite = shell.backSprite;

  // Pre-load the sprite images
  loadShellSprite(shell.frontSprite);
  loadShellSprite(shell.backSprite);
}

// Get the loaded shell sprite images for an enemy
export function getEnemyShellSprites(
  enemy: EnemyShellCarrier | null | undefined,
): EnemyShellSprites | null {
  if (!enemy || !enemy.shellFrontSprite) {
    return null;
  }

  const frontImage = SHELL_SPRITE_CACHE.get(enemy.shellFrontSprite);

  // If there's a back sprite, check if both are loaded
  if (enemy.shellBackSprite) {
    const backImage = SHELL_SPRITE_CACHE.get(enemy.shellBackSprite);

    // Only return if both are loaded successfully
    if (frontImage?.loaded && !frontImage?.error && backImage?.loaded && !backImage?.error) {
      return {
        front: frontImage.image,
        back: backImage.image,
      };
    }
  } else {
    // No back sprite, only return front if loaded
    if (frontImage?.loaded && !frontImage?.error) {
      return {
        front: frontImage.image,
        back: null,
      };
    }
  }

  return null;
}
