import { splitMultipleChapters, splitFilesByFirstLine, type ChapterFile } from '@/features/chapter-splitter/utils/splitter';
import type { AppSettings } from '@/features/settings/types';
import type { ParsedChapter } from '../types';

/** The per-book settings that decide how a local folder becomes numbered chapters. */
export interface LocalParseOptions {
  enableSplit: boolean;
  maxWords: number;
  minWords: number;
  roundUp: boolean;
  splitFromChapter: number;
  localSortMode: AppSettings['ttcUploader']['localSortMode'];
  fileFirstLineTitle: boolean;
  skipChapters: number;
}

export interface ChapterPriceOptions {
  chapterPrice: number;
  vipFromChapter: number;
  vipMinWords: number;
}

export function parseOptionsFromSettings(settings: AppSettings): LocalParseOptions {
  const { enableSplit, splitFromChapter, localSortMode, fileFirstLineTitle, skipChapters } = settings.ttcUploader;
  const { maxWords, minWords, roundUp } = settings.splitter;
  return { enableSplit, maxWords, minWords, roundUp, splitFromChapter, localSortMode, fileFirstLineTitle, skipChapters };
}

/**
 * Natural sort comparator for chapter titles.
 * Extracts leading number from "Chương X" pattern for numeric comparison,
 * falls back to locale string comparison for non-numeric titles.
 */
function naturalTitleSort(a: ParsedChapter, b: ParsedChapter): number {
  const numRegex = /chương\s+(\d+)/i;
  const matchA = a.title.match(numRegex);
  const matchB = b.title.match(numRegex);
  if (matchA && matchB) {
    const numA = parseInt(matchA[1], 10);
    const numB = parseInt(matchB[1], 10);
    if (numA !== numB) return numA - numB;
    // Same chapter number — compare full title numerically so part suffixes
    // like "(2/12)" sort before "(10/12)" instead of lexicographically.
    return a.title.localeCompare(b.title, 'vi', { numeric: true });
  }
  // Chapters with numbers come first
  if (matchA) return -1;
  if (matchB) return 1;
  return a.title.localeCompare(b.title, 'vi', { numeric: true });
}

/** Turn the .txt files of a folder into chapters numbered as they will be on TTC. */
export function parseLocalChapters(files: ChapterFile[], opts: LocalParseOptions): ParsedChapter[] {
  if (files.length === 0) return [];

  const skip = opts.skipChapters || 0;
  const actualMaxWords = opts.enableSplit ? opts.maxWords : Number.MAX_SAFE_INTEGER;
  const actualMinWords = opts.enableSplit ? opts.minWords : 0;

  let parsedChapters: ParsedChapter[];
  if (opts.localSortMode === 'file' && opts.fileFirstLineTitle) {
    // Each file is one chapter; its first non-empty line is the title.
    const result = splitFilesByFirstLine(files, actualMaxWords, opts.roundUp, actualMinWords, opts.splitFromChapter);
    parsedChapters = result.parts.map((part, index) => ({
      index: index + 1 + skip,
      title: part.title,
      content: part.content,
      word_count: part.wordCount,
      file_name: part.fileName,
    }));
  } else {
    // Concatenate all files and split on "Chương X" headings.
    // splitMultipleChapters handles duplicate title removal internally.
    const rawFolderText = files.map(f => f.text).join('\n\n');
    const result = splitMultipleChapters(rawFolderText, actualMaxWords, opts.roundUp, actualMinWords, opts.splitFromChapter);
    parsedChapters = result.parts.map((part, index) => ({
      index: index + 1 + skip,
      title: part.title || `Chương ${index + 1 + skip}`,
      content: part.content || part.text,
      word_count: part.wordCount,
      file_name: 'local_folder',
    }));
  }

  // Sort by chapter title (natural sort) if mode is 'name'
  if (opts.localSortMode === 'name') {
    parsedChapters.sort(naturalTitleSort);
    // Re-index after sorting
    parsedChapters = parsedChapters.map((ch, i) => ({ ...ch, index: i + 1 + skip }));
  }

  return parsedChapters;
}

/**
 * Price every chapter that qualifies, whether or not it is already on the web:
 * re-uploading an existing VIP chapter must keep it VIP.
 */
export function applyChapterPrices(chapters: ParsedChapter[], opts: ChapterPriceOptions): ParsedChapter[] {
  if (opts.chapterPrice <= 0) return chapters;
  return chapters.map(c => {
    // TTC only allows VIP from a certain chapter number on (c.index already includes skipChapters)
    if (opts.vipFromChapter > 0 && c.index < opts.vipFromChapter) return { ...c, price: 0 };
    // TTC rejects VIP on short chapters, so upload those free
    if (opts.vipMinWords > 0 && c.word_count < opts.vipMinWords) return { ...c, price: 0 };
    return { ...c, price: opts.chapterPrice };
  });
}
