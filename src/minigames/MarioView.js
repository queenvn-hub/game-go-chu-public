import { t } from '../i18n/index.js';
import { escapeHtml } from '../game/text.js';
import { ArcadeView } from './ArcadeView.js';

export function marioCard(language) {
  return `<section class="mario-entry">
    <button type="button" class="mario-card" data-arcade-open="courier">
      <span class="mario-card-art" aria-hidden="true">
        <img src="./assets/arcade/cat_courier_jump.png" alt="Cat Courier">
        <img src="./assets/arcade/reward_envelope.png" alt="Letter Reward">
      </span>
      <span>
        <strong>${escapeHtml(t(language, 'arcadeCourier'))}</strong>
        <span>${escapeHtml(t(language, 'arcadeCourierDesc'))}</span>
        <b>${escapeHtml(t(language, 'arcadePlay'))} →</b>
      </span>
    </button>
  </section>`;
}

export class MarioView {
  constructor({ root, language, onBack }) {
    return new ArcadeView({ root, game: 'courier', language, onBack });
  }
}

