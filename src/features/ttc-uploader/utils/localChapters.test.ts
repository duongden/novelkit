import { describe, it, expect } from 'vitest';
import { applyChapterPrices, parseLocalChapters, type LocalParseOptions } from './localChapters';
import type { ParsedChapter } from '../types';

const OPTS: LocalParseOptions = {
  enableSplit: false,
  maxWords: 1700,
  minWords: 1000,
  roundUp: false,
  splitFromChapter: 1,
  localSortMode: 'name',
  fileFirstLineTitle: false,
  skipChapters: 0,
};

const FILES = [
  { name: '2.txt', text: 'Chương 2: Hai\n\nNội dung hai' },
  { name: '1.txt', text: 'Chương 1: Một\n\nNội dung một' },
];

describe('parseLocalChapters', () => {
  it('numbers chapters by title in name mode', () => {
    const chapters = parseLocalChapters(FILES, OPTS);
    expect(chapters.map(c => [c.index, c.title])).toEqual([
      [1, 'Chương 1: Một'],
      [2, 'Chương 2: Hai'],
    ]);
  });

  it('starts numbering after the skipped chapters', () => {
    const chapters = parseLocalChapters(FILES, { ...OPTS, skipChapters: 10 });
    expect(chapters.map(c => c.index)).toEqual([11, 12]);
  });

  it('returns nothing for an empty folder', () => {
    expect(parseLocalChapters([], OPTS)).toEqual([]);
  });
});

describe('applyChapterPrices', () => {
  const ch = (index: number, word_count: number): ParsedChapter => ({
    index, word_count, title: `Chương ${index}`, content: '', file_name: '',
  });

  it('leaves chapters untouched when nothing is priced', () => {
    const chapters = [ch(1, 2000)];
    expect(applyChapterPrices(chapters, { chapterPrice: 0, vipFromChapter: 51, vipMinWords: 1450 })).toBe(chapters);
  });

  it('keeps early and short chapters free', () => {
    const priced = applyChapterPrices([ch(1, 2000), ch(60, 1000), ch(61, 2000)], {
      chapterPrice: 5, vipFromChapter: 51, vipMinWords: 1450,
    });
    expect(priced.map(c => c.price)).toEqual([0, 0, 5]);
  });
});
