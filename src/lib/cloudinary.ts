import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Best-effort cleanup of Cloudinary assets that are no longer referenced by
 * any listing. Never blocks the caller — a farmer removing a photo or
 * deleting a listing should succeed even if Cloudinary is unreachable; an
 * orphaned remote file is a cost problem, not a correctness one.
 *
 * Skips local seed placeholders (public_id "local:...") since those were
 * never uploaded to Cloudinary in the first place.
 */
export async function deleteCloudinaryImages(publicIds: string[]) {
  const real = publicIds.filter((id) => id && !id.startsWith('local:'));
  if (!real.length) return;

  try {
    await cloudinary.api.delete_resources(real);
  } catch (err) {
    console.error('Cloudinary cleanup failed for', real, err);
  }
}
