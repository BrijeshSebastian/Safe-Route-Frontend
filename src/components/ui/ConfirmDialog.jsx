import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm?.();
      onClose?.();
    } catch (err) {
      console.error('Confirmation action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? undefined : onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-sm text-ink-soft leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line sticky bottom-0 bg-surface-card py-1 -mb-1 z-10">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
