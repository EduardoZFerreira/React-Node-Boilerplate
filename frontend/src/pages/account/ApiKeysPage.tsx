import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FormField } from "../../components/ui/FormField";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { TableSkeleton } from "../../components/ui/TableSkeleton";
import { useApiKeysQuery, useCreateApiKeyMutation, useRevokeApiKeyMutation } from "../../queries/apiKeys";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../types/api";
import { AVAILABLE_SCOPES, type ApiKey, type ApiKeyScope } from "../../types/apiKey";

type ModalState = "closed" | "form" | "success";
type KeyStatus = "active" | "revoked" | "expired";

function getKeyStatus(key: ApiKey): KeyStatus {
  if (!key.isActive) return "revoked";
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "expired";
  return "active";
}

const STATUS_BADGE_CLASSES: Record<KeyStatus, string> = {
  active: "bg-green-50 text-green-700",
  revoked: "bg-slate-100 text-slate-500",
  expired: "bg-amber-50 text-amber-700",
};

export function ApiKeysPage() {
  const { t, i18n } = useTranslation("account");
  const isAdmin = useAuthStore((state) => Boolean(state.user?.roles.includes("Admin")));
  // The 'admin' scope lets a key bypass item-ownership checks (see backend
  // ApiKeyService.create) — only offer it to users who actually hold the
  // Admin role; the backend rejects the request either way.
  const selectableScopes = isAdmin ? AVAILABLE_SCOPES : AVAILABLE_SCOPES.filter((scope) => scope !== "admin");
  const { data: keys, isLoading, isError } = useApiKeysQuery();
  const createMutation = useCreateApiKeyMutation();
  const revokeMutation = useRevokeApiKeyMutation();

  const [modalState, setModalState] = useState<ModalState>("closed");
  const [label, setLabel] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  function toggleScope(scope: ApiKeyScope) {
    setScopes((prev) => (prev.includes(scope) ? prev.filter((existing) => existing !== scope) : [...prev, scope]));
  }

  function openForm() {
    setLabel("");
    setScopes([]);
    setExpiresAt("");
    setFormError(null);
    setModalState("form");
  }

  function closeModal() {
    setModalState("closed");
    setRawKey(null);
    setCopied(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!label.trim()) {
      setFormError(t("apiKeys.form.validation.labelRequired"));
      return;
    }
    if (scopes.length === 0) {
      setFormError(t("apiKeys.form.validation.scopesRequired"));
      return;
    }

    setFormError(null);
    try {
      const result = await createMutation.mutateAsync({
        label,
        scopes,
        ...(expiresAt ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
      });
      setRawKey(result.rawKey);
      setModalState("success");
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("common:errors.generic");
      setFormError(`${t("apiKeys.form.errorPrefix")}: ${message}`);
    }
  }

  async function handleCopy() {
    if (!rawKey) return;
    try {
      await navigator.clipboard.writeText(rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — user can still select & copy manually.
    }
  }

  async function confirmRevoke() {
    if (!keyToRevoke) return;
    await revokeMutation.mutateAsync(keyToRevoke.id);
    setKeyToRevoke(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">{t("apiKeys.title")}</h1>
        <Button type="button" onClick={openForm}>
          {t("apiKeys.createButton")}
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : isError ? (
        <p className="text-red-600">{t("common:errors.generic")}</p>
      ) : keys && keys.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">{t("apiKeys.columns.label")}</th>
                <th className="px-4 py-3 font-medium">{t("apiKeys.columns.scopes")}</th>
                <th className="px-4 py-3 font-medium">{t("apiKeys.columns.expires")}</th>
                <th className="px-4 py-3 font-medium">{t("apiKeys.columns.status")}</th>
                <th className="px-4 py-3 font-medium">{t("apiKeys.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const status = getKeyStatus(key);
                return (
                  <tr key={key.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{key.label}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {key.expiresAt
                        ? new Date(key.expiresAt).toLocaleDateString(i18n.language)
                        : t("apiKeys.neverExpires")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}>
                        {t(`apiKeys.status.${status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {status === "active" ? (
                        <button
                          type="button"
                          onClick={() => setKeyToRevoke(key)}
                          className="text-red-600 hover:underline"
                        >
                          {t("apiKeys.revokeButton")}
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">{t("apiKeys.empty")}</p>
      )}

      <Modal open={modalState === "form"} onClose={closeModal}>
        <h2 className="text-lg font-semibold text-slate-900">{t("apiKeys.form.title")}</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <FormField label={t("apiKeys.form.labelLabel")} htmlFor="label">
            <Input
              id="label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder={t("apiKeys.form.labelPlaceholder")}
              maxLength={100}
              required
            />
          </FormField>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-slate-700">{t("apiKeys.form.scopesLabel")}</legend>
            {selectableScopes.map((scope) => (
              <label key={scope} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                {scope}
              </label>
            ))}
          </fieldset>
          <FormField label={t("apiKeys.form.expiresLabel")} htmlFor="expiresAt">
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </FormField>

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeModal} disabled={createMutation.isPending}>
              {t("apiKeys.form.cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {t("apiKeys.form.submit")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={modalState === "success"} onClose={closeModal}>
        <h2 className="text-lg font-semibold text-slate-900">{t("apiKeys.success.title")}</h2>
        <p className="mt-2 text-sm text-amber-700">{t("apiKeys.success.warning")}</p>
        <div className="mt-4 flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2">
          <code className="flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-800">{rawKey}</code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? t("apiKeys.success.copied") : t("apiKeys.success.copyButton")}
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={closeModal}>
            {t("apiKeys.success.doneButton")}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(keyToRevoke)}
        title={t("apiKeys.revokeConfirmTitle")}
        description={t("apiKeys.revokeConfirmDescription")}
        onConfirm={confirmRevoke}
        onCancel={() => setKeyToRevoke(null)}
        isConfirming={revokeMutation.isPending}
      />
    </div>
  );
}
