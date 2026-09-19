"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { AlertTriangle, HelpCircle, Trash2 } from "lucide-react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { CardIcon } from "./Card";
import { Field, Input } from "./Field";
import { Modal } from "./Modal";

export type ConfirmTone = "danger" | "warning" | "primary";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: ReactNode;
  itemName?: string;
  /** Caution line; defaults to "This action cannot be undone." except for `primary`. Pass `null` to hide. */
  warning?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Busy label while `onConfirm` runs. */
  confirmingLabel?: string;
  requireTypedConfirmation?: string;
  tone?: ConfirmTone;
  /** Controlled busy state; otherwise tracked from the `onConfirm` promise. */
  isDeleting?: boolean;
  confirmIcon?: ReactNode;
}

/**
 * Confirmation for consequential actions. `danger` for deletes, `warning`
 * for reversible-but-disruptive actions, `primary` for neutral confirms.
 * A sheet on mobile, a compact dialog on desktop. Enter confirms; focus
 * starts on Cancel so a stray Enter never destroys anything.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  warning,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmingLabel,
  requireTypedConfirmation,
  tone = "danger",
  isDeleting: isDeletingProp,
  confirmIcon,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [typedValue, setTypedValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [internalBusy, setInternalBusy] = useState(false);

  const isControlled = isDeletingProp !== undefined;
  const busy = isControlled ? isDeletingProp : internalBusy;
  const typedMatches =
    !requireTypedConfirmation || typedValue === requireTypedConfirmation;
  const canConfirm = typedMatches && !busy;

  const resolvedWarning =
    warning === undefined
      ? tone === "primary"
        ? null
        : "This action cannot be undone."
      : warning;
  const resolvedConfirmLabel =
    confirmLabel ?? (tone === "danger" ? "Delete" : "Confirm");
  const resolvedBusyLabel =
    confirmingLabel ?? (tone === "danger" ? "Deleting…" : "Working…");

  useEffect(() => {
    if (!isOpen) {
      setTypedValue("");
      setError(null);
      setInternalBusy(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setError(null);
    if (!isControlled) setInternalBusy(true);
    try {
      await onConfirm();
      if (!isControlled) onClose();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      if (!isControlled) setInternalBusy(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.shiftKey || !canConfirm) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    event.preventDefault();
    void handleConfirm();
  };

  const iconTone = tone === "danger" ? "error" : tone === "warning" ? "warning" : "primary";
  const HeaderIcon = tone === "primary" ? HelpCircle : AlertTriangle;

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="sm"
      mobile="sheet"
      role="alertdialog"
      dismissible={!busy}
      layer="nested"
      initialFocusRef={requireTypedConfirmation ? undefined : cancelRef}
    >
      <div onKeyDown={onKeyDown} className="contents">
        <Modal.Header
          title={title}
          icon={
            <CardIcon tone={iconTone}>
              <HeaderIcon />
            </CardIcon>
          }
        />
        <Modal.Body className="space-y-4">
          <div className="type-body">{description}</div>

          {itemName && (
            <div className="px-3 py-2.5 rounded-(--radius-control) bg-(--surface-elevated) border border-(--border)">
              <p className="type-label truncate">{itemName}</p>
            </div>
          )}

          {resolvedWarning && (
            <Alert tone={tone === "primary" ? "info" : tone === "danger" ? "error" : "warning"} size="sm">
              {resolvedWarning}
            </Alert>
          )}

          {requireTypedConfirmation && (
            <Field
              label={
                <>
                  Type <span className="type-time font-bold">{requireTypedConfirmation}</span> to confirm
                </>
              }
            >
              <Input
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={requireTypedConfirmation}
                disabled={busy}
                autoComplete="off"
                data-autofocus
              />
            </Field>
          )}

          {error && <Alert tone="error">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={handleClose}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            loading={busy}
            loadingText={resolvedBusyLabel}
            iconLeft={
              confirmIcon ??
              (tone === "danger" ? <Trash2 className="w-4 h-4" /> : undefined)
            }
          >
            {resolvedConfirmLabel}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}

export type ConfirmDeleteModalProps = Omit<ConfirmDialogProps, "tone"> & {
  tone?: "danger" | "warning";
};

/** Delete confirmation — the destructive preset of ConfirmDialog. */
export default function ConfirmDeleteModal(props: ConfirmDeleteModalProps) {
  return <ConfirmDialog tone="danger" {...props} />;
}
