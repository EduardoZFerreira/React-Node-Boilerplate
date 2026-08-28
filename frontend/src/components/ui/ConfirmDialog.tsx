import { useTranslation } from "react-i18next";

import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function ConfirmDialog({ open, title, description, onConfirm, onCancel, isConfirming }: ConfirmDialogProps) {
  const { t } = useTranslation("common");

  return (
    <Modal open={open} onClose={onCancel}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isConfirming}>
          {t("actions.cancel")}
        </Button>
        <Button type="button" onClick={onConfirm} disabled={isConfirming}>
          {t("actions.confirm")}
        </Button>
      </div>
    </Modal>
  );
}
