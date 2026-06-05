import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <div
      className={[
        "bg-white rounded-xl shadow-sm border border-gray-100",
        className,
      ].join(" ")}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          {title && (
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
