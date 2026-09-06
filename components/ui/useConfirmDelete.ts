"use client";

import { useCallback, useRef, useState } from "react";

export function useConfirmDelete<T = void>(
  onConfirm: (target: T) => void | Promise<void>
) {
  const onConfirmRef = useRef(onConfirm);
  const [target, setTarget] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  onConfirmRef.current = onConfirm;

  const request = useCallback((item?: T) => {
    setTarget((item as T) ?? null);
    setIsOpen(true);
  }, []);

  const cancel = useCallback(() => {
    if (isDeleting) return;
    setIsOpen(false);
    setTarget(null);
  }, [isDeleting]);

  const confirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onConfirmRef.current(target as T);
      setIsOpen(false);
      setTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }, [target]);

  return {
    target,
    isOpen,
    isDeleting,
    request,
    cancel,
    confirm,
  };
}
