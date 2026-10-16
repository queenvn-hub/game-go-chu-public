const icon = name => {
  const node = document.createElement('i');
  node.className = 'play-icon';
  const svg = window.lucide?.createElement(window.lucide.icons[name]);
  if (svg) node.append(svg);
  node.setAttribute('aria-hidden', 'true');
  return node;
};

export function installPlayMenu() {
  const pane = document.querySelector('#play-pane');
  const addIcon = (selector, name) => {
    const target = document.querySelector(selector);
    if (target && !target.querySelector('.play-icon')) target.prepend(icon(name));
  };
  const stats = pane.querySelectorAll('.hero-metrics > div');
  ['BookOpen', 'Globe', 'Layers'].forEach((name, i) => stats[i].prepend(icon(name)));
  const support = document.createElement('details');
  support.className = 'play-support';
  support.innerHTML = '<summary>Hỗ trợ học song ngữ</summary>';
  const bilingual = pane.querySelector('#english-options-section');
  bilingual.before(support);
  support.append(bilingual);
  pane.querySelector('.trial-signup').before(support);
  const extras = document.createElement('section');
  extras.className = 'play-extra';
  extras.append(pane.querySelector('#speed-help-note'), support, pane.querySelector('.trial-signup'));
  pane.append(extras);
  for (const id of ['interface-language', 'translation-language', 'difficulty-select', 'level-select', 'topic-select']) {
    const select = pane.querySelector('#' + id);
    const wrapper = document.createElement('div');
    wrapper.className = 'play-select';
    select.before(wrapper);
    wrapper.append(select);
    if (id.endsWith('-language')) {
      const flag = document.createElement('span');
      flag.className = 'play-flag';
      flag.setAttribute('aria-hidden', 'true');
      wrapper.append(flag);
    } else wrapper.append(icon({ 'difficulty-select':'Gauge', 'level-select':'ChartNoAxesColumnIncreasing', 'topic-select':'Orbit' }[id]));
  }
  const challenge = document.createElement('div');
  challenge.className = 'play-challenge-title';
  pane.querySelector('.form-grid').before(challenge);
  const presetTitle = document.createElement('p');
  presetTitle.className = 'play-preset-title';
  pane.querySelector('.preset-grid').before(presetTitle);
  const presets = [...pane.querySelectorAll('[data-language-preset]')];
  const presetValues = ['vi-vi-en', 'vi-en-vi', 'vi-id-en', 'vi-vi-id'];
  presets.slice(0, 4).forEach((button, i) => { button.dataset.languagePreset = presetValues[i]; });
  const custom = document.createElement('button');
  custom.type = 'button';
  custom.className = 'play-custom-preset';
  presets[4].replaceWith(custom);
  custom.addEventListener('click', () => pane.querySelector('#interface-language').focus());

  return { render(language) {
    const vi = language === 'vi';
    const en = language === 'en';
    if (vi) pane.querySelector('.hero-copy').textContent = 'Chọn ngôn ngữ giao diện, ngôn ngữ luyện gõ và ngôn ngữ giải nghĩa, biến việc học từ vựng thành một chuyến phiêu lưu vũ trụ đầy hứng khởi.';
    presetTitle.textContent = vi ? 'Chọn nhanh bộ cài đặt:' : en ? 'Quick presets:' : 'Pengaturan cepat:';
    const labels = ['Việt - Anh', 'Anh - Việt', 'Indo - Anh', 'Việt - Indo'];
    presets.slice(0,4).forEach((button,i) => {
      button.replaceChildren();
      const flag = document.createElement('span');
      flag.className = `play-flag flag-${['vi','en','id','vi'][i]}`;
      flag.setAttribute('aria-hidden','true');
      button.append(flag, document.createTextNode(labels[i]));
    });
    custom.replaceChildren(icon('Sparkles'), document.createTextNode(vi ? 'Tùy chỉnh' : en ? 'Custom' : 'Kustom'));
    challenge.replaceChildren(icon('SlidersHorizontal'),document.createTextNode(vi ? 'Tùy chỉnh thử thách' : en ? 'Challenge settings' : 'Pengaturan tantangan'));
    support.querySelector('summary').textContent = vi ? 'Hỗ trợ học song ngữ' : en ? 'Bilingual support' : 'Dukungan bilingual';
    for (const [source,title,caption] of [
      ['default', vi ? 'Dùng ngân hàng khái niệm mặc định' : en ? 'Default vocabulary bank' : 'Bank kosakata bawaan', null],
      ['custom', vi ? 'Dùng danh sách tùy chỉnh' : en ? 'Custom word list' : 'Daftar kata kustom', vi ? 'Tạo danh sách riêng của bạn' : en ? 'Your own vocabulary' : 'Kosakata Anda sendiri']
    ]) {
      const button = pane.querySelector(`[data-word-source="${source}"]`);
      const detail = caption || button.querySelector('small')?.textContent || button.textContent;
      const heading = document.createElement('span');
      heading.textContent = title;
      const small = document.createElement('small');
      small.textContent = detail;
      button.replaceChildren(heading, small);
    }
    for (const [mode, code, hint] of [['vietnamese','vi','Học từ vựng tiếng Việt'],['english','en','Learn English words'],['indonesian','id','Pelajari kosakata']]) {
      const card = pane.querySelector(`[data-mode="${mode}"]`);
      const flag = card.querySelector('.mode-icon');
      flag.className = `mode-icon play-flag flag-${code}`;
      flag.textContent = '';
      card.querySelector('small').textContent = hint;
      card.querySelector('i').textContent = '';
    }
    for (const id of ['interface-language','translation-language']) {
      const select = pane.querySelector('#'+id);
      select.dataset.flag = select.value;
      select.parentElement.querySelector('.play-flag').className = `play-flag flag-${select.value}`;
    }
    addIcon('#play-pane .step-label','Orbit');
    addIcon('#play-pane .best-score','Trophy');
    addIcon('#multilingual-settings-title','Globe');
    addIcon('#typing-language-label','Keyboard');
    addIcon('#keyboard-section legend','Settings');
    addIcon('#play-pane .word-source-section legend','Layers');
    addIcon('#play-pane #open-custom-loader','Plus');
    addIcon('#play-pane #start-button','Play');
    // Shared navigation icons are only visible while the play pane is active.
    const nav = { play:'Play', course:'BookOpen', minigames:'Gamepad2', custom:'Pencil', instructions:'BookOpen' };
    for (const [tab,name] of Object.entries(nav)) addIcon(`[data-menu-tab="${tab}"]`, name);
    addIcon('#instructions-button','CircleHelp');
    addIcon('.brand-mark','Keyboard');
  }};
}
