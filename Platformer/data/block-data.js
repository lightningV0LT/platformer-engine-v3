import { Block } from '../components/Block.js';
import { Transition } from '../components/SceneSystem.js';
import { Player } from '../components/Player.js';
import { linkPairs } from '../utils.js';

export function setKey(game) {
  const presets = {
      block: { solidColl: true, zIndex: 0, obj: Block }
  }

  game.blockKey = {
    P: {
        tag: 'player', id: 0, zIndex: 1, obj: Player,
        onLoad: { setSpawn: 'player' }
    },

    '-': { tag: 'block', ...presets.block },

    '~': { tag: 'jump_pad', ...presets.block, h: Block.size / 2, onEnter: { boost: 1.5 } },

    w: {
        tag: 'water', zIndex: 2, obj: Block,
        onEnter: { effect: { a: 0.5, mvx: 0.5, jumpSpeed: 0.5, mvy: 0.5 } },
        whileColliding: { fly: true },
        onExit: { undoEffect: true },
        onLoad: { loadSprite: { extractX: 2, extractY: 0 } }
    },

    f: {
        tag: 'frost', zIndex: 2, obj: Block,
        onEnter: {
          effect: { a: 0.5, mvx: 0.3333333333333333, jumpSpeed: 0.3333333333333333, mvy: 0.5 },
          initTimer: { name: "freezing", target: "block", dur: 150, deplete: -1, effect: "death", multiActivate: true, triggerAmt: 1 }
        },
        whileColliding: { updateTimer: "freezing" },
        onExit: { undoEffect: true },
        afterExit: { depleteTimer: "freezing" },
        onLoad: { loadSprite: { extractX: 3, extractY: 0 } }
    },

    M: {
        tag: 'receivers', ...presets.block,
        onLoad: () => linkPairs(game, 'receivers', (current, nearest) => game.objects.push(new Block({
          x: current.x + current.w, y: current.y, h: current.h / 2, t: 0, tag: 'platform', solidColl: true, from: current, to: nearest,
          action: b => {
              b.t += 0.01;
              b.x = lerp(b.from.x + b.w, b.to.x - b.w, (sin(b.t) + 1) / 2);
              b.y = lerp(b.from.y, b.to.y, (sin(b.t) + 1) / 2);
          },
          onEnter: (p, b) => p.offset = p.x - b.x,
          whileColliding: (p, b) => {
              if(p.vx === 0) {
                  p.offset ??= p.x - b.x;
                  p.x = b.x + p.offset;
              } else {
                  p.offset = null;
              }
          },
        }))),
    },

    X: {
        tag: 'teleporter', zIndex: 0, obj: Block,
        onLoad: obj => {
          linkPairs(game, 'teleporter', (current, nearest) => {
            current.to = nearest;
            nearest.to = current;
          });
          getSprite(obj, 1, 0)
        },
        onEnter: {
          initTimer: { name: "teleport", target: "block", dur: 100, effect: "teleportToPair", multiActivate: true, triggerAmt: 1 }
        },
        whileColliding: { updateTimer: "teleport" },
    },

    O: {
        tag: 'orb', zIndex: 0, obj: Block,
        onEnter: p => p.hasTapped = false,
        whileColliding: p => {
            if(p.inputs.up && !p.hasTapped && p.hasLetGoOfUp) {
                p.vy = -p.jumpSpeed;
                p.hasLetGoOfUp = false;
                delete p.hasTapped;
            }
        },
        onLoad: { loadSprite: { extractX: 5, extractY: 0 } }
    },

    U: {
        tag: 'gravity_orb', zIndex: 0, obj: Block,
        onEnter: p => p.hasTapped = false,
        whileColliding: p => {
            if(p.inputs.up && !p.hasTapped && p.hasLetGoOfUp) {
                p.g = -p.g;
                p.hasLetGoOfUp = false;
                delete p.hasTapped;
            }
        },
        onLoad: { loadSprite: { extractX: 6, extractY: 0 } }
    },

    ';': {
        tag: 'checkpoint', zIndex: 0, obj: Block,
        onEnter: { setSpawn: 'block' }
    },

    '@': {
        tag: 'portal', zIndex: 0, obj: Block,
        onEnter: { nextLevel: true },
        onLoad: { loadSprite: { extractX: 4, extractY: 0 } }
    },

    0: { tag: 'sc_norm', zIndex: 0, obj: Block, onEnter: { resetStats: true } },

    1: { tag: 'sc_slow', zIndex: 0, obj: Block, onEnter: { effect: { mvx: 0.75 } } },

    2: { tag: 'sc_xnorm', zIndex: 0, obj: Block, onEnter: { effect: { mvx: 1 } } },

    3: { tag: 'sc_speed', zIndex: 0, obj: Block, onEnter: { effect: { mvx: 1.5 } } },

    4: { tag: 'sc_ufloat', zIndex: 0, obj: Block, onEnter: { effect: { g: 0.75 } } },

    5: { tag: 'sc_gnorm', zIndex: 0, obj: Block, onEnter: { effect: { g: 1 } } },

    6: { tag: 'sc_ufall', zIndex: 0, obj: Block, onEnter: { effect: { g: 1.5 } } },

    7: { tag: 'sc_ufloat', zIndex: 0, obj: Block, onEnter: { effect: { g: -0.75 } } },

    8: { tag: 'sc_ugnorm', zIndex: 0, obj: Block, onEnter: { effect: { g: -1 } } },

    9: { tag: 'sc_ufall', zIndex: 0, obj: Block, onEnter: { effect: { g: -1.5 } } }
  }
}
