
export const makeId = () => {
  if (global.crypto?.randomUUID) return global.crypto.randomUUID();
  // Node <19 fallback
  return 'id-' + Math.random().toString(36).slice(2, 10);
};
