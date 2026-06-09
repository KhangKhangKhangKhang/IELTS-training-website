import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Spin, message } from "antd";
import { useAuth } from "@/context/authContext";
import { IELTSGrammarManagement } from "@/components/magicpath/ielts-grammar-management/IELTSGrammarManagement";
import {
  getAllGrammarAPI,
  getSystemCategoriesAPI,
  getGrammarCategoriesUserAPI,
  getGrammarByCategoriesUserAPI,
  createGrammarWithoutCategoryAPI,
  updateGrammarAPI,
  deleteGrammarAPI,
  addGrammarToCategoryAPI,
  removeGrammarFromCategoryAPI,
  updateGrammarCategoriesAPI,
  deleteGrammarCategoriesAPI,
} from "@/services/apiGrammar";

const parseJson = (v) => {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
};

const GrammarTeacherView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemCategories, setSystemCategories] = useState([]);
  const [userCategories, setUserCategories] = useState([]);
  const [allGrammars, setAllGrammars] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    explanation: "",
    level: "Mid",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user?.idUser) return;
    try {
      setLoading(true);
      const [sysRes, usrRes, allRes] = await Promise.allSettled([
        getSystemCategoriesAPI(),
        getGrammarCategoriesUserAPI(user.idUser),
        getAllGrammarAPI(),
      ]);
      const sys = sysRes.status === "fulfilled" ? sysRes.value?.data?.data || sysRes.value?.data || [] : [];
      const usr = usrRes.status === "fulfilled" ? usrRes.value?.data?.data || usrRes.value?.data || [] : [];
      const all = allRes.status === "fulfilled" ? allRes.value?.data?.data || allRes.value?.data || [] : [];
      setSystemCategories(Array.isArray(sys) ? sys : []);
      setUserCategories(Array.isArray(usr) ? usr : []);
      setAllGrammars(Array.isArray(all) ? all : []);
    } catch (e) {
      message.error("Không thể tải dữ liệu ngữ pháp");
    } finally {
      setLoading(false);
    }
  }, [user?.idUser]);

  useEffect(() => { load(); }, [load]);

  // Map BE → canvas shape
  const mappedCategories = useMemo(() => {
    const mapOne = (c, isSystem) => ({
      id: c.idGrammarCategory,
      name: c.name,
      description: c.description || "",
      count: c.grammars?.length || 0,
      isSystem,
      ownerName: c.user?.nameUser,
    });
    return [
      ...systemCategories.map((c) => mapOne(c, true)),
      ...userCategories.map((c) => mapOne(c, false)),
    ];
  }, [systemCategories, userCategories]);

  // For grammar items, fetch their categories membership on first load
  const [grammarCategoryMap, setGrammarCategoryMap] = useState({});

  useEffect(() => {
    if (!user?.idUser) return;
    const catIds = [
      ...systemCategories.map((c) => c.idGrammarCategory),
      ...userCategories.map((c) => c.idGrammarCategory),
    ];
    if (catIds.length === 0) return;
    (async () => {
      const results = await Promise.allSettled(
        catIds.map((id) => getGrammarByCategoriesUserAPI(id, user.idUser))
      );
      const map = {};
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const list = r.value?.data?.data || r.value?.data || [];
        const normalized = list.map((item) => {
          const g = item.grammar || item;
          return g.idGrammar;
        });
        normalized.forEach((gid) => {
          if (!map[gid]) map[gid] = [];
          map[gid].push(catIds[i]);
        });
      });
      setGrammarCategoryMap(map);
    })();
  }, [user?.idUser, systemCategories, userCategories]);

  const mappedGrammars = useMemo(() => {
    return allGrammars.map((g) => ({
      id: g.idGrammar,
      title: g.title,
      description: g.explanation || "",
      level: g.level || "Mid",
      categories: grammarCategoryMap[g.idGrammar] || [],
      exerciseCount: g._count?.exercises || 0,
    }));
  }, [allGrammars, grammarCategoryMap]);

  const handleSaveGrammar = async (g) => {
    try {
      setBusy(true);
      const data = {
        title: g.title,
        explanation: g.description,
        level: g.level,
      };
      await updateGrammarAPI(data, g.id, user.idUser);
      message.success("Đã cập nhật grammar");
      load();
    } catch (e) {
      message.error("Không thể cập nhật grammar");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGrammar = async (g) => {
    try {
      setBusy(true);
      await deleteGrammarAPI(g.id, user.idUser);
      message.success("Đã xóa grammar");
      setAllGrammars((prev) => prev.filter((x) => x.idGrammar !== g.id));
    } catch (e) {
      message.error("Không thể xóa grammar");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCategory = async (c) => {
    try {
      setBusy(true);
      await updateGrammarCategoriesAPI(
        { name: c.name, description: c.description },
        c.id,
        user.idUser
      );
      message.success("Đã cập nhật category");
      load();
    } catch (e) {
      message.error("Không thể cập nhật category");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async (c) => {
    try {
      setBusy(true);
      await deleteGrammarCategoriesAPI(c.id, user.idUser);
      message.success("Đã xóa category");
      setSystemCategories((p) => p.filter((x) => x.idGrammarCategory !== c.id));
      setUserCategories((p) => p.filter((x) => x.idGrammarCategory !== c.id));
    } catch (e) {
      message.error("Không thể xóa category");
    } finally {
      setBusy(false);
    }
  };

  const handleAssignGrammar = async (g, nextCategoryIds) => {
    const prevCategoryIds = grammarCategoryMap[g.id] || [];
    const toAdd = nextCategoryIds.filter((id) => !prevCategoryIds.includes(id));
    const toRemove = prevCategoryIds.filter((id) => !nextCategoryIds.includes(id));
    try {
      setBusy(true);
      await Promise.allSettled([
        ...toAdd.map((cid) => addGrammarToCategoryAPI(cid, g.id, user.idUser)),
        ...toRemove.map((cid) => removeGrammarFromCategoryAPI(cid, g.id, user.idUser)),
      ]);
      message.success("Đã cập nhật gán category");
      setGrammarCategoryMap((m) => ({ ...m, [g.id]: nextCategoryIds }));
    } catch (e) {
      message.error("Không thể cập nhật gán");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.title.trim() || !createForm.explanation.trim()) {
      message.warning("Tiêu đề và giải thích không được để trống");
      return;
    }
    try {
      setBusy(true);
      await createGrammarWithoutCategoryAPI(
        {
          title: createForm.title,
          explanation: createForm.explanation,
          level: createForm.level,
        },
        user.idUser
      );
      message.success("Đã tạo grammar");
      setCreateOpen(false);
      setCreateForm({ title: "", explanation: "", level: "Mid" });
      load();
    } catch (e) {
      message.error("Không thể tạo grammar");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <div className={busy ? "pointer-events-none opacity-70 transition-opacity" : ""}>
        <IELTSGrammarManagement
          externalCategories={mappedCategories}
          externalGrammars={mappedGrammars}
          onSaveGrammar={handleSaveGrammar}
          onDeleteGrammar={handleDeleteGrammar}
          onSaveCategory={handleSaveCategory}
          onDeleteCategory={handleDeleteCategory}
          onAssignGrammar={handleAssignGrammar}
          onCreateNew={() => setCreateOpen(true)}
        />
      </div>

      <Modal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        title="Tạo grammar mới"
        onOk={handleCreate}
        okText="Tạo"
        cancelText="Hủy"
        confirmLoading={busy}
        width={560}
      >
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
              Tiêu đề *
            </label>
            <input
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none"
              placeholder="VD: Present Perfect Tense"
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
              Giải thích *
            </label>
            <textarea
              rows={4}
              value={createForm.explanation}
              onChange={(e) => setCreateForm({ ...createForm, explanation: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border-2 border-[#e6e6ed] text-sm focus:border-[#6366f1] outline-none resize-none"
              placeholder="Giải thích chi tiết cấu trúc..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 uppercase tracking-wide">
              Cấp độ
            </label>
            <div className="flex gap-1.5">
              {["Low", "Mid", "High", "Great"].map((lv) => (
                <button
                  key={lv}
                  onClick={() => setCreateForm({ ...createForm, level: lv })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                    createForm.level === lv
                      ? "bg-[#6366f1] text-white shadow-[0_2px_0_#4338ca]"
                      : "bg-[#f1f1f6] text-[#64748b] hover:bg-[#e6e6ed]"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GrammarTeacherView;
