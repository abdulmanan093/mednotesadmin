import UsersClient from "./UsersClient";
import type { DeviceInfo, User } from "@/types";
import { getUsers, getBlocks } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Helper to map DB row to frontend User type securely on Server
function mapDbUser(u: {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  mbbs_year: number;
  status: string;
  access_start: string;
  access_end: string;
  created_at: string;
  assigned_blocks: { id: string; name: string; year: number }[];
  device_info: DeviceInfo | null;
}): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    university: u.university || "",
    mbbsYear: u.mbbs_year,
    assignedBlocks: (u.assigned_blocks || []).map((b) => b.name),
    status: u.status as "Enabled" | "Disabled",
    accessStart: u.access_start || "",
    accessEnd: u.access_end || "",
    createdAt: u.created_at,
    deviceInfo: u.device_info || null,
    _blockIds: (u.assigned_blocks || []).map((b) => b.id),
  } as User & { _blockIds: string[] };
}

export default async function UsersPage() {
  const [usersData, blocksData] = await Promise.all([
    getUsers(),
    getBlocks()
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedUsers = usersData.map((u: any) => mapDbUser(u));
  
  const mappedBlocks = blocksData.map((b: { id: string; name: string; year: number }) => ({
    id: b.id,
    name: b.name,
    year: b.year,
  }));

  return <UsersClient initialUsers={mappedUsers} initialBlocks={mappedBlocks} />;
}
