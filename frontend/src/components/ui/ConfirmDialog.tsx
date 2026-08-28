import { useTranslation } from "react-i18next";

import { Button } from "./Button";

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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
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
      </div>
    </div>
  );
}
