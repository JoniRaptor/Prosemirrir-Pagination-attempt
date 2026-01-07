// lib/editor/pagination-utils.ts

export const A4_HEIGHT_PX = 1122; // ca. 297mm
export const PAGE_GAP = 20; // Abstand zwischen Seiten in der Ansicht
export const PAGE_MARGIN = 40; // Innerer Rand der Seite

export interface CrossingResult {
	isCrossing: boolean;
	startPage: number;
	endPage: number;
}

export const isNodeCrossing = (offsetTop: number, offsetBottom: number): CrossingResult => {
	const pageHeightWithGap = A4_HEIGHT_PX + PAGE_GAP;
	const startPage = Math.floor(offsetTop / pageHeightWithGap);
	const endPage = Math.floor(offsetBottom / pageHeightWithGap);
	// console.log("startPage: ", startPage);
	// console.log("endPage: ", endPage);

	// Ende des Inhaltsbereichs der aktuellen Seite
	const contentEnd = startPage * pageHeightWithGap + A4_HEIGHT_PX - PAGE_MARGIN;

	const isCrossing = offsetTop > contentEnd || offsetBottom > contentEnd || startPage !== endPage;

	return { isCrossing, startPage, endPage };
};
