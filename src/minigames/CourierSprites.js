// Source rectangles exclude neighboring poses and parcels in the supplied PNGs.
// Frame 02 has a baked background and is retained only as the supplied original.
export const COURIER_RUN_FRAMES = ['01', '03', '04', '03'].map(n => `courier-user/cat_run_distinct_${n}`);
export const COURIER_RUN_RECTS = {
  'courier-user/cat_run_distinct_01': [20, 74, 472, 365],
  'courier-user/cat_run_distinct_03': [20, 39, 472, 436],
  'courier-user/cat_run_distinct_04': [20, 52, 472, 439]
};
export function courierRunFrame(elapsed) {
  return COURIER_RUN_FRAMES[Math.floor(elapsed * 8) % COURIER_RUN_FRAMES.length];
}

export const COURIER_JUMP_FRAMES = [
  { name: 'courier-user/cat_jump_01', rect: [90, 155, 188, 302] },
  { name: 'courier-user/cat_jump_03', rect: [128, 161, 213, 236] },
  { name: 'courier-user/cat_jump_04', rect: [98, 166, 179, 251] }
];

export function courierJumpFrame(velocity) {
  return COURIER_JUMP_FRAMES[velocity > .5 ? 0 : velocity > -.5 ? 1 : 2];
}
