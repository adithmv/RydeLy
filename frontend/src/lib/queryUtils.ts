import { UseQueryResult } from "@tanstack/react-query";

/**
 * Safely get array data from a query result.
 * Returns empty array if data is not an array (e.g., undefined, error object, etc.)
 */
export function getQueryArray<T>(query: UseQueryResult<T[], Error>): T[] {
  return Array.isArray(query.data) ? query.data : [];
}

/**
 * Safely get a single item from a query result by predicate.
 * Returns undefined if data is not an array or item not found.
 */
export function findQueryItem<T>(
  query: UseQueryResult<T[], Error>,
  predicate: (item: T) => boolean
): T | undefined {
  const arr = getQueryArray(query);
  return arr.find(predicate);
}

/**
 * Check if query has valid array data.
 */
export function hasQueryData<T>(query: UseQueryResult<T[], Error>): boolean {
  return Array.isArray(query.data) && query.data.length > 0;
}