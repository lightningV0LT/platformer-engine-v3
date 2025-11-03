import { AssetLoader } from './AssetLoader.js';
import { aabb } from '../utils.js';
/** Tile class **/
export class Block {
    static size = 100;
    constructor(config) {
        Object.assign(this, { w: Block.size, h: Block.size }, config);
    }
    update(players) {
        players.forEach(player => player.contactBlocks[aabb(player, this) ? "add" : "delete"](this));
        this.action?.(this, players);
    }
    display(cam) {
        const view = cam.view(this);
        if(!view) return;
        const { x, y, w, h } = view;
        this.visuals?.(this, x, y, w, h);
        image(AssetLoader.blocks[this.tag] || AssetLoader.blocks.defBlock, x, y, w, h);
    }
}
