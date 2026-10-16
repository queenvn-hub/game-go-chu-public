export function editorIcon(name) {
  const wrapper = document.createElement('i');
  wrapper.className = 'custom-icon';
  wrapper.setAttribute('aria-hidden', 'true');
  const definition = window.lucide?.icons[name];
  if (definition) wrapper.append(window.lucide.createElement(definition));
  return wrapper;
}

export function renderEditorIcons(root) {
  const heading = root.querySelector('#custom-loader-title');
  if (heading?.textContent === 'Tạo màn chơi từ nội dung của bạn' && !heading.querySelector('span')) {
    const highlight = document.createElement('span');
    highlight.textContent = 'nội dung của bạn';
    heading.replaceChildren(document.createTextNode('Tạo màn chơi từ '), highlight);
  }
  const mapping = {
    '[data-custom-source="paste"]':'ClipboardPaste', '[data-custom-source="file"]':'FileUp',
    '[data-custom-source="url"]':'Link', '[data-custom-source="ocr"]':'ScanText',
    '#custom-use-sample':'Files', '#custom-clear-text':'Trash2', '#custom-analyze':'Sparkles',
    '#custom-restore-list':'Undo2', '#custom-clear-list':'Trash2', '#custom-dedupe-list':'CopyCheck',
    '#custom-original-order':'ListOrdered', '#custom-shuffle-list':'Shuffle',
    '#custom-sort-alpha':'ArrowDownAZ', '#custom-sort-difficulty':'ChartNoAxesColumnIncreasing',
    '#custom-copy-list':'Copy', '#custom-export-txt':'Download', '#custom-add-button':'Plus'
  };
  for (const [selector, name] of Object.entries(mapping)) {
    const button = root.querySelector(selector);
    if (button && !button.querySelector('.custom-icon')) button.prepend(editorIcon(name));
  }
  root.querySelectorAll('.custom-stats-grid > div').forEach((node,index) => {
    if (!node.querySelector('.custom-icon')) node.prepend(editorIcon(['Files','FileSearch','CircleCheck','CircleX','Copy','Circle','Circle','Circle'][index]));
  });
}
