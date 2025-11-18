import AssetLoader from '../components/AssetLoader.js';
import { Transition } from '../components/SceneSystem.js';
import Block from '../components/Block.js';

function runEffect(effectName, player, block, game, factor) {
  for (const group of Object.values(behaviors)) {
    if (typeof group[effectName] === 'function') {
      return group[effectName](player, block, game, factor);
    }
  }
  console.warn(`Effect "${effectName}" not found.`);
}


const behaviors = {};

behaviors.onEnter = {
  effect,
  boost: (player, block, game, factor) => player.vy = -player.jumpSpeed * Math.sign(player.g) * factor,
  initTimer: (player, block, game, factor) => {
    ({ player, block }[factor.target])[factor.name] ??= { 
      ...factor, 
      time: 0, 
      triggerAmt: factor.triggerAmt ?? 1,
      multiActivate: factor.multiActivate ?? false,
      triggered: 0, 
    }
  },
  nextLevel: (player, block, game, factor) => Transition.restart(() => game.loadNew(game.currentLevel + 1)),
  createOffset: (player, block, game, factor) => player.offset = player.x - block.x,
  resetTap: (player, block, game, factor) => player.hasTapped = false
};

behaviors.onExit = {
  effect,
  resetEffect: (player, block, game, factor) => Object.assign(player, player.defStats)
};

behaviors.whileColliding = {
  effect,
  fly: (player) => player.jumping = false,
  updateTimer: (player, block, game, factor) => {
    const owner = [player, block].find(obj => factor in obj);
    const timer = owner?.[factor];

    if (!timer) return;
    timer.time ++;
    if (timer.time >= timer.dur && timer.triggered < timer.triggerAmt) {
      runEffect(timer.effect, player, block, game, factor);
      timer.triggered++;

      if (timer.multiActivate) {
        timer.time = 0; // Reset for next cycle
      } else {
        delete owner[factor];
      }
    }

  },
  stick: (player, block, game, factor) => {
    if (player.vx === 0) {
      player.offset ??= player.x - block.x;
      player.x = block.x + player.offset;
    } else {
      player.offset = null;
    }
  },
  jumpOnTap: (player, block, game, factor) => {
    if(player.inputs.up && !player.hasTapped && player.hasLetGoOfUp) {
      player.y = -player.jumpSpeed;
      player.hasLetGoOfUp = false;
      delete player.hasTapped;
    }
  },
  effectOnTap: (player, block, game, factor) => {
    if(player.inputs.up && !player.hasTapped && player.hasLetGoOfUp) {
      player.g = -player.g;
      player.hasLetGoOfUp = false;
      delete player.hasTapped;
    }
  }
},

behaviors.afterExit = {
  depleteTimer: (player, block, game, factor) => {
    const owner = [player, block].find(obj => factor in obj);
    const timer = owner?.[factor];

    if (!timer) return;

    timer.time += timer.deplete;
  }
};

behaviors.onLoad = {
  // signature: (block, game, factor)
  loadSprite: (block, game, { extractX, extractY }) => getSprite(block, extractX, extractY),
  setSpawn: (block, game, factor) => {
    let target = null;
    if (!factor || factor === 'block') target = block;
    else if (typeof factor === 'string' && factor.startsWith('player')) {
      const players = game.getObjects({ tag: 'player' }) || [];
      const parts = factor.split(':');
      if (parts.length > 1) {
        const id = Number(parts[1]);
        if (!Number.isNaN(id)) target = players.find(p => p.id === id) || null;
      } else {
        target = players.find(p => p.id === 0) || players[0] || null;
      }
    }

    if (!target) return; // nothing to set

    const { x, y } = target;
    game.spawnpoint = { x, y };
  },
  linkPairs,
  addDestination: (current, nearest, game) => {
    current.to = nearest;
    nearest.to = current;
  },
  createBlock: (block, game, factor) => {
    const spec = { ...factor };

    // Resolve position
    let x = 0, y = 0;

    if (typeof spec.x === 'number' && typeof spec.y === 'number') {
      x = spec.x;
      y = spec.y;
    } else if (typeof spec.pos === 'string') {
      x = spec[spec.pos].x;
      y = spec[spec.pos].y;
    }

    // This is literally unnecesary
    if (typeof x !== 'number') x = 0;
    if (typeof y !== 'number') y = 0;

    // Build config
    const config = { ...spec, x, y };

    game.objects.push(new Block(config));
  },
};

behaviors.action = {
  moveSineToFrom: (players, block, factor) => {
    block.t = (block.t ?? 0) + factor;
    const t = (Math.sin(block.t) + 1) / 2;
    if (block.current && block.nearest) {
      block.x = lerp(block.current.x + block.w, block.nearest.x - block.w, t);
      block.y = lerp(block.current.y, block.nearest.y, t);
    }
  }
};

behaviors.onCall = {
  ...behaviors, teleportToPair, createBlock, death
};

export default behaviors;

function getNearest(arr, linkedSet, item) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const candidate of arr) {
        if (candidate === item) continue;
        if (linkedSet.has(candidate)) continue;
        const d = dist(item.x, item.y, candidate.x, candidate.y);
        if (d < nearestDistance) {
            nearestDistance = d;
            nearest = candidate;
        }
    }
    return nearest;
}

function linkPairs(block, game, factor) {
  // run once per tag
  game.__linkedTags ??= new Set();
  if (game.__linkedTags.has(block.tag)) return;

  const linked = new Set();
  const objects = game.getObjects({ tag: block.tag }).slice().sort((a, b) => a.x - b.x);
  for (const current of objects) {
    if (linked.has(current)) continue;
    const nearest = getNearest(objects, linked, current);
    if (!nearest) continue;
    linked.add(current);
    linked.add(nearest);
    // create entity for this pair
    if (factor?.createBlock) {
      factor.createBlock.current = current;
      factor.createBlock.nearest = nearest;
      createBlock(block, game, factor.createBlock);
    }
    if (factor?.addDestination) behaviors.onLoad.addDestination(current, nearest, game, factor.addDestination);
  }

  game.__linkedTags.add(block.tag);
}

function death(player, block, game, factor) {
  player.dead = true
}

function teleportToPair(player, block, game, factor) {
  [player.x, player.y] = [block.to.x, block.to.y]
}

function createBlock(block, game, factor) {
  const spec = { ...factor };

  // Resolve position
  let x = 0, y = 0;

  if (typeof spec.x === 'number' && typeof spec.y === 'number') {
    x = spec.x;
    y = spec.y;
  } else if (typeof spec.pos === 'string') {
    x = spec[spec.pos].x;
    y = spec[spec.pos].y;
  }

  // This is literally unnecesary
  if (typeof x !== 'number') x = 0;
  if (typeof y !== 'number') y = 0;

  // Build config
  const config = { ...spec, x, y };

  game.objects.push(new Block(config));
}

function effect(player, block, game, factor) {
  const multi = factor.multiActivate ?? false;

  block._triggered ??= false;

  if (!multi && block._triggered) return;

  // Apply effect
  Object.keys(factor).forEach(key => {
    if (key !== "multiActivate") {
      player[key] *= factor[key];
    }
  });

  if (!multi) block._triggered = true;
};

function getSprite({ tag }, x, y, w = 8, h = 8) {
  return AssetLoader.blocks[tag] = AssetLoader.loadSprite(AssetLoader.block_sprites, x, y, w, h);
}
