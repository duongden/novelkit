import * as Comlink from 'comlink';
import type { ChapterFile } from '@/features/chapter-splitter/utils/splitter';
import { parseLocalChapters, type LocalParseOptions } from './localChapters';

const api = {
  /** Chapter 1 as TTC numbers it, or null when the folder has none. Only it crosses back. */
  firstChapter(files: ChapterFile[], opts: LocalParseOptions) {
    return parseLocalChapters(files, opts).find(c => c.index === 1) ?? null;
  },
};

export type LocalChaptersWorkerApi = typeof api;

Comlink.expose(api);
