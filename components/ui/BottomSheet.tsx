"use client";

import type { ReactNode } from "react";
import { Modal } from "./Modal";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  /** Sticky action row at the bottom of the sheet. */
  footer?: ReactNode;
}

/**
 * A sheet that slides up on mobile (and is a centered dialog from 640px).
 * Use for pickers, filters and compact settings. For menus of actions use
 * `Menu`, which switches to a sheet on mobile automatically.
 */
export default function BottomSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  headerAction,
  footer,
}: BottomSheetProps) {
  return (
    <Modal open={isOpen} onClose={onClose} mobile="sheet" size="md">
      <Modal.Header title={title} description={description} actions={headerAction} />
      <Modal.Body className="px-3! py-3!">{children}</Modal.Body>
      {footer && <Modal.Footer>{footer}</Modal.Footer>}
    </Modal>
  );
}
