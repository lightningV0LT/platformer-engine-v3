import AssetLoader from './AssetLoader.js';
import { aabb } from '../utils.js';
import behaviors from '../data/behavior-registry.js';

export default class Block {
  static size = 100;

  constructor(config) {
    Object.assign(this, {...config, w: Block.size * (config.w ?? 1), h: Block.size * (config.h ?? 1)});
  }
  
  update({ players, game, Camera }) {
    players.forEach(player => player.contactBlocks[aabb(player, this) ? "add" : "delete"](this));

    if (this.action && typeof this.action === 'object') {
      Object.entries(this.action).forEach(([k, factor]) => {
        if (k in behaviors.action) behaviors.action[k](players, this, factor, game);
      });
    }
    this.display(Camera);
  }
  
  display(cam) {
    const view = cam.view(this);
    if(!view) return;
    const { x, y, w, h } = view;
    this.visuals?.(this, x, y, w, h);
    
    image(AssetLoader.blocks[this.tag] || AssetLoader.blocks.defBlock, x, y, w, h);
  }
}
