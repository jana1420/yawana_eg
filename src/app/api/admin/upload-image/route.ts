import { NextResponse } from "next/server";

import { getAdminSupabase } from "@/lib/admin";

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500KB

export async function POST(request: Request) {
  const { supabase, isAdmin } = await getAdminSupabase();

  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image is too large. Maximum size is 500KB." },
      { status: 400 },
    );
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filePath, arrayBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not upload image" },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(data.path);

  return NextResponse.json({ url: publicUrl }, { status: 200 });
}
