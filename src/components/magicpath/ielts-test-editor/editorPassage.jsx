import React, { useState, useEffect, useRef } from "react";
import { message, Upload } from "antd";
import { StackedButton, inputCls } from "./editorUI";
import {
  getPartByIdAPI,
  createPassageAPI,
  updatePassageAPI,
} from "@/services/apiTest";
import { useParts } from "./partsContext";

export function PassageEditor({ onChange }) {
  const { parts, activePartId, setActivePartId, refreshParts, getPartDetail } =
    useParts();

  const [passage, setPassage] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [loadingPart, setLoadingPart] = useState(false);
  const [saving, setSaving] = useState(false);

  // Keep latest onChange in a ref so the fetch effect doesn't refire
  // every parent render (which previously reset title/content to "" and
  // wiped any unsaved user input as soon as the parent re-rendered).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Cache loaded passages by part id so switching tabs and coming back
  // doesn't re-fetch and clobber the form with empty strings when the
  // API response is briefly missing the passage field.
  const cacheRef = useRef({});

  useEffect(() => {
    if (!activePartId) {
      setPassage(null);
      setTitle("");
      setContent("");
      setImageUrl(null);
      return;
    }
    // If we already loaded this part in this session, restore from cache
    // so the form doesn't flash empty / re-fetch.
    const cached = cacheRef.current[activePartId];
    if (cached) {
      setPassage(cached.passage);
      setTitle(cached.title);
      setContent(cached.content);
      setImageUrl(cached.imageUrl);
    }
    let cancelled = false;
    (async () => {
      setLoadingPart(true);
      try {
        const detail = await getPartDetail(activePartId);
        if (cancelled) return;
        const p = detail?.passage || detail?.passages?.[0] || null;
        // Only overwrite form fields if we have a passage, or if cache
        // was empty (avoids wiping a freshly-typed title while a slow
        // request is in flight).
        if (p || !cached) {
          setPassage(p);
          setTitle(p?.title || "");
          setContent(p?.content || "");
          setImageUrl(p?.imageUrl || p?.image || null);
        }
        cacheRef.current[activePartId] = {
          passage: p,
          title: p?.title || "",
          content: p?.content || "",
          imageUrl: p?.imageUrl || p?.image || null,
        };
        onChangeRef.current?.({
          activePartId,
          hasPassage: !!p,
          wordCount: (p?.content || "").split(/\s+/).filter(Boolean).length,
        });
      } catch {
        if (cancelled) return;
        if (!cached) {
          setPassage(null);
          setTitle("");
          setContent("");
          setImageUrl(null);
        }
      } finally {
        if (!cancelled) setLoadingPart(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePartId, getPartDetail]);

  // FE-12b: revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));
  // Count paragraphs: split on blank lines OR single newlines, take max
  const numberParagraph =
    Math.max(
      content.split(/\n{2,}/).filter((p) => p.trim()).length,
      content.split("\n").filter((p) => p.trim()).length,
      1
    );

  const handleSave = async () => {
    if (!activePartId) return;
    if (!title.trim()) {
      message.warning("Enter passage title");
      return;
    }
    if (!content.trim()) {
      message.warning("Enter passage content");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        idPart: activePartId,
        title,
        content,
        numberParagraph,
      };
      if (imageFile) {
        payload.image = imageFile;
      }
      if (passage?.idPassage) {
        await updatePassageAPI(passage.idPassage, {
          idPart: activePartId,
          title,
          content,
          numberParagraph,
        });
        message.success("Passage updated");
      } else {
        await createPassageAPI(payload);
        message.success("Passage created");
      }
      await refreshParts();
      setImageFile(null);
    } catch (e) {
      console.error(e);
      message.error("Save passage failed");
    } finally {
      setSaving(false);
    }
  };

  if (parts.length === 0) {
    return (
      <div className="bg-white rounded-3xl border-2 border-dashed border-[#e6e6ed] p-12 text-center">
        <div className="text-4xl mb-2">📄</div>
        <div className="font-extrabold text-[#1e1b4b]">No parts yet</div>
        <div className="text-xs text-[#64748b] mt-1 font-medium">
          Create a part first in the Questions tab
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Part selector */}
      <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_2px_0_#e6e6ed] p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] mr-2">
            Passage by Part:
          </div>
          {parts.map((p, i) => (
            <button
              key={p.idPart}
              onClick={() => setActivePartId(p.idPart)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                activePartId === p.idPart
                  ? "bg-[#6366f1] text-white shadow-[0_3px_0_#4338ca]"
                  : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
              }`}
            >
              {p.namePart || `Part ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {loadingPart ? (
        <div className="text-center text-[#94a3b8] py-12 font-bold">
          Loading...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-[#e6e6ed] shadow-[0_3px_0_#e6e6ed] overflow-hidden">
          <div className="px-4 py-2.5 border-b-2 border-[#e6e6ed] bg-[#fafafc] flex items-center gap-1.5 flex-wrap">
            <ToolbarBtn label="B" />
            <ToolbarBtn label="I" />
            <ToolbarBtn label="U" />
            <span className="w-px h-5 bg-[#e6e6ed] mx-1" />
            <ToolbarBtn label="H1" />
            <ToolbarBtn label="H2" />
            <span className="w-px h-5 bg-[#e6e6ed] mx-1" />
            <ToolbarBtn label="•" />
            <ToolbarBtn label="1." />
            <span className="ml-auto text-xs text-[#64748b] font-bold">
              {numberParagraph} paragraphs · {wordCount.toLocaleString()} words · {readMinutes} min read
            </span>
          </div>

          <div className="p-6 space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-black text-[#1e1b4b] outline-none"
              placeholder="Passage title..."
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-[15px] leading-relaxed text-[#1e1b4b] outline-none resize-none min-h-[400px]"
              placeholder="Passage content..."
            />

            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wide text-[#64748b] mb-1.5">
                Cover image (optional)
              </div>
              <div className="flex items-center gap-3">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="passage"
                    loading="lazy"
                    className="w-24 h-24 object-cover rounded-xl border-2 border-[#e6e6ed]"
                  />
                )}
                <Upload
                  maxCount={1}
                  beforeUpload={(file) => {
                    // FE-12b: revoke previous blob URL before creating a new one
                    if (imageUrl && imageUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(imageUrl);
                    }
                    setImageFile(file);
                    setImageUrl(URL.createObjectURL(file));
                    return false;
                  }}
                  onRemove={() => {
                    // FE-12b: revoke blob URL when removing the picked image
                    if (imageUrl && imageUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(imageUrl);
                    }
                    setImageFile(null);
                    setImageUrl(passage?.imageUrl || null);
                  }}
                >
                  <button className="px-4 py-2 rounded-xl border-2 border-dashed border-[#c7d2fe] text-[#6366f1] text-xs font-extrabold uppercase tracking-wide hover:bg-[#eef2ff]">
                    {imageUrl ? "↻ Replace image" : "+ Upload image"}
                  </button>
                </Upload>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t-2 border-[#e6e6ed] bg-[#fafafc] flex items-center justify-between">
            <div className="text-[11px] text-[#64748b] font-medium">
              {passage?.idPassage ? "✓ Saved" : "Unsaved"}
            </div>
            <StackedButton
              tone="indigo"
              onClick={handleSave}
              className={saving ? "opacity-60" : ""}
            >
              {saving
                ? "Saving..."
                : passage?.idPassage
                ? "💾 Update"
                : "💾 Save passage"}
            </StackedButton>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({ label }) {
  return (
    <button className="w-8 h-8 rounded-lg hover:bg-white hover:border hover:border-[#e6e6ed] text-xs font-bold text-[#1e1b4b]">
      {label}
    </button>
  );
}

export default PassageEditor;
