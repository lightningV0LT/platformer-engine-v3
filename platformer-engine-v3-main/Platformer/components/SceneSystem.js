export class Transition {
    static fade = 255;
    static on = false;
    static action = () => {};
    static run() {
        this.fade = lerp(this.fade, this.on ? 255 : 0, 0.1);

        if (Math.abs(255 - this.fade) < 1) {
            this.action();
            this.on = false;
        }

        fill(0, this.fade);
        rect(globalThis.viewport.x, globalThis.viewport.y, globalThis.viewport.w, globalThis.viewport.h);
    }
    static restart(callback = () => {}) {
        this.on = true;
        this.action = callback;
    }
}

/** Scene Loader **/
export class SceneLoader {
    static current = null;
    static scenes = {};

    static create(scene) {
        this.scenes[scene.name] = scene;
    }
    static swap(name) {
        this.scenes[this.current]?.exit?.();

        this.current = name;

        this.scenes[this.current]?.init?.();
    }
    static run() {
        this.scenes[this.current]?.run?.();
    }
}
