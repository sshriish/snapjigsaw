import { supabase } from './supabaseClient';

export interface SyncedPolaroid {
  id: string;
  imageUrl: string;
  imagePath: string;
  caption: string;
  date: string;
  frameStyle: string;
  shareSlug: string | null;
}

interface PolaroidRow {
  id: string;
  image_path: string;
  caption: string;
  frame_style: string;
  taken_at: string;
  share_slug: string | null;
}

function publicUrlFor(imagePath: string): string {
  const { data } = supabase.storage.from('polaroids').getPublicUrl(imagePath);
  return data.publicUrl;
}

function rowToSynced(row: PolaroidRow): SyncedPolaroid {
  return {
    id: row.id,
    imageUrl: publicUrlFor(row.image_path),
    imagePath: row.image_path,
    caption: row.caption,
    date: row.taken_at,
    frameStyle: row.frame_style,
    shareSlug: row.share_slug,
  };
}

/** Fetches every polaroid belonging to the given user, newest first. */
export async function fetchPolaroids(userId: string): Promise<SyncedPolaroid[]> {
  const { data, error } = await supabase
    .from('polaroids')
    .select('id, image_path, caption, frame_style, taken_at, share_slug')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToSynced);
}

/**
 * Uploads a data-URL image to storage and creates the corresponding row.
 * Returns the newly synced polaroid (with its real Storage-backed URL).
 */
export async function uploadPolaroid(
  userId: string,
  params: { dataUrl: string; caption: string; date: string; frameStyle: string }
): Promise<SyncedPolaroid> {
  const imagePath = `${userId}/${crypto.randomUUID()}.jpg`;
  const blob = await (await fetch(params.dataUrl)).blob();

  const { error: uploadError } = await supabase.storage
    .from('polaroids')
    .upload(imagePath, blob, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('polaroids')
    .insert({
      user_id: userId,
      image_path: imagePath,
      caption: params.caption,
      frame_style: params.frameStyle,
      taken_at: params.date,
    })
    .select('id, image_path, caption, frame_style, taken_at, share_slug')
    .single();

  if (insertError) throw insertError;
  return rowToSynced(data);
}

/** Deletes a polaroid row. (Storage cleanup is best-effort and non-blocking.) */
export async function deletePolaroid(id: string, imagePath?: string): Promise<void> {
  const { error } = await supabase.from('polaroids').delete().eq('id', id);
  if (error) throw error;

  if (imagePath) {
    void supabase.storage.from('polaroids').remove([imagePath]);
  }
}

/**
 * Ensures a polaroid has a share slug, generating one if needed, and
 * returns the full shareable URL.
 */
export async function getOrCreateShareLink(id: string, existingSlug: string | null): Promise<string> {
  const slug = existingSlug || crypto.randomUUID().slice(0, 8);

  if (!existingSlug) {
    const { error } = await supabase.from('polaroids').update({ share_slug: slug }).eq('id', id);
    if (error) throw error;
  }

  return `${window.location.origin}/share/${slug}`;
}

/** Fetches a single polaroid by its public share slug — no auth required. */
export async function fetchSharedPolaroid(slug: string): Promise<SyncedPolaroid | null> {
  const { data, error } = await supabase
    .from('polaroids')
    .select('id, image_path, caption, frame_style, taken_at, share_slug')
    .eq('share_slug', slug)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToSynced(data) : null;
}
