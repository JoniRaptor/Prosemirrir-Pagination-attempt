<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorState } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { schema } from 'prosemirror-schema-basic';
	import { history, undo, redo } from 'prosemirror-history';
	import { baseKeymap } from 'prosemirror-commands';
	import { keymap } from 'prosemirror-keymap';
	import { paginationPlugin } from '$lib/editor/pagination-plugin';

	let editorElement: HTMLDivElement;
	let view: EditorView;

	onMount(() => {
		const state = EditorState.create({
			schema,
			// Start-Inhalt: Ein leerer Paragraph
			doc: schema.node('doc', null, [schema.node('paragraph')]),
			plugins: [
				paginationPlugin(),
				keymap({
					...baseKeymap,
					'Mod-z': undo,
					'Mod-y': redo,
					'Mod-Shift-z': redo
				}),
				history()
			]
		});

		view = new EditorView(editorElement, {
			state,
			// Verhindert, dass ProseMirror Standard-Styles überschreibt
			attributes: { class: 'prosemirror-content' }
		});
	});

	onDestroy(() => {
		if (view) view.destroy();
	});
</script>

<div class="editor-container">
	<div bind:this={editorElement} class="prosemirror-editor"></div>
</div>

<style>
	:global(.editor-container) {
		background: #f0f0f0;
		min-height: 100vh;
		padding: 40px 0;
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: center;
		overflow-y: auto;
	}

	:global(.prosemirror-editor) {
		background: white;
		width: 794px; /* A4 Breite bei 96 DPI */
		min-height: 1122px;
		padding: 40px; /* PAGE_MARGIN */
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		outline: none;
	}

	/* Das eigentliche editierbare Feld */
	:global(.prosemirror-content) {
		padding: 40px; /* PAGE_MARGIN */
		min-height: 1122px;
		outline: none;
	}

	/* Styling für die Spacer-Dekoration */
	:global(.page-spacer) {
		position: relative;
		margin-left: -80px; /* Margin ausgleichen, damit Linie über ganze Breite geht */
		margin-right: -80px;
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	:global(.page-remaining) {
		background: white;
		width: 794px; /* A4 Breite bei 96 DPI */
		min-height: 1122px;
		padding: 40px; /* PAGE_MARGIN */
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		outline: none;
		width: 100%;
	}

	:global(.page-footer) {
		background: white;
		margin-left: 80px; /* Margin ausgleichen, damit Linie über ganze Breite geht */
		margin-right: 80px;
		font-size: 11px;
		text-align: right;
	}

	:global(.page-header) {
		color: white;
		background: white;
		margin-left: 80px; /* Margin ausgleichen, damit Linie über ganze Breite geht */
		margin-right: 80px;
		font-size: 11px;
		text-align: left;
	}

	:global(.page-break) {
		color: white;
		background: #f0f0f0;
		text-transform: uppercase;
		user-select: none;
	}

	/* Hilfreich für die Sichtbarkeit von Absätzen */
	:global(.ProseMirror p) {
		margin-bottom: 1em;
	}

	/* Das Inline-Widget muss den Textfluss unterbrechen */
	:global(.inline-page-spacer) {
		display: block; /* Wichtig: Erzwingt einen Zeilenumbruch im Paragraphen */
		width: calc(100% + 80px); /* Breite anpassen, da es im Padding des p liegt */
		margin-left: -40px;
		margin-right: -40px;
		background: #525659;
		cursor: default;
		user-select: none;
		pointer-events: none;
		position: relative;
		vertical-align: baseline;
	}

	/* Verhindert, dass der Cursor direkt im Spacer landet */
	:global(.inline-page-spacer *) {
		pointer-events: none;
	}

	/* Styling für die Seitenzahl im Bruch */
	:global(.page-break-label) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #333;
		color: white;
		padding: 2px 10px;
		font-size: 10px;
		border-radius: 4px;
		white-space: nowrap;
	}
</style>
