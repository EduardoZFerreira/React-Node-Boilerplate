import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { FormSkeleton } from "../../components/ui/FormSkeleton";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCreateItemMutation, useItemQuery, useUpdateItemMutation } from "../../queries/items";
import { ApiError } from "../../types/api";

export function ItemFormPage() {
  const { t } = useTranslation("items");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: existingItem, isLoading: isLoadingItem } = useItemQuery(id);
  const createMutation = useCreateItemMutation();
  const updateMutation = useUpdateItemMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingItem) {
      setTitle(existingItem.title);
      setDescription(existingItem.description ?? "");
      setIsActive(existingItem.isActive);
    }
  }, [existingItem]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError(t("form.validation.titleRequired"));
      return;
    }

    setError(null);
    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, input: { title, description: description || null, isActive } });
      } else {
        await createMutation.mutateAsync({ title, description: description || undefined });
      }
      navigate("/app/items");
    } catch (err) {
      const message = err instanceof ApiError ? err.errors.join(" ") : t("form.validation.titleRequired");
      setError(`${t("form.errorPrefix")}: ${message}`);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingItem) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <FormSkeleton fields={2} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">{isEdit ? t("form.editTitle") : t("form.createTitle")}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label={t("form.titleLabel")} htmlFor="title">
          <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={200} />
        </FormField>
        <FormField label={t("form.descriptionLabel")} htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </FormField>
        {isEdit ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            {t("form.activeLabel")}
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isEdit ? t("form.submitEdit") : t("form.submitCreate")}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/app/items")}>
            {t("form.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
