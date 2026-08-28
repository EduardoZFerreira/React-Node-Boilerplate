import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  function stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg" onClick={stopPropagation}>
        {children}
      </div>
    </div>
  );
}
