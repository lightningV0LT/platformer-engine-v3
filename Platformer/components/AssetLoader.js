export default class AssetLoader {
    static UIelements = {};
    static blocks = {};
    static players = {};

    static loadSprite(src, sx, sy, sw, sh) {
        let frame = createImage(sw, sh);
        frame.copy(src, sw * sx, sh * sy, sw, sh, 0, 0, sw, sh);
        return frame;
    }

    static load() {
        this?.block_sprites?.loadPixels();

        const fW = this?.block_sprites?.width / 8, fH = this?.block_sprites?.height / 8;

        this.blocks.defBlock = this.loadSprite(this?.block_sprites, 0, 0, fW, fH);

        noSmooth();
    }
}
