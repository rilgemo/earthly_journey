import { EPOCH_MS, TIME_MULTIPLIER, MINUTES_PER_INGAME_DAY } from '../data/config';

export function getWorldTime() {
  const realMinutesSinceEpoch = (Date.now() - EPOCH_MS) / 1000 / 60;
  const totalIngameMinutes = Math.floor(realMinutesSinceEpoch * TIME_MULTIPLIER);
  const timeOfDay = totalIngameMinutes % MINUTES_PER_INGAME_DAY;
  const hour = Math.floor(timeOfDay / 60);
  const minute = timeOfDay % 60;
  const day = Math.floor(totalIngameMinutes / MINUTES_PER_INGAME_DAY) + 1;
  const isDay = hour >= 6 && hour < 18;
  const period =
    hour >= 5  && hour < 8  ? '清晨' :
    hour >= 8  && hour < 12 ? '上午' :
    hour >= 12 && hour < 14 ? '正午' :
    hour >= 14 && hour < 18 ? '下午' :
    hour >= 18 && hour < 21 ? '黄昏' :
    hour >= 21 || hour < 2  ? '深夜' : '凌晨';
  const label = `第${day}天 ${period} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
  return { totalIngameMinutes, day, hour, minute, timeOfDay, isDay, period, label };
}
