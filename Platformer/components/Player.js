import { behaviors } from '../data/behavior-registry.js';
import { Transition } from './SceneSystem.js'

fetch('../Data/player-stats.JSON')
  .then(res => res.json())
  .then(data => Player.stats = data);

/** Player Class **/
export class Player {
  static size = 100;
  static character = 0;
  static binds = () => ({
      left: keyIsDown(65) || keyIsDown(LEFT_ARROW),
      right: keyIsDown(68) || keyIsDown(RIGHT_ARROW),
      up: keyIsDown(87) || keyIsDown(UP_ARROW),
      space: keyIsDown(32)
  });

  constructor(config) {
      Object.assign(this, { w: Player.size, h: Player.size }, config, Player.stats[config.id]);

      // Physics and inputs
      this.jumping = false;
      this.dashing = false;
      this.vx = 0;
      this.vy = 0;
      this.rot = 0;

      this.inputs = {};
      this.contactBlocks = new Set();
      this.cachedBlocks = {};
      this.defStats = Player.stats[this.id];

      this.canDash = false;
      this.nitroTime = 100;
      this.dead = false;
      this.deadTime = 0;
  }

  update({game}) {
      if(this.dead) {
          this.deadTime++
          return;
      };

      this.inputs = Player.binds();
      this.currentStats = Object.fromEntries(Object.keys(this.defStats).map(key => [key, this[key]]));


      if(this.inputs.up && !this.jumping) {
          this.vy = -this.jumpSpeed * Math.sign(this.g);
          this.jumping = true;
      }
      if(!this.inputs.up && this.jumping) this.hasLetGoOfUp = true;

      // Apply dashing or normal g
      if(this.dashing) {
          this.vy = this.g = 0;
          this.vx += Math.sign(this.vx) * (this.nitro / 20);
          this.nitroTime -= 10 - this.nitro / 20;
          if(this.nitroTime <= 0 || !this.inputs.space) this.dashing = false;
      } else {
          const dir = this.inputs.right - this.inputs.left;
          this.vx = dir !== 0 ? Math.min(Math.max(this.vx + dir * this.a, -this.mvx), this.mvx) : lerp(this.vx, 0, this.a);

          if(this.inputs.space && this.nitroTime > 10 && this.jumping && this.vx !== 0 && this.canDash) {
              this.dashing = true;
              this.canDash = false;
          }

          if(!this.canDash) this.g = this.defStats.g;

          this.nitroTime = Math.min(Math.abs(this.nitroTime) * 1.05, 100);
          this.vy = Math.min(this.vy + this.g, this.mvy);
      }

      /* Apply movement */
      this.jumping = true;
      this.x += this.vx;
      this.y += this.vy;
      this.resolveSolidCollisions();
      this.handleCollisions(game);
  }

  display(cam) {
      const view = cam.view(this);
      if(!view || this.dead) return;

      this.rot = this.jumping ? this.rot + this.vx: lerp(this.rot, Math.round(this.rot / 90) * 90, 0.5);

      rectMode(CENTER);
      push();
      translate(view.x + view.w / 2, view.y + view.h / 2);
      rotate(radians(this.rot * Math.sign(this.g)));
      noStroke();
      fill(11, 45, 51);
      rect(0, 0, view.w, view.h);
      pop();
      rectMode(CORNER);
  }
  resolveSolidCollisions() {
    for (const block of this.contactBlocks) {
      if (!block.solidColl) continue;

      const dx = (this.x + this.w / 2) - (block.x + block.w / 2);
      const dy = (this.y + this.h / 2) - (block.y + block.h / 2);
      const combinedW = (this.w + block.w) / 2;
      const combinedH = (this.h + block.h) / 2;

      if (Math.abs(dx) >= combinedW || Math.abs(dy) >= combinedH) continue;

      const overlapX = combinedW - Math.abs(dx);
      const overlapY = combinedH - Math.abs(dy);

      if (overlapX < overlapY) {
        this.x += dx > 0 ? overlapX : -overlapX;
        this.vx = 0;
      } else {
        this.y += dy > 0 ? overlapY : -overlapY;
        if ((Math.sign(this.g) > 0 && dy < 0) || (Math.sign(this.g) < 0 && dy > 0)) {
          this.jumping = false;
          this.canDash = true;
          this.hasLetGoOfUp = false;
        }
        this.vy = 0;
      }
    }
  }
  handleCollisions(game) {
    if (this.dead) return;
    // Group current blocks by tag
    const currentBlocks = {};
    for (const block of this.contactBlocks) {
      if (block.tag) {
        if (!currentBlocks[block.tag]) currentBlocks[block.tag] = [];
        currentBlocks[block.tag].push(block);
      }
    }

    // Process behaviors per tag
    const allTags = new Set([
      ...Object.keys(this.cachedBlocks),
      ...Object.keys(currentBlocks)
    ]);

    for (const tag of allTags) {
      const entry = this.cachedBlocks[tag] ||= {
        blocks: new Set(),
        entered: false,
        lastBlock: null
      };

      const currentlyColliding = currentBlocks[tag] || [];
      const wasColliding = entry.blocks.size > 0;
      const isColliding = currentlyColliding.length > 0;
      const firstBlock = currentlyColliding[0] || entry.lastBlock;

      // On enter
      if (isColliding && !wasColliding) {
        if (firstBlock?.onEnter && typeof firstBlock.onEnter === 'object') {
          Object.keys(firstBlock.onEnter).forEach(k => {
            if (behaviors.onEnter[k]) {
              behaviors.onEnter[k]?.(this, firstBlock, game, firstBlock.onEnter[k]);
            }
          });
        }
        entry.entered = true;
      }

      // While colliding
      if (isColliding && firstBlock?.whileColliding && typeof firstBlock.whileColliding === 'object') {
        Object.keys(firstBlock.whileColliding).forEach(k => {
          if (behaviors.whileColliding[k]) {
            behaviors.whileColliding[k]?.(this, firstBlock, game, firstBlock.whileColliding[k]);
          }
        });
      }

      // On exit
      if (!isColliding && wasColliding) {
        if (firstBlock?.onExit && typeof firstBlock.onExit === 'object') {
          Object.keys(firstBlock.onExit).forEach(k => {
            if (behaviors.onExit[k]) {
              behaviors.onExit[k]?.(this, firstBlock, game, firstBlock.onExit[k]);
            }
          });
        }

        // After exit
        if (entry.entered && firstBlock?.afterExit && typeof firstBlock.afterExit === 'object') {
          Object.keys(firstBlock.afterExit).forEach(k => {
            if (behaviors.afterExit[k]) {
              behaviors.afterExit[k]?.(this, firstBlock, game, firstBlock.afterExit[k]);
            }
          });
        }

        entry.entered = false;
      }

      // Update cached blocks
      entry.blocks = new Set(currentlyColliding);
      if (isColliding) entry.lastBlock = firstBlock;
    }
  }
}
