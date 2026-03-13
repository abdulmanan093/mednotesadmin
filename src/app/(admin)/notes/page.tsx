import NotesClient from "./NotesClient";
import { getBlocks, getSubjects, getChapters, getNotes } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const [blocksData, subjectsData, chaptersData, notesData] = await Promise.all([
    getBlocks(),
    getSubjects(),
    getChapters(),
    getNotes(),
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

  const mappedNotes = notesData.map(
    (n: {
      id: string;
      chapter_id: string;
      chapter_name: string;
      subject_id: string;
      subject_name: string;
      block_id: string;
      block_name: string;
      pdf_file_name: string;
      pdf_file_key?: string;
      file_size?: string;
      upload_date: string;
    }) => ({
      id: n.id,
      chapterId: n.chapter_id,
      chapterName: n.chapter_name,
      subjectId: n.subject_id,
      subjectName: n.subject_name,
      blockId: n.block_id,
      blockName: n.block_name,
      pdfFileName: n.pdf_file_name,
      pdfFileKey: n.pdf_file_key,
      fileSize: n.file_size,
      uploadDate: n.upload_date,
    })
  );

  return (
    <NotesClient
      initialNotes={mappedNotes}
      initialBlocks={mappedBlocks}
      initialSubjects={mappedSubjects}
      initialChapters={mappedChapters}
    />
  );
}
