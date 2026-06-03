"use client";

import * as React from "react";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="container py-6 lg:py-8">{children}</div>;
}
