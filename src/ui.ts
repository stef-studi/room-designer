// Fonctions pour générer et gérer les formulaires dynamiques
// (à compléter lors de la refacto)

export function showFurnitureForm(furniture: any[], selectedIdx: number, redraw: () => void) {
  // Nettoie l'ancien formulaire
  let form = document.getElementById('furniture-form');
  if (form) form.remove();
  if (selectedIdx < 0) return;
  const obj = furniture[selectedIdx];
  form = document.createElement('form');
  form.id = 'furniture-form';
  form.style.position = 'absolute';
  form.style.left = (obj.x + 20) + 'px';
  form.style.top = (obj.y - 20) + 'px';
  form.style.background = '#fff';
  form.style.border = '1px solid #e5e7eb';
  form.style.borderRadius = '8px';
  form.style.padding = '8px';
  form.style.zIndex = '100';
  let html = '';
  html += `<label style="font-size:12px">Nom&nbsp;: <input type="text" value="${obj.type}" id="furniture-type" style="width:80px" /></label><br />`;
  html += `<label style="font-size:12px">Largeur (m): <input type="number" step="0.1" min="0.2" value="${obj.w}" id="furniture-w" style="width:50px" /></label>`;
  html += `<label style="font-size:12px;margin-left:8px">Profondeur (m): <input type="number" step="0.1" min="0.2" value="${obj.h}" id="furniture-h" style="width:50px" /></label>`;
  html += `<button type="button" id="furniture-rotate" style="margin-left:12px;color:#2563eb;background:#fff;border:1px solid #2563eb;border-radius:6px;padding:2px 8px;cursor:pointer">Rotation 90°</button>`;
  html += `<button type="button" id="furniture-delete" style="margin-left:12px;color:#ef4444;background:#fff;border:1px solid #ef4444;border-radius:6px;padding:2px 8px;cursor:pointer">Supprimer</button>`;
  form.innerHTML = html;
  document.body.appendChild(form);
  form.querySelector('#furniture-type')?.addEventListener('change', (e) => {
    obj.type = (e.target as HTMLInputElement).value;
    redraw();
  });
  form.querySelector('#furniture-w')?.addEventListener('change', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) {
      obj.w = val;
      redraw();
    }
  });
  form.querySelector('#furniture-h')?.addEventListener('change', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val > 0) {
      obj.h = val;
      redraw();
    }
  });
  form.querySelector('#furniture-rotate')?.addEventListener('click', (e) => {
    obj.rot = ((obj.rot ?? 0) + 90) % 360;
    redraw();
  });
  form.querySelector('#furniture-delete')?.addEventListener('click', (e) => {
    furniture.splice(selectedIdx, 1);
    redraw();
    form.remove();
  });
}

export function showRoomForm(/* params */) {
  // ...
}
