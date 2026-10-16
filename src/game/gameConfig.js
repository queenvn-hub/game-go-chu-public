export const GAME_CONFIG = {
  shield: 100,
  damage: 18,
  maxTargets: 7,
  maxTargetsByDifficulty: {
    slowest: 1,
    'very-slow': 2
  },
  targetTravelSeconds: { slowest: 50, 'very-slow': 40, slow: 30, medium: 20, fast: 9, 'very-fast': 7 },
  levelDuration: 28,
  projectileSpeed: 1040,
  finalProjectileSpeed: 1040,
  pointsPerCharacter: 5,
  completionBonus: 30,
  particleLimit: 420,
  spawn: {
    slowest: 6,
    'very-slow': 5.9,
    slow: 2.8,
    medium: 2.15,
    fast: 1.55,
    'very-fast': 1.1,
    dynamic: 2.35
  },
  speed: {
    slowest: [8, 8],
    'very-slow': [16, 24],
    slow: [42, 58],
    medium: [55, 76],
    fast: [72, 98],
    'very-fast': [100, 132],
    dynamic: [52, 72]
  }
};

export const LEVEL_NAMES = [
  'Khởi động', 'Tăng tốc', 'Quỹ đạo xanh', 'Mưa sao', 'Hộ vệ tinh vân',
  'Vùng năng lượng', 'Bão thiên thạch', 'Cổng lượng tử', 'Chặng cuối', 'Trái tim ngân hà'
];
