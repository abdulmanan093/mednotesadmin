import SubjectsClient from "./SubjectsClient";
import { getBlocks, getSubjects, getChapters } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [blocksData, subjectsData, chaptersData] = await Promise.all([
    getBlocks(),
    getSubjects(),
    getChapters()
  ]);

  const mappedBlocks = blocksData.map(
    (b: { id: string; name: string; year: number }) => ({
      id: b.id,
      name: b.name,
      year: b.year,
    })
  );

  const mappedSubjects = subjectsData.map(
    (s: {
      id: string;
      name: string;
      block_id: string;
      block_name: string;
      sort_order?: number | null;
    }) => ({
      id: s.id,
      name: s.name,
      blockId: s.block_id,
      blockName: s.block_name,
      sortOrder: s.sort_order ?? 0,
    })
  );

  const counts: Record<string, number> = {};
  chaptersData.forEach((c: { subject_id: string }) => {
    counts[c.subject_id] = (counts[c.subject_id] || 0) + 1;
  });

  return (
    <SubjectsClient 
      initialSubjects={mappedSubjects}
      initialBlocks={mappedBlocks}
      initialChapterCounts={counts}
    />
  );
}
