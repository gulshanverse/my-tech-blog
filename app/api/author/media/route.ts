import { NextResponse } from "next/server";
import { hasAuthorSession } from "@/lib/author-auth";
import { getGithubFile, githubContentConfigured, writeGithubBase64File } from "@/lib/github-content";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imageTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
} as const;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(message: string, status = 400) { return NextResponse.json({ error: message }, { status }); }
function hasJpegHeader(bytes: Uint8Array) { return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff; }
function hasPngHeader(bytes: Uint8Array) { return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]); }
function hasWebpHeader(bytes: Uint8Array) { return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"; }
function safeSvg(bytes: Uint8Array) {
  const source = new TextDecoder().decode(bytes).trim();
  return source.startsWith("<svg") && !/<script|on[a-z]+\s*=|javascript:|<foreignObject/i.test(source);
}
function validImageContent(type: keyof typeof imageTypes, bytes: Uint8Array) {
  if (type === "image/jpeg") return hasJpegHeader(bytes);
  if (type === "image/png") return hasPngHeader(bytes);
  if (type === "image/webp") return hasWebpHeader(bytes);
  return safeSvg(bytes);
}

export async function POST(request: Request) {
  if (!(await hasAuthorSession())) return fail("Author Studio access is required.", 401);
  if (!githubContentConfigured()) return fail("GitHub publishing is not configured on the server. Add the required private environment variables before uploading images.", 503);
  try {
    const body = await request.json() as { slug?: string; fileName?: string; mimeType?: string; size?: number; contentBase64?: string };
    const slug = String(body.slug || "").trim().toLowerCase();
    const fileName = String(body.fileName || "").trim();
    const mimeType = body.mimeType as keyof typeof imageTypes;
    const size = Number(body.size || 0);
    const contentBase64 = String(body.contentBase64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!slugPattern.test(slug)) return fail("Enter a valid article slug before uploading a cover image.");
    if (!Object.prototype.hasOwnProperty.call(imageTypes, mimeType)) return fail("Unsupported image type. Use JPG, PNG, WEBP, or SVG.");
    const extension = imageTypes[mimeType];
    const originalExtension = fileName.toLowerCase().split(".").pop() || "";
    const allowedExtensions = extension === "jpg" ? ["jpg", "jpeg"] : [extension];
    if (!fileName || fileName.includes("/") || fileName.includes("\\") || !allowedExtensions.includes(originalExtension)) return fail("The filename extension does not match the selected image type.");
    if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES) return fail("Images must be smaller than 5 MB.");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64) || contentBase64.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 4) return fail("The uploaded image data is invalid.");
    const bytes = Buffer.from(contentBase64, "base64");
    if (bytes.length !== size || bytes.length > MAX_IMAGE_BYTES) return fail("The uploaded image size could not be verified.");
    if (!validImageContent(mimeType, bytes)) return fail("The file content does not match a supported image format.");
    const path = `public/images/articles/${slug}.${extension}`;
    const existing = await getGithubFile(path);
    const result = await writeGithubBase64File(path, contentBase64, `media: upload cover for ${slug}`, existing?.sha);
    return NextResponse.json({ ok: true, path: `/${path.replace(/^public\//, "")}`, filename: `${slug}.${extension}`, size: bytes.length, replaced: Boolean(existing), sha: result.sha });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "The image could not be uploaded.", 500);
  }
}
