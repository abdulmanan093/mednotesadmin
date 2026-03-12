"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Subject, SubjectFormData, Block } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import {
  getBlocks,
  getSubjects,
  getChapters,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/lib/actions";

const fieldCls =
  "w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
const labelCls = "block text-xs font-medium text-foreground mb-1";

export default function SubjectsPage() {
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [blockList, setBlockList] = useState<Block[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectFormData>({ name: "", blockId: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getBlocks(), getSubjects(), getChapters()]).then(
      ([blocks, subjects, chapters]) => {
        const mapped: Block[] = blocks.map(
          (b: { id: string; name: string; year: number }) => ({
            id: b.id,
            name: b.name,
            year: b.year,
          }),
        );
        setBlockList(mapped);
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
        const counts: Record<string, number> = {};
        chapters.forEach((c: { subject_id: string }) => {
          counts[c.subject_id] = (counts[c.subject_id] || 0) + 1;
        });
        setChapterCounts(counts);
        setLoading(false);
      },
    );
  }, []);

  const openAdd = () => {
    setForm({ name: "", blockId: blockList[0]?.id ?? "" });
    setEditTarget(null);
    setShowForm(true);
  };
  const openEdit = (s: Subject) => {
    setForm({ name: s.name, blockId: s.blockId });
    setEditTarget(s);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const block = blockList.find((b) => b.id === form.blockId);
      if (editTarget) {
        await updateSubject(editTarget.id, form.name, form.blockId);
        setSubjectList((prev) =>
          prev.map((s) =>
            s.id === editTarget.id
              ? {
                  ...s,
                  name: form.name,
                  blockId: form.blockId,
                  blockName: block?.name ?? "",
                }
              : s,
          ),
        );
      } else {
        const created = await createSubject(form.name, form.blockId);
        setSubjectList((prev) => [
          {
            id: created.id,
            name: form.name,
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
      await deleteSubject(id);
      setSubjectList((p) => p.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const filtered = subjectList.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.blockName.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading subjects…
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Subject Management"
        description="Manage subjects within blocks"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        }
      />

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search subjects or blocks…"
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
                {["Subject Name", "Block", "Chapters", "Actions"].map((h) => (
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
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-muted-hover transition-colors"
                >
                  <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                    {s.name}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs">
                      {s.blockName}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-primary-light text-primary-text rounded text-xs font-medium">
                      {chapterCounts[s.id] || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s.id)}
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
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
          {filtered.length} of {subjectList.length} subject
          {subjectList.length !== 1 ? "s" : ""}
        </div>
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Edit Subject" : "Add New Subject"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Subject Name</label>
            <input
              type="text"
              placeholder="e.g., Pathology"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>Block</label>
            <select
              value={form.blockId}
              onChange={(e) => setForm({ ...form, blockId: e.target.value })}
              className={fieldCls}
            >
              {blockList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Year {b.year})
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
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Subject"}
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
        title="Delete Subject"
        message="Are you sure you want to delete this subject? Chapters under it may be affected."
        confirmLabel="Delete Subject"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
