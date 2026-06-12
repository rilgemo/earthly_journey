// A "tick" = one ingame hour (= 15 real minutes).
// On each tick boundary, registered handlers run to settle/summarize
// what happened during that hour, then push a message to the feed.

let lastTickHour = null;
const tickHandlers = [];

export function onTick(handler) {
  tickHandlers.push(handler);
}

export function checkTick(worldTime, pushMessage) {
  const currentTickHour = worldTime.day * 24 + worldTime.hour;
  if (lastTickHour === null) {
    lastTickHour = currentTickHour;
    return;
  }
  if (currentTickHour !== lastTickHour) {
    const ticksElapsed = currentTickHour - lastTickHour;
    tickHandlers.forEach(handler => handler(worldTime, ticksElapsed, pushMessage));
    lastTickHour = currentTickHour;
  }
}
