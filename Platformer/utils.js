function getNearest(arr, linked, item) {
    // Initialize nearest and nearestDistancce
    let nearest = null;
    let nearestDistance = Infinity;
    for(let item2 of arr.filter(i2 => i2 !== item)) {
        if(!linked.includes(item2)) {
            const d = dist(item.x, item.y, item2.x, item2.y);
            if(d < nearestDistance) {
                nearestDistance = d;
                nearest = item2;
            }
        }
    }

    return nearest;
}

export function linkPairs(game, tag, action = () => {}) {
  const linked = [];
  const objects = game.getObjects({ tag }).sort((a, b) => a.x - b.x);
  for(let current of objects) {
    let nearest = getNearest(objects, linked, current);
    if(!nearest || linked.includes(current) || linked.includes(nearest)) continue;

    linked.push(current);
    linked.push(nearest);
    action(current, nearest);
  }
}


export const aabb = (a, b) => a.x <= b.x + b.w && a.x + a.w >= b.x && a.y <= b.y + b.h && a.y + a.h >= b.y;
