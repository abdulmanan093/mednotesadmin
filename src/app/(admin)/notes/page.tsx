"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Eye, RefreshCw, Trash2, FileText, X } from "lucide-react";
import type { Note, NoteFormData, Block, Subject, Chapter } from "@/types";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import {
  getBlocks,
  getSubjects,
  getChapters,
  getNotes,
  uploadNote,
  replaceNote,
  deleteNote,
} from "@/lib/actions";

const fieldCls =
  "w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
const labelCls = "block text-xs font-medium text-foreground mb-1";

export default function NotesPage() {
  const [noteList, setNoteList] = useState<Note[]>([]);
  const [blockList, setBlockList] = useState<Block[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NoteFormData>({
    year: "1",
    blockId: "",
    subjectId: "",
    chapterId: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getBlocks(), getSubjects(), getChapters(), getNotes()]).then(
      ([blocks, subjects, chapters, notes]) => {
        setBlockList(
          blocks.map((b: { id: string; name: string; year: number }) => ({
            id: b.id,
            name: b.name,
            year: b.year,
          })),
        );
        setSubjectList(
          subjects.map(
            (s: {
              id: string;
              name: string;
              block_id: string;
              block_name: string;
            }) => ({
              id: s.id,
              name: s.name,
              blockId: s.block_id,
              blockName: s.block_name,
            }),
          ),
        );
        setChapterList(
          chapters.map(
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
            }),
          ),
        );
        setNoteList(
          notes.map(
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
            }),
          ),
        );
        setLoading(false);
      },
    );
  }, []);

  const yearBlocks = blockList.filter((b) => b.year === Number(form.year));
  const blockSubjects = subjectList.filter((s) => s.blockId === form.blockId);
  const subjectChapters = chapterList.filter(
    (c) => c.subjectId === form.subjectId,
  );

  const handleYearChange = (year: string) => {
    const first = blockList.find((b) => b.year === Number(year));
    setForm({ year, blockId: first?.id ?? "", subjectId: "", chapterId: "" });
  };
  const handleBlockChange = (blockId: string) =>
    setForm((p) => ({ ...p, blockId, subjectId: "", chapterId: "" }));
  const handleSubjectChange = (subjectId: string) =>
    setForm((p) => ({ ...p, subjectId, chapterId: "" }));

  const handleUpload = async () => {
    if (!selectedFile || !form.chapterId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("chapterId", form.chapterId);
      fd.append("subjectId", form.subjectId);
      fd.append("blockId", form.blockId);

      await uploadNote(fd);

      // Refresh notes list
      const notes = await getNotes();
      setNoteList(
        notes.map(
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
          }),
        ),
      );
      setSelectedFile(null);
      setForm({
        year: "1",
        blockId: blockList[0]?.id ?? "",
        subjectId: "",
        chapterId: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleReplace = (noteId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const fd = new FormData();
          fd.append("file", file);
          await replaceNote(noteId, fd);
          // Refresh
          const notes = await getNotes();
          setNoteList(
            notes.map(
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
              }),
            ),
          );
        } catch (err) {
          console.error(err);
        }
      }
    };
    input.click();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
      setNoteList((p) => p.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const filtered = noteList.filter(
    (n) =>
      n.chapterName.toLowerCase().includes(search.toLowerCase()) ||
      n.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      n.blockName.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading notes…
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Notes Management"
        description="Upload and manage PDF notes for chapters."
        action={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload Notes
          </button>
        }
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {[
                  "Chapter",
                  "Subject",
                  "Block",
                  "PDF File",
                  "Size",
                  "Upload Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  className="hover:bg-muted-hover transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                    {n.chapterName}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {n.subjectName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                      {n.blockName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-danger" />
                      <span className="text-xs font-mono text-muted-foreground">
                        {n.pdfFileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {n.fileSize ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {formatDate(n.uploadDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          if (n.pdfFileKey) {
                            window.open(
                              `/api/mobile/pdf?key=${encodeURIComponent(n.pdfFileKey)}`,
                              "_blank",
                            );
                          }
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-info-bg hover:text-info transition-colors"
                        title="View PDF"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleReplace(n.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-warning-bg hover:text-warning transition-colors"
                        title="Replace PDF"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(n.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-sm text-muted-foreground"
                  >
                    No notes found. Upload your first PDF to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
          {filtered.length} of {noteList.length} note
          {noteList.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedFile(null);
        }}
        title="Upload New PDF Notes"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>MBBS Year</label>
              <select
                value={form.year}
                onChange={(e) => handleYearChange(e.target.value)}
                className={fieldCls}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Block</label>
              <select
                value={form.blockId}
                onChange={(e) => handleBlockChange(e.target.value)}
                className={fieldCls}
              >
                <option value="">Select block…</option>
                {yearBlocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select
                value={form.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className={fieldCls}
                disabled={blockSubjects.length === 0}
              >
                <option value="">Select subject…</option>
                {blockSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Chapter</label>
              <select
                value={form.chapterId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, chapterId: e.target.value }))
                }
                className={fieldCls}
                disabled={subjectChapters.length === 0}
              >
                <option value="">Select chapter…</option>
                {subjectChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* File picker */}
          <div>
            <label className={labelCls}>PDF File</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary-subtle transition-colors group"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                  <FileText className="h-4 w-4 text-danger" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="ml-1 text-muted-foreground hover:text-danger transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a PDF file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 opacity-70">
                    Only .pdf files accepted
                  </p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !form.chapterId || uploading}
              className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />{" "}
              {uploading ? "Uploading…" : "Upload Notes"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedFile(null);
              }}
              className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Notes"
        message="This will permanently remove the PDF notes for this chapter. This cannot be undone."
        confirmLabel="Delete Notes"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
