  /** Global Variables **/
  import { SceneLoader, Transition } from './components/SceneSystem.js';
  import { AssetLoader } from './components/AssetLoader.js';
  import { Player } from './components/Player.js';
  import { Game } from './Game.js';

  let pressing = false;
  let released = false;
  let dragging = false;

  function preload() {
    AssetLoader.block_sprites = loadImage('assets/block-sprites.png');
    Game.level_data = loadJSON('data/level-data.JSON');
    Player.stats = loadJSON('data/player-stats.JSON');
  }

  function setup() {
    createCanvas(windowWidth, windowHeight);
    globalThis.viewport = { x: 0, y: 0, w: windowWidth, h: windowHeight };

    try {
      SceneLoader.create({
        name: 'loading',
        run() {
          AssetLoader.load();
          frameRate(60);
          Transition.restart(() => SceneLoader.swap('game'));
        },
      })
      SceneLoader.create(new Game());
      SceneLoader.create({
        name: 'otherScene',
        run() {
          background(255, 0, 0);
          if(keyIsDown(84)) Transition.restart(() => SceneLoader.swap('game'));
        }
      });
    } catch(e) {
      console.log(e);
    }

    SceneLoader.swap('loading');
  }

  function draw() {
      background(255);
      try {
          SceneLoader.run();
      } catch(e) {
          console.error(e);
      }

      Transition.run();
  }

  window.preload = preload;
  window.setup = setup;
  window.draw = draw;

  // === Mouse events ===
  function mousePressed() {
      released = false;
      pressing = true;
  }
  function mouseDragged() {
      dragging = true;
  }
  function mouseReleased() {
      pressing = false;
      released = true;
      dragging = false;
  }
  function mouseOut() {
      pressing = false;
      released = true;
      dragging = false;
  }

  function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
  }
