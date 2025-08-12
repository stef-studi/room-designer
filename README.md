# Room Designer (Contours & Meubles)

Un outil 100% HTML/JS pour dessiner le contour d'une pièce (polygone éditable), redimensionner via poignées, régler l'échelle en px/m, et placer des meubles à l'échelle. Export/Import JSON inclus.

## Utilisation locale
1. Ouvrez `index.html` dans votre navigateur (double‑clic).
2. Modes : **Dessiner** (ajout de sommets), **Modifier** (déplacer/insérer/supprimer points, redimensionner via poignées), **Placer meubles**.
3. Astuces : **Maj+clic** pour insérer un point sur une arête, **Suppr** pour supprimer le point sélectionné, **Adapter au canevas** pour cadrer.

## Publier sur GitHub Pages
1. Créez un nouveau dépôt sur GitHub (ex. `room-designer`). **Ne cochez pas** l'option README (nous en avons un).
2. En local :

```bash
git init
git add .
git commit -m "Initial commit: Room Designer v2"
git branch -M main
git remote add origin https://github.com/<votre-user>/room-designer.git
git push -u origin main
```

3. Activez **Settings → Pages → Build and deployment → Deploy from a branch**, branche `main`, dossier `/root`.  
4. L'URL de votre app sera `https://<votre-user>.github.io/room-designer/`.

## Évolution avec l'agent
- Modifiez `index.html` puis `git add`, `commit`, `push`.  
- Revenez ici avec le fichier (ou le lien GitHub) pour que je propose un diff et des améliorations.  
- Pour des features plus avancées (portes/fenêtres, collisions, DXF import), on pourra passer à une structure modulée (ES modules).

## Licence
Vous êtes libre de choisir (MIT recommandé).
