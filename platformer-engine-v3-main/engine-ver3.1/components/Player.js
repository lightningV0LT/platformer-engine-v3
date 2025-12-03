import behaviors from '../data/behavior-registry.js';

export default class Player {
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

  update({game, Camera}) {
    if(this.dead) {
      this.deadTime++
      return;
    };

    this.inputs = Player.binds();
    this.currentStats = Object.fromEntries(Object.keys(this.defStats).map(key => [key, this[key]]));

    this.applyMovement();
    this.resolveSolidCollisions();
    this.handleCollisions(game);
    this.display(Camera);
  }

  applyMovement() {
    const { left, right, up, space } = this.inputs;

    if(up && !this.jumping) {
      this.vy = -this.jumpSpeed * Math.sign(this.g);
      this.jumping = true;
    }
    if(!up && this.jumping) this.hasLetGoOfUp = true;

    if(this.dashing) {
      this.vy = this.g = 0;
      this.vx += Math.sign(this.vx) * (this.nitro / 20);
      this.nitroTime -= 10 - this.nitro / 20;
      if(this.nitroTime <= 0 || !space) this.dashing = false;
    } else {
      const dir = right - left;
      this.vx = dir !== 0 ? Math.min(Math.max(this.vx + dir * this.a, -this.mvx), this.mvx) : lerp(this.vx, 0, this.a);

      if(space && this.nitroTime > 10 && this.jumping && this.vx !== 0 && this.canDash) {
        this.dashing = true;
        this.canDash = false;
      }

      if(!this.canDash) this.g = this.defStats.g;

      this.nitroTime = Math.min(Math.abs(this.nitroTime) * 1.05, 100);
      this.vy = Math.min(this.vy + this.g, this.mvy);
    }

    this.jumping = true;
    this.x += this.vx;
    this.y += this.vy;
  }

  resolveSolidCollisions() {
    for (const block of this.contactBlocks) {
      if (!block.solidColl) continue;

      const delta = { x: (this.x + this.w / 2) - (block.x + block.w / 2), y: (this.y + this.h / 2) - (block.y + block.h / 2) };
      const sumSize = { w: (this.w + block.w) / 2, h: (this.h + block.h) / 2 };

      if (Math.abs(delta.x) >= sumSize.w || Math.abs(delta.y) >= sumSize.h) continue;

      const overlaps = { x: sumSize.w - Math.abs(delta.x), y: sumSize.h - Math.abs(delta.y) };
      const axis = overlaps.x < overlaps.y ? 'x' : 'y';

      this[axis] += Math.sign(delta[axis]) * overlaps[axis];
      this[`v${axis}`] = 0;

      if (axis === 'y' && Math.sign(this.g) * delta.y < 0) {
          this.jumping = this.hasLetGoOfUp = false;
          this.canDash = true;
      }
    }
  }



  handleCollisions(game) {
    if (this.dead) return;
    const currentBlocks = {};
    this.contactBlocks.forEach(b => (currentBlocks[b.tag] ??= []).push(b));
    
    for (const tag of new Set([...Object.keys(this.cachedBlocks), ...Object.keys(currentBlocks)])) {
      const entry = this.cachedBlocks[tag] ||= { blocks: new Set(), lastBlock: null };
      const currBlocks = new Set(currentBlocks[tag] || []);
      const firstBlock = entry.lastBlock || [...currBlocks][0] || [...entry.blocks][0];

      if (currBlocks.size > 0 && entry.blocks.size === 0 && firstBlock) {
        applyBehaviors('onEnter', this, firstBlock, game, firstBlock.onEnter);
      }

      for (const block of currBlocks) {
        applyBehaviors('whileColliding', this, block, game, block.whileColliding);
      }

      if (currBlocks.size === 0 && entry.blocks.size > 0 && firstBlock) {
        applyBehaviors('onExit', this, firstBlock, game, firstBlock.onExit);
        applyBehaviors('afterExit', this, firstBlock, game, firstBlock.afterExit);
      }

      entry.blocks = currBlocks;
      entry.lastBlock = [...currBlocks][0] || null;
    }
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
}

function applyBehaviors(type, player, block, game, config) {
  if (!config || typeof config !== 'object') return;
  for (const key of Object.keys(config)) {
    behaviors[type]?.[key]?.({ player, block, game, factor: config[key] });
  }
}
