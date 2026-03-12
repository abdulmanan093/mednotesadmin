"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import type { Chapter, ChapterFormData, Block, Subject } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import {
  getBlocks,
  getSubjects,
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
} from "@/lib/actions";

const fieldCls =
  "w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
const labelCls = "block text-xs font-medium text-foreground mb-1";

export default function ChaptersPage() {
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [blockList, setBlockList] = useState<Block[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Chapter | null>(null);
  const [form, setForm] = useState<ChapterFormData>({
    name: "",
    subjectId: "",
    blockId: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getBlocks(), getSubjects(), getChapters()]).then(
      ([blocks, subjects, chapters]) => {
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
        setLoading(false);
      },
    );
  }, []);

  const filteredSubjects = subjectList.filter(
    (s) => s.blockId === form.blockId,
  );

  const openAdd = () => {
    setForm({ name: "", blockId: blockList[0]?.id ?? "", subjectId: "" });
    setEditTarget(null);
    setShowForm(true);
  };
  const openEdit = (c: Chapter) => {
    setForm({ name: c.name, subjectId: c.subjectId, blockId: c.blockId });
    setEditTarget(c);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subjectId) return;
    setSaving(true);
    try {
      const subject = subjectList.find((s) => s.id === form.subjectId);
      const block = blockList.find((b) => b.id === form.blockId);
      if (editTarget) {
        await updateChapter(
          editTarget.id,
          form.name,
          form.subjectId,
          form.blockId,
        );
        setChapterList((prev) =>
          prev.map((c) =>
            c.id === editTarget.id
              ? {
                  ...c,
                  name: form.name,
                  subjectId: form.subjectId,
                  subjectName: subject?.name ?? "",
                  blockId: form.blockId,
                  blockName: block?.name ?? "",
                }
              : c,
          ),
        );
      } else {
        const created = await createChapter(
          form.name,
          form.subjectId,
          form.blockId,
        );
        setChapterList((prev) => [
          {
            id: created.id,
            name: form.name,
            subjectId: form.subjectId,
            subjectName: subject?.name ?? "",
            blockId: form.blockId,
            blockName: block?.name ?? "",
          },
          ...prev,
        ]);
      }
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChapter(id);
      setChapterList((p) => p.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const filtered = chapterList.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      c.blockName.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading chapters…
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Chapter Management"
        description="Manage chapters within subjects"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Chapter
          </button>
        }
      />
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search chapters, subjects, blocks…"
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
                {["Chapter Name", "Subject", "Block", "Actions"].map((h) => (
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
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted-hover transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {c.name}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {c.subjectName}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">
                      {c.blockName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
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
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No chapters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
          {filtered.length} of {chapterList.length} chapter
          {chapterList.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Edit Chapter" : "Add New Chapter"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Chapter Name</label>
            <input
              type="text"
              placeholder="e.g., Upper Limb Anatomy"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>Block</label>
            <select
              value={form.blockId}
              onChange={(e) =>
                setForm({ ...form, blockId: e.target.value, subjectId: "" })
              }
              className={fieldCls}
            >
              {blockList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Year {b.year})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <select
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
              className={fieldCls}
              disabled={filteredSubjects.length === 0}
            >
              <option value="">Select subject…</option>
              {filteredSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Chapter"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter? PDF notes linked to it may be affected."
        confirmLabel="Delete Chapter"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
