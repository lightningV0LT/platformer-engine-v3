import { setKey } from './data/block-data.js';
import { Camera } from './components/Camera.js';
import { Player } from './components/Player.js';
import { Block } from './components/Block.js';
import { AssetLoader } from './components/AssetLoader.js';

export class Game {
    constructor() {
        this.startLevel = 0;
        this.currentLevel = 0;
        this.objects = [];
        this.blockKey = {};
        this.spawnpoint = {};

        this.level = Game.level_data[this.currentLevel];
        this.levelSize = [0, 0];

        this.name = 'game';
    }
    getObjects(q) {
        return this.objects.filter(obj => Object.keys(q).every(k => obj[k] === q[k]));
    }

    loadNew(newLvl) {
        this.objects.length = 0;
        this.currentLevel = newLvl;
        this.level = Game.level_data[this.currentLevel];

        for(let row = 0; row < this.level.length; row++) {
            for(let col = 0; col < this.level[row].length; col++) {
                const entry = this.blockKey[this.level[row][col]];
                if(!entry) continue;
                this.objects.push(new entry.obj({
                    x: col * Block.size,
                    y: row * Block.size,
                    ...entry
                }));
            }
        }

        [...new Map(this.objects.map(obj => [obj.tag, obj])).values()]
  .forEach(obj => obj?.onLoad?.(obj));

        this.objects.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        this.levelSize = [this.level[0].length * Block.size, this.level.length * Block.size];
    }
    init() {
      Object.assign(Camera, globalThis.viewport);
      setKey(this);
      this.loadNew(this.startLevel);
    }
    run() {
        const players = this.getObjects({ tag: 'player' });
        const mainPlayer = players.find(p => p.id === 0);


        // Camera
        [Camera.levelW, Camera.levelH] = this.levelSize;

        if(mainPlayer) Camera.follow(mainPlayer);

        this.objects.forEach(obj => {
            obj.update({ players, game: this });
            obj.display(Camera);
        });

        // Respawn logic
        for(let i = players.length - 1; i >= 0; i--) {
            if(keyIsDown(82) || players[i].y > this.levelSize[1] || players[i].y < 0) players[i].dead = true;
            if(players[i].deadTime > 100) this.objects[this.objects.indexOf(players[i])] = new Player({...players[i], ...this.spawnpoint});
        }

        if(keyIsDown(84)) Transition.restart(() => SceneLoader.swap('otherScene'));
    }
    exit() {
        this.startLevel = this.currentLevel;
    }
}
