import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Search,
  UserPlus,
  X,
} from 'lucide-react';

import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

import { useAdminUsers, useDisableUser } from '../../hooks/useAdmin';
import { useAuthStore } from '../../store/authStore';
import { readPagination, readList } from '../../lib/pagination';
import { formatDateTime, timeAgo } from '../../lib/format';
import {
  ROLES,
  ROLE_LABELS,
  RESPONDER_TYPE_LABELS,
} from '../../lib/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const UsersPage = () => {
  useDocumentTitle('User Directory');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentAdmin = useAuthStore((s) => s.user);

  // Read URL params
  const roleParam = searchParams.get('role') || '';
  const statusParam = searchParams.get('status') || ''; // 'active' | 'disabled'
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  // Debounced search state
  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== searchParam) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmed) {
              next.set('search', trimmed);
            } else {
              next.delete('search');
            }
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, searchParam, setSearchParams]);

  // Disable user dialog state
  const [userToDisable, setUserToDisable] = useState(null);
  const disableMutation = useDisableUser();

  // Query parameters mapping
  const queryParams = useMemo(() => {
    const p = {
      page: pageParam,
      size: 10,
    };
    if (roleParam) p.role = roleParam;
    if (statusParam === 'active') p.is_active = 'true';
    if (statusParam === 'disabled') p.is_active = 'false';
    if (searchParam) p.search = searchParam;
    return p;
  }, [pageParam, roleParam, statusParam, searchParam]);

  // Fetch users
  const { data, isLoading, isError, refetch } = useAdminUsers(queryParams);

  const users = useMemo(() => readList(data), [data]);
  const pagination = useMemo(() => readPagination(data), [data]);

  const handleFilterChange = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      },
      { replace: false }
    );
  };

  const handleConfirmDisable = async () => {
    if (!userToDisable) return;
    await disableMutation.mutateAsync(userToDisable.id);
    setUserToDisable(null);
  };

  const hasActiveFilters = Boolean(roleParam || statusParam || searchParam);

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'lavender';
      case ROLES.RESPONDER:
        return 'sky';
      default:
        return 'slate';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User & Responder Accounts"
        subtitle="Manage citizens, active responders, and administrative credentials"
        actions={
          <Button
            as={Link}
            to="/admin/responders/new"
            variant="primary"
            size="sm"
            icon={UserPlus}
          >
            Add responder
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Search Users
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search name, email, or phone…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Role
            </label>
            <Select
              value={roleParam}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              aria-label="Filter by role"
            >
              <option value="">All Roles</option>
              <option value={ROLES.REPORTER}>Reporters</option>
              <option value={ROLES.RESPONDER}>Responders</option>
              <option value={ROLES.ADMIN}>Administrators</option>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-1.5">
              Account Status
            </label>
            <Select
              value={statusParam}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              aria-label="Filter by account status"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs">
            <span className="text-ink-muted">Active filters applied</span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </Card>

      {/* Results Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load users"
          description="Failed to fetch user directory from admin API."
          onRetry={refetch}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match your filters"
          description={
            hasActiveFilters
              ? 'Try widening search keywords or changing selected role filters.'
              : 'No user accounts found.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-surface-card rounded-2xl border border-line shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface-page/60 border-b border-line text-xs font-semibold text-ink-muted uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role / Unit</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((user) => {
                  const isSelf = user.id === currentAdmin?.id;
                  const canDisable = !isSelf && user.is_active;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="hover:bg-surface-page/70 transition-colors cursor-pointer group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-ink group-hover:text-primary-600 block truncate">
                              {user.full_name}
                              {isSelf && (
                                <span className="ml-1.5 text-[11px] font-normal text-ink-muted">
                                  (You)
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-ink-muted">ID #{user.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role & Responder Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                          {user.responder_type && (
                            <Badge variant="peach" size="sm">
                              {RESPONDER_TYPE_LABELS[user.responder_type] || user.responder_type}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className="text-ink block truncate max-w-[180px]">{user.email}</span>
                        {user.phone && <span className="text-ink-muted block">{user.phone}</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.is_active ? (
                          <Badge variant="mint" size="sm">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="rose" size="sm">
                            Disabled
                          </Badge>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-xs text-ink-muted whitespace-nowrap">
                        <span>{formatDateTime(user.createdAt || user.created_at)}</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            as={Link}
                            to={`/admin/users/${user.id}`}
                            variant="secondary"
                            size="sm"
                          >
                            View
                          </Button>

                          {canDisable && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setUserToDisable(user)}
                              title="Disable user account"
                            >
                              Disable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => {
              const isSelf = user.id === currentAdmin?.id;
              const canDisable = !isSelf && user.is_active;

              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  className="p-4 bg-surface-card rounded-2xl border border-line shadow-xs active:bg-surface-page transition-colors cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm text-ink block truncate">
                          {user.full_name}
                          {isSelf && (
                            <span className="ml-1 text-xs font-normal text-ink-muted">(You)</span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                            {ROLE_LABELS[user.role] || user.role}
                          </Badge>
                          {user.responder_type && (
                            <Badge variant="peach" size="sm">
                              {RESPONDER_TYPE_LABELS[user.responder_type] || user.responder_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {user.is_active ? (
                      <Badge variant="mint" size="sm">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="rose" size="sm">
                        Disabled
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-ink-muted space-y-0.5">
                    <p className="truncate">{user.email}</p>
                    {user.phone && <p>{user.phone}</p>}
                  </div>

                  <div
                    className="flex items-center justify-between pt-2 border-t border-line text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-ink-muted">
                      Joined {timeAgo(user.createdAt || user.created_at)}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button as={Link} to={`/admin/users/${user.id}`} variant="secondary" size="sm">
                        View
                      </Button>
                      {canDisable && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setUserToDisable(user)}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Disable User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(userToDisable)}
        onClose={() => setUserToDisable(null)}
        title={`Disable account for ${userToDisable?.full_name}?`}
        message="This user will be signed out immediately and cannot log in."
        confirmLabel="Disable Account"
        tone="danger"
        onConfirm={handleConfirmDisable}
      />
    </div>
  );
};

export default UsersPage;
