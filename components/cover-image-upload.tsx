"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { ARTICLE_COVER_DIMENSIONS_LABEL, ARTICLE_COVER_RATIO_LABEL, isRecommendedCoverRatio, MAX_COVER_IMAGE_BYTES } from "@/lib/article-metadata";

const MAX_IMAGE_BYTES = MAX_COVER_IMAGE_BYTES;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const acceptedExtensions = /\.(jpe?g|png|webp|svg)$/i;

type Props = { slug: string; value: string; onChange: (value: string) => void };
type UploadStatus = "idle" | "selecting" | "uploading" | "uploaded" | "error";

function errorForFile(file: File) {
  if (!acceptedTypes.has(file.type) || !acceptedExtensions.test(file.name)) return "Unsupported image. Choose a JPG, PNG, WEBP, or SVG file.";
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return "Images must be smaller than 5 MB.";
  return "";
}

export function CoverImageUpload({ slug, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [previewSrc, setPreviewSrc] = useState(value);
  const [imageFailed, setImageFailed] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [dimensions, setDimensions] = useState("");
  const [ratioWarning, setRatioWarning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => { setPreviewSrc(value); setImageFailed(false); if (!value) { setFileName(""); setFileSize(0); setDimensions(""); setRatioWarning(false); } }, [value]);
  useEffect(() => () => { if (typeof previewSrc === "string" && previewSrc.startsWith("blob:")) URL.revokeObjectURL(previewSrc); }, [previewSrc]);

  async function uploadFile(file: File) {
    const validationError = errorForFile(file);
    if (validationError) { setStatus("error"); setMessage(validationError); return; }
    if (!slug) { setStatus("error"); setMessage("Add a valid article slug before uploading a cover image."); return; }
    const localPreview = URL.createObjectURL(file);
    setPreviewSrc(localPreview); setFileName(file.name); setFileSize(file.size); setDimensions(""); setRatioWarning(false); setStatus("uploading"); setMessage("Uploading image…");
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.onerror = () => reject(new Error("The image could not be read from this device.")); reader.readAsDataURL(file); });
      const response = await fetch("/api/author/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, fileName: file.name, mimeType: file.type, size: file.size, contentBase64 }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The image could not be uploaded.");
      onChange(body.path); setPreviewSrc(body.path); setFileName(file.name); setFileSize(body.size || file.size); setStatus("uploaded"); setMessage(body.replaced ? "Image replaced and saved to the repository." : "Image uploaded and saved to the repository.");
    } catch (error) { setPreviewSrc(value); setFileName(""); setFileSize(0); setDimensions(""); setRatioWarning(false); setStatus("error"); setMessage(error instanceof Error ? error.message : "The image could not be uploaded."); }
  }

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) { setStatus("selecting"); void uploadFile(file); } event.target.value = ""; }
  function pasteImage(event: React.ClipboardEvent<HTMLDivElement>) { const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/")); if (file) { event.preventDefault(); setStatus("selecting"); void uploadFile(file); } }
  function applyUrl() {
    const candidate = url.trim();
    if (!candidate) return;
    try {
      const parsed = new URL(candidate, window.location.origin);
      if (parsed.protocol === "https:" && parsed.hostname !== window.location.hostname) { setStatus("error"); setMessage("External image URLs are not downloaded or enabled for production covers. Upload the image to the repository instead."); return; }
      if (!parsed.pathname.match(/\.(jpe?g|png|webp|svg)$/i) || !parsed.pathname.startsWith("/images/")) { setStatus("error"); setMessage("Use an existing repository image path under /images/ or upload the image from this device."); return; }
      onChange(parsed.pathname); setPreviewSrc(parsed.pathname); setFileName(parsed.pathname.split("/").pop() || "Existing image"); setFileSize(0); setDimensions(""); setRatioWarning(false); setStatus("uploaded"); setMessage("Existing repository image selected."); setUrl("");
    } catch { setStatus("error"); setMessage("Enter a valid image URL or repository image path."); }
  }
  function removeImage() { onChange(""); setPreviewSrc(""); setFileName(""); setFileSize(0); setDimensions(""); setRatioWarning(false); setStatus("idle"); setMessage("No cover image selected."); }
  const sizeLabel = fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : "";

  return <div className="cover-upload" onPaste={pasteImage} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) { setStatus("selecting"); void uploadFile(file); } }}>
    <div className={`cover-dropzone ${dragging ? "is-dragging" : ""} ${value ? "has-image" : ""}`} role="group" tabIndex={0} aria-label="Cover image upload area" onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); inputRef.current?.click(); } }}>
      {previewSrc ? <div className="cover-upload-preview">{imageFailed ? <div className="cover-upload-fallback"><ImagePlus size={20} aria-hidden="true" /><strong>Cover image unavailable</strong><span>The repository image could not be loaded.</span><button type="button" className="author-quiet-button cover-upload-button" onClick={() => inputRef.current?.click()}>Replace image</button></div> : <><Image src={previewSrc} alt="" fill sizes="(max-width: 900px) 100vw, 640px" unoptimized onLoad={(event) => { const image = event.currentTarget; setDimensions(`${image.naturalWidth} × ${image.naturalHeight}`); setRatioWarning(!isRecommendedCoverRatio(image.naturalWidth, image.naturalHeight)); }} onError={() => setImageFailed(true)} /><div className="cover-upload-overlay"><span>{status === "uploading" ? "Uploading image…" : status === "uploaded" ? "Image ready" : "Selected image"}</span></div></>}</div> : <div className="cover-upload-empty"><ImagePlus className="cover-upload-empty-icon" size={20} aria-hidden="true" /><strong>Upload a cover image</strong><span>Drag and drop, paste an image, or choose a file</span><button type="button" className="author-quiet-button cover-upload-button" onClick={() => inputRef.current?.click()} aria-label="Upload cover image"><UploadCloud size={14} aria-hidden="true" /> Upload image</button><small>Recommended: JPG · PNG · WEBP · {ARTICLE_COVER_DIMENSIONS_LABEL} · {ARTICLE_COVER_RATIO_LABEL} · max 5 MB</small></div>}
      <input ref={inputRef} className="cover-upload-input" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={chooseFile} aria-label="Choose cover image file" />
      {previewSrc && <button type="button" className="author-quiet-button cover-upload-button" onClick={() => inputRef.current?.click()} aria-label="Replace cover image"><UploadCloud size={14} aria-hidden="true" /> Replace</button>}
    </div>
    <div className="cover-upload-url"><span>OR</span><div><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Paste existing /images/ image URL" aria-label="Paste image URL" /><button type="button" className="author-quiet-button" onClick={applyUrl}>Use image</button></div><small>External URLs are not downloaded; repository-hosted images are recommended.</small></div>
    <div className="cover-upload-meta" aria-live="polite">{fileName && <span><strong>{fileName}</strong>{sizeLabel && ` · ${sizeLabel}`}{dimensions && ` · ${dimensions}`}</span>}{message && <span className={status === "error" ? "cover-upload-error" : status === "uploaded" ? "cover-upload-success" : ""}>{message}</span>}{ratioWarning && <span className="cover-upload-warning">Recommended ratio: {ARTICLE_COVER_RATIO_LABEL}. The image remains valid, but its framing may crop on some surfaces.</span>}</div>
    {value && <div className="cover-upload-actions"><button type="button" className="author-quiet-button" onClick={() => inputRef.current?.click()}><RefreshCw size={14} /> Replace</button><button type="button" className="author-danger-button" onClick={removeImage}><Trash2 size={14} /> Remove</button></div>}
  </div>;
}
