/** Camera Class **/
export class Camera {
  static viewX = 0;
  static viewY = 0;
  static zoom = 1;
  static offset = 0;
  static speed = 10;

  static follow(ent) {
    const x = -ent.x + this.x + this.w / 2 - ent.w / 2 + this.offset;
    const y = -ent.y + this.y + this.h / 2 - ent.h / 2 + this.offset;
    const angle = Math.atan2(y - this.viewY, x - this.viewX);
    const vel = Math.hypot(x - this.viewX, y - this.viewY) / this.speed;
    this.viewX = Math.max(Math.min(this.viewX + vel * Math.cos(angle), this.x), this.x + this.w - this.levelW);
    this.viewY = Math.max(Math.min(this.viewY + vel * Math.sin(angle), this.y), this.y + this.h - this.levelH);
  }
  static view(ent) {
    const vx = this.x - this.viewX, vy = this.y - this.viewY, vw = this.w - ent.w, vh = this.h - ent.h;

    if (ent.x > vx - ent.w && ent.x < vx + vw + ent.w && ent.y > vy - ent.h && ent.y < vy + vh + ent.h) {
      const zw = this.zoom - ((this.zoom - 1) * this.w / 2);
      return {
        x: (this.viewX + ent.x) * zw,
        y: (this.viewY + ent.y) * zw,
        w: ent.w * this.zoom,
        h: ent.h * this.zoom,
      };
    }
  }
}
