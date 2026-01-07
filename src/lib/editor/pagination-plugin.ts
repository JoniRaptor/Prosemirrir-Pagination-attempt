// lib/editor/pagination-plugin.ts
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { A4_HEIGHT_PX, PAGE_GAP, PAGE_MARGIN, isNodeCrossing } from './pagination-utils';
import type { Node } from 'prosemirror-model';

export const paginationKey = new PluginKey('pagination');

export const paginationPlugin = () => {
	return new Plugin({
		key: paginationKey,
		state: {
			init() {
				return DecorationSet.empty;
			},
			apply(tr, set) {
				// Mappe die Dekorationen bei Änderungen (z.B. Tippen)
				set = set.map(tr.mapping, tr.doc);
				// Wenn die Transaction von unserem eigenen Plugin kommt, nimm die neuen Dekos
				const newDecorations = tr.getMeta(paginationKey);
				if (newDecorations) return newDecorations;
				return set;
			}
		},
		props: {
			decorations(state) {
				return paginationKey.getState(state);
			}
		},
		view() {
			return {
				update(view, prevState) {
					const docChanged = !view.state.doc.eq(prevState.doc);
					// Nur berechnen, wenn sich der Inhalt geändert hat
					// und die Transaction nicht von uns selbst kam
					if (docChanged) {
						setTimeout(() => {
							if (view.isDestroyed) return;

							const nextDecos = calculateSpacers(view);

							const tr = view.state.tr.setMeta(paginationKey, nextDecos);
							tr.setMeta('addToHistory', false);
							view.dispatch(tr);
						}, 10);
					}
				}
			};
		}
	});
};

function calculateSpacers(view: EditorView): DecorationSet {
	const decorations: Decoration[] = [];
	const { dom, state } = view;
	const editorRect = dom.getBoundingClientRect();

	state.doc.descendants((node: Node, pos: number) => {
		console.log('node', node.constructor.name);
		// WICHTIG: Bei 'doc' true zurückgeben, damit Kinder (p, h1) durchsucht werden
		if (node.type.name === 'doc') return true;
		if (!node.isBlock) return false;

		// Wir suchen das DOM-Element zu diesem Node
		const nodeDOM = view.nodeDOM(pos) as HTMLElement;
		if (!nodeDOM || typeof nodeDOM.getBoundingClientRect !== 'function') return true;

		const rect = nodeDOM.getBoundingClientRect();
		const relativeTop = rect.top - editorRect.top;
		const relativeBottom = rect.bottom - editorRect.top;

		const { isCrossing, startPage, endPage } = isNodeCrossing(relativeTop, relativeBottom);

		const pageHeightWithGap = A4_HEIGHT_PX + PAGE_GAP;
		const endStartPage = startPage * pageHeightWithGap + A4_HEIGHT_PX - PAGE_MARGIN;
		const targetTop = endPage * pageHeightWithGap;

		if (isCrossing) {
			// Ziel: Den Node an den Anfang der NÄCHSTEN Seite schieben
			// Suche die exakte Position innerhalb des Textes
			console.log('offsetTop: ', relativeTop);
			console.log('offsetBottom: ', relativeBottom);
			console.log('StartPage: ', startPage);
			console.log('EndPage: ', endPage);
			console.log('endStartPage: ', endStartPage);
			console.log('targetTop: ', targetTop);

			let pageIndex = startPage;
			let pageEnd = endStartPage;
			const splitPos: Array<number> | number = [];
			for (let i = 0; i < node.textContent.length; i++) {
				const charPos = pos + 1 + i;
				const coords = view.coordsAtPos(charPos);
				const charBottom = coords.bottom - editorRect.top;

				if (charBottom > pageEnd) {
					splitPos.push(charPos);
					pageIndex++;
					pageEnd = pageIndex * pageHeightWithGap + A4_HEIGHT_PX - PAGE_MARGIN;
				}
			}

			console.log('splitPos: ', splitPos);
			for (let i = 0; i < splitPos.length; i++) {
				const pos = splitPos[i];
				const spacerHeight = targetTop - (view.coordsAtPos(pos).top - editorRect.top);
				console.log('pos: ', pos);
				console.log('view.coordsAtPos(pos).top: ', view.coordsAtPos(pos).top);
				console.log('editorRect.top: ', editorRect.top);
				console.log('spacerHeight: ', spacerHeight);

				decorations.push(
					Decoration.widget(
						pos,
						() => {
							const div = document.createElement('div');
							div.className = 'inline-page-spacer';
							div.style.height = `60px`;

							const label = document.createElement('div');
							label.className = 'page-break-label';
							label.innerText = `Seite ${startPage + 1 + i}`;
							div.appendChild(label);

							return div;
						},
						{ side: 0 }
					) // side 0 platziert es genau zwischen die Zeichen
				);
			}
			return false;
		}
		return true;
	});

	return DecorationSet.create(state.doc, decorations);
}
