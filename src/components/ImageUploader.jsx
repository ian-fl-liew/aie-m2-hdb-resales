import { useRef, useState } from "react";
import styles from "./ImageUploader.module.css";

const MAX_IMAGES = 5;

function ImageUploader({ images, onChange }) {
  const fileRef = useRef(null);
  const [urlInput, setUrlInput] = useState("");
  const [message, setMessage] = useState("");
  const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
  const isFull = remainingSlots === 0;

  const addImages = (newUrls) => {
    const cleaned = newUrls.map((u) => u.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    const accepted = cleaned.slice(0, remainingSlots);
    if (accepted.length > 0) onChange([...images, ...accepted]);
    setMessage(
      cleaned.length > accepted.length
        ? `You can upload up to ${MAX_IMAGES} images.`
        : "",
    );
  };

  const handleFiles = (files) => {
    if (isFull) {
      setMessage(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }
    const list = Array.from(files).slice(0, remainingSlots);
    const readers = list.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((dataUrls) => addImages(dataUrls));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    // reset so same file can be re-picked
    e.target.value = "";
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    // allow comma-separated URLs
    const parts = urlInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    addImages(parts);
    setUrlInput("");
  };

  const handleUrlKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  };

  const removeAt = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className={styles.grid}>
        {images.map((src, idx) => (
          <div key={`${src.slice(0, 20)}-${idx}`} className={styles.thumbWrap}>
            <img src={src} alt={`upload ${idx + 1}`} className={styles.thumb} />
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeAt(idx)}
              aria-label="Remove image"
            >
              ×
            </button>
            {idx === 0 && <span className={styles.coverBadge}>Cover</span>}
          </div>
        ))}
        <button
          type="button"
          className={styles.addTile}
          onClick={() => fileRef.current?.click()}
          disabled={isFull}
        >
          <span className={styles.plus}>+</span>
          <span>{isFull ? "Limit reached" : "Upload photos"}</span>
          <span className={styles.sub}>
            Limit {images.length} / {MAX_IMAGES} photos
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={isFull}
        hidden
      />

      <div className={styles.urlRow}>
        <input
          className={styles.urlInput}
          placeholder="Or paste image URL(s) — e.g. https://… , https://…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={handleUrlKeyDown}
        />
        <button type="button" className="filter-btn" onClick={handleAddUrl}>
          Add URL
        </button>
      </div>
      <p className={styles.hint}>
        First image is cover. Add up to {MAX_IMAGES} images via file picker or
        public URLs (comma-separated). Drag not required — click to upload.
      </p>
      {message && (
        <p className={styles.limitMessage} role="status">
          {message}
        </p>
      )}
    </div>
  );
}

export default ImageUploader;
