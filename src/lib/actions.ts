"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

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
  return data;
}

export async function deleteBlock(id: string) {
  const { error } = await supabaseAdmin.from("blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── SUBJECTS ─────────────────────────────────────────────

export async function getSubjects() {
  const { data, error } = await supabaseAdmin
    .from("subjects_view")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createSubject(name: string, blockId: string) {
  const { data, error } = await supabaseAdmin
    .from("subjects")
    .insert({ name, block_id: blockId })
    .select()
    .single();
  if (error) throw new Error(error.message);
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
  return data;
}

export async function deleteSubject(id: string) {
  const { error } = await supabaseAdmin.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── CHAPTERS ─────────────────────────────────────────────

export async function getChapters() {
  const { data, error } = await supabaseAdmin
    .from("chapters_view")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function createChapter(
  name: string,
  subjectId: string,
  blockId: string,
) {
  const { data, error } = await supabaseAdmin
    .from("chapters")
    .insert({ name, subject_id: subjectId, block_id: blockId })
    .select()
    .single();
  if (error) throw new Error(error.message);
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
  return data;
}

export async function deleteChapter(id: string) {
  const { error } = await supabaseAdmin.from("chapters").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

  return user;
}

export async function deleteUser(id: string) {
  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
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

  return data;
}

export async function removeUserDevice(userId: string) {
  const { error } = await supabaseAdmin
    .from("devices")
    .delete()
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
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
