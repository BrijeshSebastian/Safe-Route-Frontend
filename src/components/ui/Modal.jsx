import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from './IconButton';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
  bodyClassName = '',
}) => {
  const modalRef = useRef(null);
  const triggerElementRef = useRef(null);

  // Scroll lock, Escape key handling, and focus return
  useEffect(() => {
    if (!isOpen) return;

    triggerElementRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }

      // Simple focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableEls = modalRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    // Initial focus on first element or modal container
    setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 flex justify-center items-center bg-ink/30 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Modal dialog'}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative z-[99999] w-full ${maxWidth} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] my-auto flex flex-col bg-surface-card rounded-2xl border border-line shadow-soft p-5 md:p-6 outline-none animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4 shrink-0">
          {title ? (
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
          ) : (
            <div />
          )}
          <IconButton
            icon={X}
            aria-label="Close dialog"
            variant="ghost"
            size="sm"
            onClick={onClose}
          />
        </div>
        <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 -mr-1 custom-scrollbar ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};

export default Modal;
