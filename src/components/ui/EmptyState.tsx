import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  message: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 text-gray-300">{icon}</div>
      )}
      <p className="text-base font-medium text-gray-600">{message}</p>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
