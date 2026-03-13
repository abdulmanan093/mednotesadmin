"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Block, BlockFormData } from "@/types";
import { ordinal } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { createBlock, updateBlock, deleteBlock } from "@/lib/actions";

const fieldCls =
  "w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
const labelCls = "block text-xs font-medium text-foreground mb-1";

export default function CoursesClient({ initialBlocks }: { initialBlocks: Block[] }) {
  const [blockList, setBlockList] = useState<Block[]>(initialBlocks);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Block | null>(null);
  const [form, setForm] = useState<BlockFormData>({ name: "", year: "1" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setForm({ name: "", year: "1" });
    setEditTarget(null);
    setShowForm(true);
  };
  const openEdit = (b: Block) => {
    setForm({ name: b.name, year: String(b.year) });
    setEditTarget(b);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editTarget) {
        // Optimistic
        setBlockList((prev) =>
          prev.map((b) =>
            b.id === editTarget.id
              ? { id: editTarget.id, name: form.name, year: Number(form.year) }
              : b,
          ),
        );
        setShowForm(false);
        const updated = await updateBlock(
          editTarget.id,
          form.name,
          Number(form.year),
        );
        // Correct any sync issues
        setBlockList((prev) =>
            prev.map((b) =>
              b.id === updated.id
                ? { id: updated.id, name: updated.name, year: updated.year }
                : b,
            ),
        );
      } else {
        const created = await createBlock(form.name, Number(form.year));
        setBlockList((prev) => [
          ...prev,
          { id: created.id, name: created.name, year: created.year },
        ]);
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      setBlockList((p) => p.filter((b) => b.id !== id));
      await deleteBlock(id);
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const years = [...new Set(blockList.map((b) => b.year))].sort();

  return (
    <div>
      <PageHeader
        title="Courses & Blocks"
        description="Manage course blocks by MBBS year"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Block
          </button>
        }
      />

      <div className="space-y-5">
        {years.map((year) => {
          const yearBlocks = blockList.filter((b) => b.year === year);
          return (
            <div
              key={year}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-border bg-muted">
                <h3 className="text-sm font-semibold text-foreground">
                  {ordinal(year)} Year MBBS
                </h3>
                <p className="text-xs text-muted-foreground">
                  {yearBlocks.length} block{yearBlocks.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {yearBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between border border-border rounded-lg px-4 py-3 hover:bg-muted-hover transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {block.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Year {block.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(block)}
                        className="p-1.5 rounded text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(block.id)}
                        className="p-1.5 rounded text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editTarget ? "Edit Block" : "Add New Block"}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Block Name</label>
            <input
              type="text"
              placeholder="e.g., Block 16"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldCls}
            />
          </div>
          <div>
            <label className={labelCls}>MBBS Year</label>
            <select
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className={fieldCls}
            >
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
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
              {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Block"}
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
        title="Delete Block"
        message="Are you sure you want to delete this block? This may affect subjects and chapters associated with it."
        confirmLabel="Delete Block"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
