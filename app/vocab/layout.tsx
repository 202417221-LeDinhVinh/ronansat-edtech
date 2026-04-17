import type { ReactNode } from "react";

import { VocabBoardProvider } from "@/components/vocab/VocabBoardProvider";

export default function VocabLayout({ children }: { children: ReactNode }) {
  return <VocabBoardProvider>{children}</VocabBoardProvider>;
}
