import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Users, User } from 'lucide-react';
import { User as UserType } from '../../types';

interface HunterSelectProps {
  id?: string;
  selectedHunterId: string;
  onChange: (hunterId: string) => void;
  users: UserType[];
  includeAllOption?: boolean;
  allLabel?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  labelPrefix?: string;
}

export const HunterSelect: React.FC<HunterSelectProps> = ({
  id = 'hunter-filter-select',
  selectedHunterId,
  onChange,
  users,
  includeAllOption = true,
  allLabel = 'Semua Hunter (Team BPC)',
  size = 'md',
  disabled = false,
  className = '',
  labelPrefix,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }
  };

  const selectedUser = users.find(u => u.id === selectedHunterId);

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id ? `${id}-btn` : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border border-theme bg-surface hover:bg-surface-alt transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${
          size === 'sm'
            ? 'px-2.5 py-1.5 text-xs'
            : 'px-3 py-2 text-xs sm:text-sm'
        } ${isOpen ? 'ring-2 ring-orange-500/30 border-orange-500' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {labelPrefix && (
            <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted shrink-0">
              {labelPrefix}
            </span>
          )}

          {selectedHunterId === 'ALL' ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-[10px] font-black shrink-0 border border-orange-500/20">
                👥
              </div>
              <span className="font-semibold text-theme truncate tracking-tight">
                {allLabel}
              </span>
            </div>
          ) : selectedUser ? (
            <div className="flex items-center gap-2 min-w-0">
              {selectedUser.avatarUrl ? (
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.displayName}
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-theme"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-surface-alt text-theme flex items-center justify-center text-[10px] font-bold shrink-0 border border-theme">
                  <User className="w-3 h-3 text-theme-muted" />
                </div>
              )}
              <span className="font-semibold text-theme truncate tracking-tight">
                {selectedUser.displayName}
              </span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-surface-alt text-theme-secondary border border-theme shrink-0 hidden sm:inline-block">
                {selectedUser.role}
              </span>
            </div>
          ) : (
            <span className="font-semibold text-theme truncate">
              Pilih Hunter...
            </span>
          )}
        </div>

        {/* Dropdown Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-theme-secondary shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          id={id ? `${id}-menu` : undefined}
          className="absolute left-0 mt-1.5 w-64 max-h-72 overflow-y-auto rounded-2xl bg-surface border border-theme shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Option: ALL HUNTERS */}
          {includeAllOption && (
            <button
              type="button"
              role="option"
              aria-selected={selectedHunterId === 'ALL'}
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                selectedHunterId === 'ALL'
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                  : 'text-theme hover:bg-surface-alt font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-black shrink-0 border border-orange-500/20">
                  👥
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-theme leading-tight">
                    {allLabel}
                  </div>
                  <div className="text-[10px] text-theme-muted font-normal">
                    Seluruh tim operasional BPC
                  </div>
                </div>
              </div>

              {selectedHunterId === 'ALL' && (
                <Check className="w-4 h-4 text-orange-500 shrink-0" />
              )}
            </button>
          )}

          {/* Section Divider */}
          {includeAllOption && users.length > 0 && (
            <div className="border-t border-theme my-1" />
          )}

          {/* Individual Hunters List */}
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-theme-muted">
            Daftar Hunter ({users.length})
          </div>

          {users.map(u => {
            const isSelected = selectedHunterId === u.id;
            return (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(u.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/30'
                    : 'text-theme hover:bg-surface-alt font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-theme"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-alt text-theme flex items-center justify-center text-xs font-bold shrink-0 border border-theme">
                      <User className="w-3.5 h-3.5 text-theme-muted" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate font-semibold text-theme leading-tight">
                      {u.displayName}
                    </div>
                    <div className="text-[10px] text-theme-muted font-mono flex items-center gap-1.5">
                      <span>@{u.username}</span>
                      <span>•</span>
                      <span className="uppercase">{u.role}</span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-orange-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Accessible native select fallback for automation / test helpers */}
      <select
        id={id}
        value={selectedHunterId}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      >
        {includeAllOption && <option value="ALL">{allLabel}</option>}
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};
