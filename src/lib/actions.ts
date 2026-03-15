"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { uploadToR2, deleteFromR2, getPresignedPutUrl } from "@/lib/r2";
import { revalidatePath } from "next/cache";

function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

async function safeLogActivity(params: {
  user_name: string;
  action: string;
  course_block?: string;
}) {
  try {
    await supabaseAdmin.from("activity_log").insert({
      user_name: params.user_name,
      action: params.action,
      course_block: params.course_block ?? "",
    });
  } catch {
    // activity logging must never break core admin actions
  }
}

// ─── BLOCKS ───────────────────────────────────────────────

export async function getBlocks() {
  const { data, error } = await supabaseAdmin
    .from("blocks")
    .select("*")
    .order("year")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createBlock(name: string, year: number) {
  const { data, error } = await supabaseAdmin
    .from("blocks")
    .insert({ name, year })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Block created",
    course_block: `${name} (Year ${year})`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function updateBlock(id: string, name: string, year: number) {
  const { data, error } = await supabaseAdmin
    .from("blocks")
    .update({ name, year })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Block updated",
    course_block: `${name} (Year ${year})`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function deleteBlock(id: string) {
  const { error } = await supabaseAdmin.from("blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Block deleted",
    course_block: id,
  });

  revalidatePath("/", "layout");
}

// ─── SUBJECTS ─────────────────────────────────────────────

export async function getSubjects() {
  const { data, error } = await supabaseAdmin
    .from("subjects_view")
    .select("*")
    .order("block_year")
    .order("block_name")
    .order("sort_order")
    .order("name");

  if (!error) return data;

  // If the view was created before `sort_order` existed, Postgres won't expose it
  // until the view is recreated (even if the table has the column).
  if (error.message.includes("sort_order")) {
    const { data: fallback, error: fallbackError } = await supabaseAdmin
      .from("subjects_view")
      .select("*")
      .order("block_year")
      .order("block_name")
      .order("name");
    if (fallbackError) throw new Error(fallbackError.message);
    return fallback;
  }

  throw new Error(error.message);
}

export async function createSubject(name: string, blockId: string) {
  // Place new subject at the end of this block
  const { data: last } = await supabaseAdmin
    .from("subjects")
    .select("sort_order")
    .eq("block_id", blockId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("subjects")
    .insert({ name, block_id: blockId, sort_order: nextOrder })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Subject created",
    course_block: name,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function updateSubject(id: string, name: string, blockId: string) {
  const { data, error } = await supabaseAdmin
    .from("subjects")
    .update({ name, block_id: blockId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Subject updated",
    course_block: name,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function deleteSubject(id: string) {
  const { error } = await supabaseAdmin.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Subject deleted",
    course_block: id,
  });

  revalidatePath("/", "layout");
}

export async function moveSubject(subjectId: string, direction: "up" | "down") {
  const { data: subject, error: subjectErr } = await supabaseAdmin
    .from("subjects")
    .select("id, block_id, sort_order, name")
    .eq("id", subjectId)
    .single();
  if (subjectErr) throw new Error(subjectErr.message);

  const { data: all, error: listErr } = await supabaseAdmin
    .from("subjects")
    .select("id, sort_order, name")
    .eq("block_id", subject.block_id)
    .order("sort_order")
    .order("name");
  if (listErr) throw new Error(listErr.message);

  const idx = (all ?? []).findIndex((s) => s.id === subjectId);
  if (idx === -1) return { moved: false };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= (all ?? []).length) return { moved: false };

  const a = all![idx];
  const b = all![swapIdx];

  const aOrder = a.sort_order ?? 0;
  const bOrder = b.sort_order ?? 0;

  const { error: updA } = await supabaseAdmin
    .from("subjects")
    .update({ sort_order: bOrder })
    .eq("id", a.id);
  if (updA) throw new Error(updA.message);

  const { error: updB } = await supabaseAdmin
    .from("subjects")
    .update({ sort_order: aOrder })
    .eq("id", b.id);
  if (updB) throw new Error(updB.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Subject order changed",
    course_block: subject.block_id,
  });

  revalidatePath("/", "layout");
  return { moved: true };
}

// ─── CHAPTERS ─────────────────────────────────────────────

export async function getChapters() {
  const { data, error } = await supabaseAdmin
    .from("chapters_view")
    .select("*")
    .order("block_year")
    .order("block_name")
    .order("subject_name")
    .order("sort_order")
    .order("name");

  if (!error) return data;

  // Same `table.*` view expansion issue as subjects_view.
  if (error.message.includes("sort_order")) {
    const { data: fallback, error: fallbackError } = await supabaseAdmin
      .from("chapters_view")
      .select("*")
      .order("block_year")
      .order("block_name")
      .order("subject_name")
      .order("name");
    if (fallbackError) throw new Error(fallbackError.message);
    return fallback;
  }

  throw new Error(error.message);
}

export async function createChapter(
  name: string,
  subjectId: string,
  blockId: string,
) {
  // Place new chapter at the end of this subject
  const { data: last } = await supabaseAdmin
    .from("chapters")
    .select("sort_order")
    .eq("subject_id", subjectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (last?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("chapters")
    .insert({
      name,
      subject_id: subjectId,
      block_id: blockId,
      sort_order: nextOrder,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Chapter created",
    course_block: name,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function updateChapter(
  id: string,
  name: string,
  subjectId: string,
  blockId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .update({ name, subject_id: subjectId, block_id: blockId })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Chapter updated",
    course_block: name,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function deleteChapter(id: string) {
  const { error } = await supabaseAdmin.from("chapters").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Chapter deleted",
    course_block: id,
  });

  revalidatePath("/", "layout");
}

export async function moveChapter(chapterId: string, direction: "up" | "down") {
  const { data: chapter, error: chapErr } = await supabaseAdmin
    .from("chapters")
    .select("id, subject_id, sort_order, name")
    .eq("id", chapterId)
    .single();
  if (chapErr) throw new Error(chapErr.message);

  const { data: all, error: listErr } = await supabaseAdmin
    .from("chapters")
    .select("id, sort_order, name")
    .eq("subject_id", chapter.subject_id)
    .order("sort_order")
    .order("name");
  if (listErr) throw new Error(listErr.message);

  const idx = (all ?? []).findIndex((c) => c.id === chapterId);
  if (idx === -1) return { moved: false };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= (all ?? []).length) return { moved: false };

  const a = all![idx];
  const b = all![swapIdx];

  const aOrder = a.sort_order ?? 0;
  const bOrder = b.sort_order ?? 0;

  const { error: updA } = await supabaseAdmin
    .from("chapters")
    .update({ sort_order: bOrder })
    .eq("id", a.id);
  if (updA) throw new Error(updA.message);

  const { error: updB } = await supabaseAdmin
    .from("chapters")
    .update({ sort_order: aOrder })
    .eq("id", b.id);
  if (updB) throw new Error(updB.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Chapter order changed",
    course_block: chapter.subject_id,
  });

  revalidatePath("/", "layout");
  return { moved: true };
}

// ─── NOTES ────────────────────────────────────────────────

export async function getNotes() {
  const { data, error } = await supabaseAdmin
    .from("notes_view")
    .select("*")
    .order("upload_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function uploadNote(formData: FormData) {
  const chapterId = formData.get("chapterId") as string;
  const subjectId = formData.get("subjectId") as string;
  const blockId = formData.get("blockId") as string;
  const file = formData.get("file") as File;

  if (!file || !chapterId || !subjectId || !blockId) {
    throw new Error("Missing required fields");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `notes/${blockId}/${subjectId}/${chapterId}/${file.name}`;
  const fileSize =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  // Upload to R2
  await uploadToR2(key, buffer, "application/pdf");

  // Save record in Supabase
  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      chapter_id: chapterId,
      subject_id: subjectId,
      block_id: blockId,
      pdf_file_name: file.name,
      pdf_file_key: key,
      file_size: fileSize,
      upload_date: new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Note uploaded",
    course_block: `${blockId} • ${file.name}`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function createNoteUploadUrl(params: {
  chapterId: string;
  subjectId: string;
  blockId: string;
  fileName: string;
  fileSizeBytes: number;
}) {
  if (
    !params.chapterId ||
    !params.subjectId ||
    !params.blockId ||
    !params.fileName
  ) {
    throw new Error("Missing required fields");
  }

  const key = `notes/${params.blockId}/${params.subjectId}/${params.chapterId}/${params.fileName}`;
  const uploadUrl = await getPresignedPutUrl({
    key,
    contentType: "application/pdf",
  });

  return {
    key,
    uploadUrl,
    pdf_file_name: params.fileName,
    file_size: formatFileSize(params.fileSizeBytes),
    upload_date: todayIsoDate(),
  };
}

export async function finalizeNoteUpload(params: {
  chapterId: string;
  subjectId: string;
  blockId: string;
  key: string;
  fileName: string;
  fileSizeBytes: number;
}) {
  if (!params.key || !params.fileName)
    throw new Error("Missing upload metadata");

  const { data, error } = await supabaseAdmin
    .from("notes")
    .insert({
      chapter_id: params.chapterId,
      subject_id: params.subjectId,
      block_id: params.blockId,
      pdf_file_name: params.fileName,
      pdf_file_key: params.key,
      file_size: formatFileSize(params.fileSizeBytes),
      upload_date: todayIsoDate(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Note uploaded",
    course_block: `${params.blockId} • ${params.fileName}`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function replaceNote(noteId: string, formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // Get existing note for its R2 key
  const { data: existing } = await supabaseAdmin
    .from("notes")
    .select("pdf_file_key, chapter_id, subject_id, block_id")
    .eq("id", noteId)
    .single();

  if (existing?.pdf_file_key) {
    try {
      await deleteFromR2(existing.pdf_file_key);
    } catch {
      /* old key may not exist */
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `notes/${existing?.block_id}/${existing?.subject_id}/${existing?.chapter_id}/${file.name}`;
  const fileSize =
    file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  await uploadToR2(key, buffer, "application/pdf");

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update({
      pdf_file_name: file.name,
      pdf_file_key: key,
      file_size: fileSize,
      upload_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", noteId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Note replaced",
    course_block: `${existing?.block_id ?? ""} • ${file.name}`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function createReplaceNoteUploadUrl(params: {
  noteId: string;
  fileName: string;
  fileSizeBytes: number;
}) {
  if (!params.noteId || !params.fileName)
    throw new Error("Missing required fields");

  const { data: existing, error } = await supabaseAdmin
    .from("notes")
    .select("chapter_id, subject_id, block_id")
    .eq("id", params.noteId)
    .single();
  if (error) throw new Error(error.message);

  const key = `notes/${existing.block_id}/${existing.subject_id}/${existing.chapter_id}/${params.fileName}`;
  const uploadUrl = await getPresignedPutUrl({
    key,
    contentType: "application/pdf",
  });

  return {
    key,
    uploadUrl,
    pdf_file_name: params.fileName,
    file_size: formatFileSize(params.fileSizeBytes),
    upload_date: todayIsoDate(),
  };
}

export async function finalizeReplaceNoteUpload(params: {
  noteId: string;
  key: string;
  fileName: string;
  fileSizeBytes: number;
}) {
  const { data: existing } = await supabaseAdmin
    .from("notes")
    .select("pdf_file_key, block_id")
    .eq("id", params.noteId)
    .single();

  if (existing?.pdf_file_key && existing.pdf_file_key !== params.key) {
    try {
      await deleteFromR2(existing.pdf_file_key);
    } catch {
      /* ok */
    }
  }

  const { data, error } = await supabaseAdmin
    .from("notes")
    .update({
      pdf_file_name: params.fileName,
      pdf_file_key: params.key,
      file_size: formatFileSize(params.fileSizeBytes),
      upload_date: todayIsoDate(),
    })
    .eq("id", params.noteId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Note replaced",
    course_block: `${existing?.block_id ?? ""} • ${params.fileName}`,
  });

  revalidatePath("/", "layout");
  return data;
}

export async function deleteNote(id: string) {
  // Delete R2 file first
  const { data: note } = await supabaseAdmin
    .from("notes")
    .select("pdf_file_key")
    .eq("id", id)
    .single();

  if (note?.pdf_file_key) {
    try {
      await deleteFromR2(note.pdf_file_key);
    } catch {
      /* ok */
    }
  }

  const { error } = await supabaseAdmin.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await safeLogActivity({
    user_name: "Admin",
    action: "Note deleted",
    course_block: id,
  });

  revalidatePath("/", "layout");
}

// ─── USERS ────────────────────────────────────────────────

export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from("users_view")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createUser(userData: {
  name: string;
  email: string;
  phone: string;
  university: string;
  mbbsYear: number;
  accessStart: string;
  accessEnd: string;
  blockIds: string[];
}) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .insert({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      university: userData.university,
      mbbs_year: userData.mbbsYear,
      access_start: userData.accessStart || null,
      access_end: userData.accessEnd || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Insert block assignments
  if (userData.blockIds.length > 0) {
    const rows = userData.blockIds.map((blockId) => ({
      user_id: user.id,
      block_id: blockId,
    }));
    const { error: ubError } = await supabaseAdmin
      .from("user_blocks")
      .insert(rows);
    if (ubError) throw new Error(ubError.message);
  }

  // Log activity
  await supabaseAdmin.from("activity_log").insert({
    user_name: userData.name,
    action: "Account created",
    course_block:
      userData.blockIds.length > 0
        ? `${userData.blockIds.length} blocks assigned`
        : "No blocks",
  });

  revalidatePath("/", "layout");
  return user;
}

export async function updateUser(
  id: string,
  userData: {
    name: string;
    email: string;
    phone: string;
    university: string;
    mbbsYear: number;
    accessStart: string;
    accessEnd: string;
    blockIds: string[];
  },
) {
  const { data: user, error } = await supabaseAdmin
    .from("users")
    .update({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      university: userData.university,
      mbbs_year: userData.mbbsYear,
      access_start: userData.accessStart || null,
      access_end: userData.accessEnd || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Replace block assignments
  await supabaseAdmin.from("user_blocks").delete().eq("user_id", id);
  if (userData.blockIds.length > 0) {
    const rows = userData.blockIds.map((blockId) => ({
      user_id: id,
      block_id: blockId,
    }));
    await supabaseAdmin.from("user_blocks").insert(rows);
  }

  revalidatePath("/", "layout");
  return user;
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function toggleUserStatus(id: string) {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("status, name")
    .eq("id", id)
    .single();

  const newStatus = user?.status === "Enabled" ? "Disabled" : "Enabled";

  const { data, error } = await supabaseAdmin
    .from("users")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin.from("activity_log").insert({
    user_name: user?.name ?? "Unknown",
    action: `Status changed to ${newStatus}`,
    course_block: "",
  });

  revalidatePath("/", "layout");
  return data;
}

export async function removeUserDevice(userId: string) {
  const { error } = await supabaseAdmin
    .from("devices")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ─── DASHBOARD ────────────────────────────────────────────

export async function getDashboardStats() {
  const { data, error } = await supabaseAdmin
    .from("dashboard_stats")
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRecentActivity() {
  const { data, error } = await supabaseAdmin
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}
