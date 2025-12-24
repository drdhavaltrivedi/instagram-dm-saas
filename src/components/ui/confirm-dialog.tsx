'use client';

import { AlertTriangle } from 'lucide-react';
import { Dialog } from './dialog';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const variantStyles = {
    danger: 'text-error',
    warning: 'text-warning',
    default: 'text-foreground',
  };

  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-6">
        {/* Icon and Description */}
        <div className="flex items-start gap-4">
          {variant === 'danger' || variant === 'warning' ? (
            <div className={`flex-shrink-0 ${variantStyles[variant]}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
          ) : null}
          <p className="text-sm text-foreground-muted leading-relaxed flex-1">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

