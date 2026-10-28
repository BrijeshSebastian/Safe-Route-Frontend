/**
 * Defensively extracts standard pagination metadata from various backend envelope flavors.
 * Supports:
 * - body.meta (standard SafeRoute backend root meta)
 * - body.meta.pagination
 * - body.pagination
 * - direct defaults
 */
export function readPagination(responseBody) {
  if (!responseBody || typeof responseBody !== 'object') {
    return {
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
    };
  }

  const source =
    responseBody.meta?.pagination ||
    responseBody.meta ||
    responseBody.pagination ||
    {};

  return {
    totalItems: Math.max(0, Number(source.totalItems ?? source.total ?? 0)),
    totalPages: Math.max(1, Number(source.totalPages ?? source.pages ?? 1)),
    currentPage: Math.max(1, Number(source.currentPage ?? source.page ?? 1)),
    itemsPerPage: Math.max(1, Number(source.itemsPerPage ?? source.limit ?? source.size ?? 10)),
  };
}

/**
 * Defensively extracts an array from a response body:
 * - If responseBody.data is an Array, returns it.
 * - If key is provided and responseBody.data?.[key] is an Array, returns it.
 * - If responseBody itself is an Array, returns it.
 * - Otherwise returns an empty array [].
 */
export function readList(responseBody, key = null) {
  if (!responseBody) return [];

  if (Array.isArray(responseBody)) return responseBody;

  const data = responseBody.data;
  if (Array.isArray(data)) return data;

  if (key && data && Array.isArray(data[key])) {
    return data[key];
  }

  // Fallback check if responseBody[key] is array
  if (key && Array.isArray(responseBody[key])) {
    return responseBody[key];
  }

  return [];
}
