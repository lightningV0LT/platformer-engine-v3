

import { AssetLoader } from '../components/AssetLoader.js';

const getSprite = ({tag}, x, y, w = 8, h = 8) => AssetLoader.blocks[tag] = AssetLoader.loadSprite(AssetLoader.block_sprites, x, y, w, h);
obj => getSprite(obj, 2, 0)

export const behaviors = {
  onEnter: {
    effect: (player, block, game, factor) => {
      if (!block.triggered) {
        block.previousStats = Object.fromEntries(
          Object.keys(factor).map(key => [key, player.currentStats[key]])
        );
        Object.keys(factor).forEach(key => {
          player[key] *= factor[key];
        });
        block.triggered = true;
      }
    },
    boost: (player, block, game, factor) => player.vy = -player.jumpSpeed * Math.sign(player.g) * factor,
    initTimer: (player, block, game, factor) => {
      const target = { player, block }[factor.target];

      target[factor.name] ??= {
        time: 0,
        dur: factor.dur,
        deplete: factor.deplete,
        effect: factor.effect,
        multiActivate: factor.multiActivate,
        triggerAmt: factor.triggerAmt ?? 1,
        triggered: 0,
        data: factor.data ?? null
      };
    },
    nextLevel: (player, block, factor) => player.advance(1)
  },
  onExit: {
    undoEffect: (player, block, game, factor) => {
      if (block.previousStats) {
        Object.assign(player, block.previousStats);
        delete block.previousStats;
        block.triggered = false;
      }
    },
    resetEffect: (player, block, game, factor) => Object.assign(player, player.defStats)
  },
  whileColliding: {
    fly: (player) => player.jumping = false,
    updateTimer: (player, block, game, factor) => {
      const owner = [player, block].find(obj => factor in obj);
      const timer = owner?.[factor];

      if (!timer) return;

      timer.time ++;
      if (timer.time >= timer.dur && timer.triggered < timer.triggerAmt) {
        switch(timer.effect) {
          case "death":
            player.dead = true;
            break;
          case "effect":
            Object.assign(player, timer?.data);
            break;
        }
        timer.triggered++;
        !timer.multiActivate && delete owner[factor];
      }
    }
  },
  afterExit: {
    depleteTimer: (player, block, game, factor) => {
      const owner = [player, block].find(obj => factor in obj);
      const timer = owner?.[factor];

      if (!timer) return;

      timer.time += timer.deplete;
    }
  },
  onLoad: {
    loadSprite: (player, block, game, { extractX, extractY }) => getSprite(block, extractX, extractY),
    setSpawn: (player, block, game, factor) => {
      const { x, y } = { player, block }[factor];
      game.spawnpoint = { x, y };
    }
  }
};
