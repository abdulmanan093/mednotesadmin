"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  Monitor,
  X,
} from "lucide-react";
import type { User, UserFormData, Block, DeviceInfo } from "@/types";
import { formatDate, ordinal } from "@/lib/utils";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  removeUserDevice,
} from "@/lib/actions";

const emptyForm: UserFormData = {
  name: "",
  email: "",
  phone: "",
  university: "",
  mbbsYear: "1",
  accessStart: "",
  accessEnd: "",
  selectedBlocks: [],
};

const fieldCls =
  "w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";
const labelCls = "block text-xs font-medium text-foreground mb-1";

// ─── Device Cell ──────────────────────────────────────────────
function DeviceCell({ user, onRemove }: { user: User; onRemove: () => void }) {
  const d = user.deviceInfo;

  if (!d) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground italic">
        <Monitor className="h-3 w-3" /> No device
      </span>
    );
  }

  const isIOS = d.platform === "iOS";

  return (
    <div className="flex items-start justify-between gap-2 group">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Smartphone
            className={`h-3 w-3 flex-shrink-0 ${isIOS ? "text-slate-500" : "text-success"}`}
          />
          <span className="text-xs font-medium text-foreground truncate">
            {d.model}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isIOS ? "bg-slate-100 text-slate-600" : "bg-success-bg text-success-text"}`}
          >
            {d.os}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Last seen {formatDate(d.lastSeen)}
        </p>
      </div>
      <button
        onClick={onRemove}
        title="Remove device (user will re-register on next login)"
        className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-danger hover:bg-danger-bg"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Device Detail Card ────────────────────────────────────────
function DeviceDetailSection({
  user,
  onRemove,
}: {
  user: User;
  onRemove: () => void;
}) {
  const d = user.deviceInfo;
  const isIOS = d?.platform === "iOS";

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Registered Device
        </span>
        {d && (
          <button
            onClick={onRemove}
            className="flex items-center gap-1 text-xs text-danger hover:text-red-700 font-medium transition-colors"
            title="Remove device — user can register new device on next login"
          >
            <X className="h-3 w-3" /> Remove Device
          </button>
        )}
      </div>

      {d ? (
        <div className="bg-muted rounded-xl p-4 flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg flex-shrink-0 ${isIOS ? "bg-slate-200 text-slate-600" : "bg-success-bg text-success"}`}
          >
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{d.model}</p>
            <p className="text-xs text-muted-foreground">
              {d.os} · {d.platform}
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span>
                Registered:{" "}
                <strong className="text-foreground">
                  {formatDate(d.registeredAt)}
                </strong>
              </span>
              <span>
                Last seen:{" "}
                <strong className="text-foreground">
                  {formatDate(d.lastSeen)}
                </strong>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted rounded-xl p-4 flex items-center gap-3 text-muted-foreground">
          <Monitor className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              No device registered
            </p>
            <p className="text-xs mt-0.5">
              The user will register their device on next login.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Page ────────────────────────────────────────────────
