import CoursesClient from "./CoursesClient";
import { getBlocks } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const blocks = await getBlocks();
  const mappedBlocks = blocks.map((b: { id: string; name: string; year: number }) => ({
    id: b.id,
    name: b.name,
    year: b.year,
  }));

  return <CoursesClient initialBlocks={mappedBlocks} />;
}
