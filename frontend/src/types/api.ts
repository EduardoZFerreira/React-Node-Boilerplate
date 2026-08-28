export interface ApiEnvelope {
  hasError: boolean;
  errors: string[];
}

export type PaginatedEnvelope<TKey extends string, TItem> = ApiEnvelope & {
  [K in TKey]: TItem[];
} & {
  total: number;
  page: number;
  pages: number;
};

export class ApiError extends Error {
  status: number;
  errors: string[];

  constructor(status: number, errors: string[]) {
    super(errors[0] ?? "Something went wrong");
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
