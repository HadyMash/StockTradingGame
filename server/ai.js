export function makeDecision(data) {
  const rnd = Math.random();
  if (rnd < 1 / 3) {
    return { decision: AIDecision.BUY, quantity: 0.1 };
  } else if (rnd < 2 / 3) {
    return { decision: AIDecision.SELL, quantity: 0.1 };
  } else {
    return { decision: AIDecision.NOTHING };
  }
}

export const AIDecision = {
  BUY: 'buy',
  SELL: 'sell',
  NOTHING: 'nothing',
};
