import { Skeleton } from "./Skeleton";

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
