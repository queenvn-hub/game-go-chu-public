export function openFeedback(item = {}) {
  document.getElementById('feedback-dialog')?.remove();
  const dialog = document.createElement('dialog');
  dialog.id = 'feedback-dialog';
  dialog.style.cssText = 'width:min(540px,90vw);max-height:85vh;overflow:auto;border:2px solid #e6ae25;border-radius:20px;padding:24px;background:white;color:#242424';
  dialog.innerHTML = `<form><h2>Gửi phản hồi</h2><div role="tablist"><button type="button" role="tab" aria-selected="true" data-kind="translation">Báo từ / bản dịch sai</button><button type="button" role="tab" aria-selected="false" data-kind="suggestion">Góp ý cải thiện game</button></div><section><label>Từ<input name="target" maxlength="300"></label><label>Bản dịch<input name="translation" maxlength="300"></label></section><label>Nội dung / đề xuất sửa<textarea name="content" required maxlength="2000" rows="5"></textarea></label><p role="status"></p><button type="submit">Gửi phản hồi</button> <button type="button" data-close>Đóng</button></form>`;
  const form = dialog.querySelector('form');
  dialog.addEventListener('keydown', event => event.stopPropagation());
  dialog.addEventListener('keyup', event => event.stopPropagation());
  for (const button of dialog.querySelectorAll('button')) button.style.cssText = 'min-height:44px;padding:10px;margin:4px;border:1px solid #ce951a;border-radius:8px;background:#fff3c9;color:#862638;font:inherit;cursor:pointer;white-space:normal';
  dialog.querySelector('[role=tablist]').style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px';
  dialog.querySelector('h2').style.cssText = 'font-size:22px;color:#862638;margin:0 0 16px';
  for (const label of dialog.querySelectorAll('label')) label.style.cssText = 'display:block;color:#242424;font:inherit';
  let kind = 'translation';
  for (const el of dialog.querySelectorAll('input,textarea')) el.style.cssText = 'display:block;width:100%;box-sizing:border-box;margin:8px 0 16px;padding:10px;background:white;color:#222;border:1px solid #777;border-radius:6px';
  form.elements.target.value = String(item.text || item.targetText || '').slice(0,300);
  form.elements.translation.value = String(item.translationText || '').slice(0,300);
  for (const tab of dialog.querySelectorAll('[data-kind]')) tab.onclick = () => {
    kind = tab.dataset.kind;
    for (const other of dialog.querySelectorAll('[data-kind]')) other.setAttribute('aria-selected', String(other === tab));
    dialog.querySelector('section').hidden = kind === 'suggestion';
  };
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => dialog.remove());
  form.onsubmit = async event => {
    event.preventDefault();
    const status = dialog.querySelector('[role=status]');
    const button = event.submitter;
    button.disabled = true; status.textContent = 'Đang gửi…';
    try {
      const response = await fetch('/api/feedback', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind, ...Object.fromEntries(new FormData(form))})});
      if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Bản web này chưa hỗ trợ gửi trực tiếp. Vui lòng gửi email tới lethikieugiang1990@gmail.com hoặc Telegram @kieumis.');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Chưa gửi được phản hồi.');
      status.textContent = 'Đã gửi đến chủ web. Cảm ơn bạn!';
      form.elements.content.value = '';
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  };
  document.body.append(dialog); dialog.showModal();
}
