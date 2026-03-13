import ChaptersClient from "./ChaptersClient";
import { getBlocks, getSubjects, getChapters } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ChaptersPage() {
  const [blocksData, subjectsData, chaptersData] = await Promise.all([
    getBlocks(),
    getSubjects(),
    getChapters(),
  ]);

  const mappedBlocks = blocksData.map((b: { id: string; name: string; year: number }) => ({
    id: b.id,
    name: b.name,
    year: b.year,
  }));

  const mappedSubjects = subjectsData.map(
    (s: { id: string; name: string; block_id: string; block_name: string }) => ({
      id: s.id,
      name: s.name,
      blockId: s.block_id,
      blockName: s.block_name,
    })
  );

  const mappedChapters = chaptersData.map(
    (c: {
      id: string;
      name: string;
      subject_id: string;
      subject_name: string;
      block_id: string;
      block_name: string;
    }) => ({
      id: c.id,
      name: c.name,
      subjectId: c.subject_id,
      subjectName: c.subject_name,
      blockId: c.block_id,
      blockName: c.block_name,
    })
  );

  return (
    <ChaptersClient
      initialChapters={mappedChapters}
      initialBlocks={mappedBlocks}
      initialSubjects={mappedSubjects}
    />
  );
}
