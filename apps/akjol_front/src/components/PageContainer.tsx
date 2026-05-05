import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-5xl mx-auto px-5 py-8 ${className}`}>{children}</div>;
}
