const GROUPS = ['`1qaz', '2wsx', '3edc', '45rtfgvb', 'Space', '67yuhjnm', '8ik,', '9ol.', "0p;/-=[]\\'"];

export function fingerForKey(key) {
  if (['Tab', 'Caps'].includes(key)) return 0;
  if (['Enter', 'Backspace'].includes(key)) return 8;
  return GROUPS.findIndex(group => key === 'Space' ? group === key : key?.length === 1 && group.includes(key.toLowerCase()));
}

export function mountHandGuide(container, key, shift, panel) {
  if (!panel) return;
  const active = fingerForKey(key);
  const shiftFinger = shift ? (active < 4 ? 8 : 0) : -1;
  const neonFingers = [
    [0,'M152 590 Q168 550 194 590 L266 753 L228 777 Z'],
    [1,'M249 503 Q252 464 282 477 Q300 489 301 525 L344 703 L301 725 Z'],
    [2,'M352 464 Q351 411 389 416 Q419 421 410 470 L401 696 L356 698 Z'],
    [3,'M485 471 Q499 430 530 451 Q548 465 532 506 L481 728 L438 711 Z'],
    [4,'M546 830 L622 729 Q650 701 672 730 Q689 749 662 779 L582 883 Z'],
    [5,'M918 472 Q902 435 877 451 Q854 466 871 509 L925 726 L966 705 Z'],
    [6,'M1019 464 Q1018 418 1051 418 Q1084 419 1082 468 L1084 697 L1037 696 Z'],
    [7,'M1144 510 Q1143 470 1175 476 Q1206 483 1196 528 L1153 727 L1111 702 Z'],
    [8,'M1257 596 Q1272 553 1303 580 Q1321 596 1304 630 L1238 777 L1198 754 Z'],
    [4,'M853 833 L778 733 Q749 704 727 732 Q711 752 738 781 L817 885 Z']
  ];
  panel.querySelector('.hand-picture').innerHTML = `<svg viewBox="0 400 1448 686" aria-hidden="true"><image href="./assets/game-neon/hands.png" width="1448" height="1086"/>${neonFingers.map(([finger,d],i)=>`<path data-finger="${finger}" d="${d}" class="neon-finger ${(finger===active && (finger!==4 || i===4)) || finger===shiftFinger ? 'active-finger' : ''}"/>`).join('')}</svg>`;
  [...container.querySelectorAll('[data-key="Shift"]')].forEach((cap,i)=>cap.classList.toggle('next',shift && (i===0 ? shiftFinger===0 : shiftFinger===8)));
}
