import { describe, it, expect } from 'vitest';
import { readPagination, readList } from '../lib/pagination';

describe('readPagination', () => {
  it('parses root meta object correctly', () => {
    const body = {
      meta: {
        totalItems: 42,
        totalPages: 5,
        currentPage: 2,
        itemsPerPage: 10,
      },
    };
    expect(readPagination(body)).toEqual({
      totalItems: 42,
      totalPages: 5,
      currentPage: 2,
      itemsPerPage: 10,
    });
  });

  it('parses nested meta.pagination object correctly', () => {
    const body = {
      meta: {
        pagination: {
          total: 100,
          pages: 10,
          page: 3,
          limit: 10,
        },
      },
    };
    expect(readPagination(body)).toEqual({
      totalItems: 100,
      totalPages: 10,
      currentPage: 3,
      itemsPerPage: 10,
    });
  });

  it('parses root pagination object correctly', () => {
    const body = {
      pagination: {
        totalItems: 25,
        totalPages: 3,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };
    expect(readPagination(body)).toEqual({
      totalItems: 25,
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
    });
  });

  it('returns safe fallback defaults for missing, null, or empty responses', () => {
    expect(readPagination(null)).toEqual({
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
    });

    expect(readPagination({})).toEqual({
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
    });
  });

  it('safely parses string numbers in metadata', () => {
    const body = {
      meta: {
        totalItems: '50',
        totalPages: '5',
        currentPage: '1',
        itemsPerPage: '10',
      },
    };
    expect(readPagination(body)).toEqual({
      totalItems: 50,
      totalPages: 5,
      currentPage: 1,
      itemsPerPage: 10,
    });
  });
});

describe('readList', () => {
  it('returns array directly when data is an array', () => {
    const body = { data: [{ id: 1 }, { id: 2 }] };
    expect(readList(body)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns array from nested data[key]', () => {
    const body = { data: { incidents: [{ id: 1 }] } };
    expect(readList(body, 'incidents')).toEqual([{ id: 1 }]);
  });

  it('returns array when body is itself an array', () => {
    const body = [{ id: 1 }, { id: 2 }];
    expect(readList(body)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('returns empty array when missing or null', () => {
    expect(readList(null)).toEqual([]);
    expect(readList({})).toEqual([]);
    expect(readList({ data: null })).toEqual([]);
  });
});