export default function UsersClient({
  initialUsers,
  initialBlocks,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialUsers: any[];
  initialBlocks: Block[];
}) {
  const [userList, setUserList] = useState<(User & { _blockIds?: string[] })[]>(
    initialUsers,
  );
  const blockList = initialBlocks;
  
  const [view, setView] = useState<"list" | "create" | "edit" | "detail">("list");
  const [selectedUser, setSelectedUser] = useState<
    (User & { _blockIds?: string[] }) | null
  >(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [removeDeviceTarget, setRemoveDeviceTarget] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const blocksByYear = [1, 2, 3, 4, 5].map((y) => ({
    year: y,
    blocks: blockList.filter((b) => b.year === y),
  }));

  const toggleBlock = (id: string) =>
    setForm((prev) => ({
      ...prev,
      selectedBlocks: prev.selectedBlocks.includes(id)
        ? prev.selectedBlocks.filter((b) => b !== id)
        : [...prev.selectedBlocks, id],
    }));

  const openCreate = () => {
    setForm(emptyForm);
    setView("create");
  };
  const openEdit = (u: User & { _blockIds?: string[] }) => {
    setSelectedUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone,
      university: u.university,
      mbbsYear: String(u.mbbsYear),
      accessStart: u.accessStart,
      accessEnd: u.accessEnd,
      selectedBlocks: u._blockIds || [],
    });
    setView("edit");
  };
  const openDetail = (u: User & { _blockIds?: string[] }) => {
    setSelectedUser(u);
    setView("detail");
  };

  const handleCreate = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      // Create user
      const createdUser = await createUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        university: form.university,
        mbbsYear: Number(form.mbbsYear),
        accessStart: form.accessStart,
        accessEnd: form.accessEnd,
        blockIds: form.selectedBlocks,
      });

      // Optimistic append
      const newUser = {
        id: createdUser.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        university: form.university,
        mbbsYear: Number(form.mbbsYear),
        assignedBlocks: form.selectedBlocks.map(
          (id) => blockList.find((b) => b.id === id)?.name || "Unknown Block",
        ),
        status: "Enabled" as const,
        accessStart: form.accessStart,
        accessEnd: form.accessEnd,
        createdAt: new Date().toISOString(),
        deviceInfo: null,
        _blockIds: form.selectedBlocks,
      };

      setUserList((prev) => [newUser, ...prev]);
      setView("list");
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      // Optimistic upate
      setUserList((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                name: form.name,
                email: form.email,
                phone: form.phone,
                university: form.university,
                mbbsYear: Number(form.mbbsYear),
                accessStart: form.accessStart,
                accessEnd: form.accessEnd,
                assignedBlocks: form.selectedBlocks.map(
                  (id) => blockList.find((b) => b.id === id)?.name || "Unknown Block",
                ),
                _blockIds: form.selectedBlocks,
              }
            : u,
        ),
      );

      setView("list");

      await updateUser(selectedUser.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        university: form.university,
        mbbsYear: Number(form.mbbsYear),
        accessStart: form.accessStart,
        accessEnd: form.accessEnd,
        blockIds: form.selectedBlocks,
      });

    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      setUserList((prev) => prev.filter((u) => u.id !== id));
      await deleteUser(id);
    } catch (err) {
      console.error(err);
    }
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      // Find the user to correctly toggle optimistically
      const targetUser = userList.find((u) => u.id === id);
      if (targetUser) {
        const optimisticStatus = targetUser.status === "Enabled" ? "Disabled" : "Enabled";
        setUserList((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: optimisticStatus } : u)),
        );
      }
      
      const updated = await toggleUserStatus(id);
      
      // Ensure sync
      setUserList((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: updated.status } : u)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveDevice = async (id: string) => {
    try {
      setUserList((prev) =>
        prev.map((u) => (u.id === id ? { ...u, deviceInfo: null } : u)),
      );
      if (selectedUser?.id === id)
        setSelectedUser((prev) =>
          prev ? { ...prev, deviceInfo: null } : prev,
        );
      await removeUserDevice(id);
    } catch (err) {
      console.error(err);
    }
    setRemoveDeviceTarget(null);
  };

  // ─── Form ──────────────────────────────────────────────────
  const renderForm = (mode: "create" | "edit") => (
    <div>
      <button
        onClick={() => setView("list")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>
      <PageHeader
        title={mode === "create" ? "Create User" : "Edit User"}
        description={
          mode === "create"
            ? "Add a new user to the platform"
            : "Update user information"
        }
      />
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            User Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>University</label>
              <input
                type="text"
                placeholder="University name"
                value={form.university}
                onChange={(e) =>
                  setForm({ ...form, university: e.target.value })
                }
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>MBBS Year</label>
              <select
                value={form.mbbsYear}
                onChange={(e) => setForm({ ...form, mbbsYear: e.target.value })}
                className={fieldCls}
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Block Access Assignment
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Select which blocks this user can access
          </p>
          <div className="space-y-2">
            {blocksByYear.map(({ year, blocks: yBlocks }) => (
              <div key={year} className="bg-muted rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-2">
                  {ordinal(year)} Year MBBS
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {yBlocks.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.selectedBlocks.includes(b.id)}
                        onChange={() => toggleBlock(b.id)}
                        className="accent-primary h-3.5 w-3.5"
                      />
                      <span className="text-xs text-foreground">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Access Duration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input
                type="date"
                value={form.accessStart}
                onChange={(e) =>
                  setForm({ ...form, accessStart: e.target.value })
                }
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input
                type="date"
                value={form.accessEnd}
                onChange={(e) =>
                  setForm({ ...form, accessEnd: e.target.value })
                }
                className={fieldCls}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2 border-t border-border">
          <button
            onClick={mode === "create" ? handleCreate : handleUpdate}
            disabled={saving}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Create User"
                : "Save Changes"}
          </button>
          <button
            onClick={() => setView("list")}
            className="px-5 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Detail ──────────────────────────────────────────────
  if (view === "create" || view === "edit") {
    return renderForm(view);
  }

  if (view === "detail" && selectedUser) {
    const u = selectedUser;
    return (
      <div>
        <button
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </button>
        <PageHeader
          title={u.name}
          description={`User details — MBBS Year ${u.mbbsYear}`}
        />
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {[
            ["Email", u.email],
            ["Phone", u.phone],
            ["University", u.university],
            ["Access Start", formatDate(u.accessStart)],
            ["Access End", formatDate(u.accessEnd)],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center gap-4 py-2 border-b border-border last:border-0"
            >
              <span className="w-32 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
              <span className="text-sm text-foreground">{value}</span>
            </div>
          ))}
          <div className="flex items-center gap-4 py-2 border-b border-border">
            <span className="w-32 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <StatusBadge status={u.status} />
          </div>
          <div className="py-2 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Assigned Blocks
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {u.assignedBlocks.map((b) => (
                <span
                  key={b}
                  className="px-2.5 py-1 text-xs font-medium bg-primary-light text-primary-text rounded-full flex items-center gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Device Info Section */}
          <DeviceDetailSection
            user={u}
            onRemove={() => setRemoveDeviceTarget(u.id)}
          />

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => openEdit(u)}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit User
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={!!removeDeviceTarget}
          title="Remove Registered Device"
          message="This will unlink the current device from this user's account. On their next login, they will automatically register a new device."
          confirmLabel="Remove Device"
          variant="warning"
          onConfirm={() =>
            removeDeviceTarget && handleRemoveDevice(removeDeviceTarget)
          }
          onCancel={() => setRemoveDeviceTarget(null)}
        />
      </div>
    );
  }

  // ─── List ────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create and manage user accounts"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" /> Create User
          </button>
        }
      />

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {[
                  "Name",
                  "Email",
                  "Year",
                  "Blocks",
                  "Device",
                  "Status",
                  "Access Ends",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {userList.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-muted-hover transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {u.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium text-foreground whitespace-nowrap">
                      Yr {u.mbbsYear}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-[160px]">
                    <div className="flex flex-wrap gap-1">
                      {u.assignedBlocks.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="px-1.5 py-0.5 bg-primary-light text-primary-text text-xs rounded whitespace-nowrap"
                        >
                          {b}
                        </span>
                      ))}
                      {u.assignedBlocks.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                          +{u.assignedBlocks.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Device column */}
                  <td className="px-4 py-3.5 min-w-[170px] max-w-[200px]">
                    <DeviceCell
                      user={u}
                      onRemove={() => setRemoveDeviceTarget(u.id)}
                    />
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(u.accessEnd)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDetail(u)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-primary-light hover:text-primary transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-warning-bg hover:text-warning transition-colors"
                        title="Toggle Status"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:bg-danger-bg hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {userList.length === 0 && (
                <tr>
                   <td
                    colSpan={8}
                    className="px-5 py-10 text-center text-sm text-muted-foreground"
                  >
                    No Users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          {userList.length} user{userList.length !== 1 ? "s" : ""} total
        </div>
      </div>

      {/* Delete user confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message="This will permanently remove the user and all their assignments. This action cannot be undone."
        confirmLabel="Delete User"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Remove device confirmation */}
      <ConfirmDialog
        open={!!removeDeviceTarget}
        title="Remove Registered Device"
        message="This will unlink the current device from this user's account. On their next login, they will automatically register a new device."
        confirmLabel="Remove Device"
        variant="warning"
        onConfirm={() =>
          removeDeviceTarget && handleRemoveDevice(removeDeviceTarget)
        }
        onCancel={() => setRemoveDeviceTarget(null)}
      />
    </div>
  );
}
