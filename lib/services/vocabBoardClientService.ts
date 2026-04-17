"use client";

import { API_PATHS } from "@/lib/apiPaths";
import { readThroughClientCache, setClientCache } from "@/lib/clientCache";
import {
  addVocabCardToBoard,
  emptyVocabBoard,
  isVocabBoardEmpty,
  normalizeVocabBoard,
  type VocabBoardState,
} from "@/lib/vocabBoard";

export const VOCAB_BOARD_CACHE_TTL_MS = 30 * 1000;

type UserIdentity = {
  userId?: string | null;
  userEmail?: string | null;
};

type AddVocabCardOutsideProviderInput = UserIdentity & {
  isAuthenticated: boolean;
  text: string;
  sourceQuestionId?: string;
  destination?: string;
};

export function getVocabBoardStorageKey(identity: UserIdentity) {
  const userKey = identity.userEmail || identity.userId || "guest";
  return `ronan-sat-vocab-board:${userKey}`;
}

export function getVocabBoardServerCacheKey(identity: UserIdentity) {
  return `vocab-board:${identity.userId ?? identity.userEmail ?? "guest"}`;
}

export async function fetchVocabBoardFromServer(cacheKey: string) {
  return readThroughClientCache(
    cacheKey,
    async () => {
      const response = await fetch(API_PATHS.USER_VOCAB_BOARD, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load vocab board: ${response.status}`);
      }

      const payload = (await response.json()) as { board?: unknown };
      return normalizeVocabBoard(payload.board);
    },
    { ttlMs: VOCAB_BOARD_CACHE_TTL_MS },
  );
}

export async function persistVocabBoardToServer(nextBoard: VocabBoardState) {
  const response = await fetch(API_PATHS.USER_VOCAB_BOARD, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ board: nextBoard }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save vocab board: ${response.status}`);
  }
}

export function readVocabBoardFromLocalStorage(storageKey: string) {
  if (typeof window === "undefined") {
    return emptyVocabBoard;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? normalizeVocabBoard(JSON.parse(raw)) : emptyVocabBoard;
  } catch {
    return emptyVocabBoard;
  }
}

export function writeVocabBoardToLocalStorage(storageKey: string, board: VocabBoardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(board));
}

export async function addVocabCardOutsideProvider(input: AddVocabCardOutsideProviderInput) {
  const identity = { userId: input.userId, userEmail: input.userEmail };
  const storageKey = getVocabBoardStorageKey(identity);
  const serverCacheKey = getVocabBoardServerCacheKey(identity);

  const currentBoard = input.isAuthenticated
    ? await getAuthenticatedBoard(storageKey, serverCacheKey)
    : readVocabBoardFromLocalStorage(storageKey);

  const result = addVocabCardToBoard(currentBoard, input.text, {
    sourceQuestionId: input.sourceQuestionId,
    destination: input.destination,
    idFactory: createStandaloneVocabId,
  });

  if (!result.changed) {
    return result.added;
  }

  if (!input.isAuthenticated) {
    writeVocabBoardToLocalStorage(storageKey, result.board);
    return result.added;
  }

  await persistVocabBoardToServer(result.board);
  setClientCache(serverCacheKey, result.board, VOCAB_BOARD_CACHE_TTL_MS);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(storageKey);
  }

  return result.added;
}

async function getAuthenticatedBoard(storageKey: string, serverCacheKey: string) {
  const serverBoard = await fetchVocabBoardFromServer(serverCacheKey);
  const localBoard = readVocabBoardFromLocalStorage(storageKey);

  if (!isVocabBoardEmpty(serverBoard)) {
    return serverBoard;
  }

  return localBoard;
}

function createStandaloneVocabId() {
  return `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
