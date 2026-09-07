import { notFound } from "next/navigation";
import LayoutEditor from "@/components/LayoutEditor";

/**
 * Private tool for arranging the room. It only exists while running
 * `npm run dev` — a production build answers 404, so a deployed site never
 * carries the editor or the route that writes source files.
 */
export const metadata = { robots: { index: false, follow: false } };

export default function EditorPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <LayoutEditor />;
}
