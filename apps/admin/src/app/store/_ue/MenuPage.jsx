"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LuPlus as Plus, LuEllipsis as MoreHorizontal,
  LuChevronDown as ChevronDown, LuX as X,
} from "react-icons/lu";
import { IoFastFoodOutline } from "react-icons/io5";
import { ItemModal } from "../_ue/ItemModal";
import { Button } from "@/components/ui/button";
import { fmt } from "../_ue/data";
import { useAuth } from "@/lib/auth-store";
import { storeApi } from "@/lib/store";

const COMMON_CATEGORIES = [
  "Bakery",
  "Beer",
  "Bowls",
  "Breakfast",
  "Brunch",
  "Burgers",
  "Burritos",
  "Cakes",
  "Catering trays",
  "Chicken",
  "Cocktails",
  "Coffee",
  "Cold drinks",
  "Combos",
  "Curries",
  "Desserts",
  "Dim sum",
  "Drinks",
  "Grills",
  "Hot drinks",
  "Ice cream",
  "Kids menu",
  "Light meals",
  "Mains",
  "Mocktails",
  "Noodles",
  "Pasta",
  "Pies & pastries",
  "Pizza",
  "Ribs",
  "Rice dishes",
  "Salads",
  "Sandwiches & wraps",
  "Sauces & extras",
  "Schnitzels",
  "Seafood",
  "Sharing platters",
  "Sides",
  "Smoothies & juices",
  "Snacks",
  "Soups",
  "Specials",
  "Starters",
  "Steaks",
  "Stir-fry",
  "Sushi",
  "Tacos",
  "Tea",
  "Vegan",
  "Vegetarian",
  "Wine",
  "Wings",
];

function ItemActionsMenu({ onEdit, onDelete, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const optionStyle = (danger) => ({
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 600,
    color: danger ? "var(--red, #c0392b)" : "inherit",
  });

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className="icon-btn"
        style={{ width: 32, height: 32 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(13,13,13,.12)",
            minWidth: 160,
            zIndex: 30,
            padding: 4,
          }}
        >
          <button
            type="button"
            role="menuitem"
            style={optionStyle(false)}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            style={optionStyle(true)}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [cat, setCat] = useState(null);
  const [avail, setAvail] = useState(null);
  const [availOpen, setAvailOpen] = useState(false);
  const [draftAvail, setDraftAvail] = useState(null);
  const availRef = useRef(null);
  const [catOpen, setCatOpen] = useState(false);
  const [draftCat, setDraftCat] = useState(null);
  const catRef = useRef(null);
  const [editing, setEditing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const m = await storeApi.menu(token);
      setMenu(m);
      setCat((prev) => prev ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated || !token) return;
    load();
  }, [hydrated, token]);

  useEffect(() => {
    if (!availOpen) return;
    const onDoc = (e) => {
      if (availRef.current && !availRef.current.contains(e.target)) setAvailOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAvailOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [availOpen]);

  useEffect(() => {
    if (!catOpen) return;
    const onDoc = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setCatOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [catOpen]);

  const categories = useMemo(() => menu.categories ?? [], [menu]);
  const modalCats = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of [...categories, ...COMMON_CATEGORIES]) {
      if (!c || seen.has(c)) continue;
      seen.add(c);
      out.push(c);
    }
    return out.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
  }, [categories]);
  const itemsForCat = useMemo(
    () =>
      menu.items.filter(
        (i) =>
          (cat ? i.category === cat : true) &&
          (avail === null ? true : avail === "out" ? !i.available : i.available),
      ),
    [menu.items, cat, avail],
  );

  const onToggle = async (item) => {
    if (!token) return;
    const next = !item.available;
    setMenu((m) => ({
      ...m,
      items: m.items.map((i) => (i.id === item.id ? { ...i, available: next } : i)),
    }));
    try {
      await storeApi.toggleItem(token, item.id, next);
    } catch {
      setMenu((m) => ({
        ...m,
        items: m.items.map((i) =>
          i.id === item.id ? { ...i, available: item.available } : i,
        ),
      }));
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleting) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await storeApi.deleteItem(token, deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      setDeleteError(e?.message || "Could not delete this item. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  useEffect(() => {
    if (!deleting) return;
    setDeleteError("");
    const onKey = (e) => {
      if (e.key === "Escape") setDeleting(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [deleting]);

  const submitNew = async ({ name, desc, price, category, prepTimeMinutes, imageUrl }) => {
    if (!token) return;
    await storeApi.createItem(token, {
      name,
      description: desc,
      priceCents: Math.round(price * 100),
      prepTimeMinutes: prepTimeMinutes ?? 5,
      category,
      available: true,
      imageUrl: imageUrl ?? null,
    });
    setAddOpen(false);
    setCat(category);
    await load();
  };

  const submitEdit = async ({ name, desc, price, category, prepTimeMinutes, imageUrl }) => {
    if (!token || !editing) return;
    await storeApi.updateItem(token, editing.id, {
      name,
      description: desc,
      priceCents: Math.round(price * 100),
      prepTimeMinutes: prepTimeMinutes ?? editing.prepTimeMinutes,
      category,
      available: editing.available,
      imageUrl: imageUrl ?? null,
    });
    setEditing(null);
    setCat(category);
    await load();
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Menu</h1>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} />
            Add item
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" aria-live="polite" className="card" style={{ padding: 18, color: "var(--red)", marginBottom: 14 }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <div ref={availRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={availOpen}
          onClick={() => {
            setDraftAvail(avail);
            setAvailOpen((v) => !v);
          }}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-solid border-border bg-secondary px-4 text-sm font-semibold text-foreground"
        >
          {avail === "in" ? "Available" : avail === "out" ? "Sold out" : "Availability"}
          <ChevronDown className={`h-4 w-4 transition-transform ${availOpen ? "rotate-180" : ""}`} />
        </button>
        {availOpen && (
          <div
            role="menu"
            aria-label="Availability options"
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 rounded-lg bg-card p-2 shadow-[0_0_28px_rgba(0,0,0,0.18)]"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-lg font-semibold">Availability</div>
              <button
                type="button"
                aria-label="Close availability options"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setAvailOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-1">
              {[
                { k: "in", l: "Available" },
                { k: "out", l: "Sold out" },
              ].map((o) => {
                const selected = draftAvail === o.k;
                return (
                  <button
                    key={o.l}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-secondary"
                    onClick={() => setDraftAvail(o.k)}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 bg-background ${
                        selected ? "border-foreground" : "border-muted-foreground/70"
                      }`}
                      aria-hidden="true"
                    >
                      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-foreground" /> : null}
                    </span>
                    <span>{o.l}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 px-1 pt-2">
              <button
                type="button"
                className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-secondary"
                onClick={() => setDraftAvail(null)}
              >
                Reset
              </button>
              <button
                type="button"
                className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
                onClick={() => {
                  setAvail(draftAvail);
                  setAvailOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
      {categories.length > 0 && (
        <div ref={catRef} style={{ position: "relative" }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={catOpen}
            onClick={() => {
              setDraftCat(cat);
              setCatOpen((v) => !v);
            }}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-solid border-border bg-secondary px-4 text-sm font-semibold text-foreground"
          >
            {cat ?? "Category"}
            <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div
              role="menu"
              aria-label="Category options"
              className="absolute left-0 top-[calc(100%+8px)] z-50 w-60 rounded-lg bg-card p-2 shadow-[0_0_28px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-lg font-semibold">Category</div>
                <button
                  type="button"
                  aria-label="Close category options"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  onClick={() => setCatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid max-h-72 gap-1 overflow-y-auto">
                {categories.map((c) => {
                  const selected = draftCat === c;
                  return (
                    <button
                      key={c ?? "__all"}
                      type="button"
                      role="menuitemradio"
                      aria-checked={selected}
                      className="flex h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-secondary"
                      onClick={() => setDraftCat(c)}
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 bg-background ${
                          selected ? "border-foreground" : "border-muted-foreground/70"
                        }`}
                        aria-hidden="true"
                      >
                        {selected ? <span className="h-1.5 w-1.5 rounded-full bg-foreground" /> : null}
                      </span>
                      <span>{c ?? "All"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1 pt-2">
                <button
                  type="button"
                  className="h-10 rounded-full px-4 text-sm font-semibold hover:bg-secondary"
                  onClick={() => setDraftCat(null)}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="h-10 rounded-full bg-foreground px-5 text-sm font-semibold text-background"
                  onClick={() => {
                    setCat(draftCat);
                    setCatOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
        {(avail !== null || cat !== null) && (
          <button
            type="button"
            onClick={() => {
              setAvail(null);
              setCat(null);
            }}
            className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid menu-grid stagger" key={cat} style={{ marginTop: 20 }}>
        {loading && itemsForCat.length === 0 ? (
          <div className="muted" style={{ padding: 18 }}>Loading…</div>
        ) : itemsForCat.length === 0 ? (
          <div className="muted" style={{ padding: 18 }}>
            {avail === "out"
              ? "No sold out items."
              : avail === "in"
                ? "No available items."
                : "No items yet. Use Add item to create one."}
          </div>
        ) : (
          itemsForCat.map((it) => (
            <div className="card menu-item" key={it.id} style={{ opacity: it.available ? 1 : 0.62, alignItems: "flex-start" }}>
              <div
                className="ph"
                style={{
                  background: "#f3f4f6",
                  overflow: "hidden",
                  color: "#9ca3af",
                  marginTop: 3,
                }}
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.imageUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <IoFastFoodOutline size={32} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">
                  {it.name}
                  {!it.available && <span className="tag-out">Sold out</span>}
                </div>
                <div className="ds">{it.description}</div>
                <div className="pr">{fmt(it.priceCents / 100)}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 14,
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", gap: 6 }}>
                  <ItemActionsMenu
                    onEdit={() => setEditing(it)}
                    onDelete={() => setDeleting(it)}
                  />
                </div>
                <label
                  className="switch"
                  title={it.available ? "Available" : "Sold out"}
                >
                  <input
                    type="checkbox"
                    role="switch"
                    checked={it.available}
                    onChange={() => onToggle(it)}
                    aria-label={`Availability for ${it.name}`}
                  />
                  <span className="switch-track" aria-hidden="true">
                    <span className="switch-thumb" />
                  </span>
                </label>
              </div>
            </div>
          ))
        )}
      </div>
      {addOpen && (
        <ItemModal
          cats={modalCats}
          onSubmit={submitNew}
          onClose={() => setAddOpen(false)}
        />
      )}
      {editing && (
        <ItemModal
          cats={
            modalCats.includes(editing.category)
              ? modalCats
              : [editing.category, ...modalCats]
          }
          initialCat={editing.category}
          initial={{
            name: editing.name,
            desc: editing.description,
            price: editing.priceCents / 100,
            prepTimeMinutes: editing.prepTimeMinutes,
            imageUrl: editing.imageUrl,
          }}
          mode="edit"
          onSubmit={submitEdit}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-foreground/30"
              onClick={deleteBusy ? undefined : () => setDeleting(null)}
            />
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-lg">
              <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
                <h3
                  id="delete-item-title"
                  className="text-base font-semibold tracking-tight"
                >
                  Delete Item
                </h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDeleting(null)}
                  disabled={deleteBusy}
                  className="inline-grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 pb-2">
                <p className="text-sm text-muted-foreground">
                  {deleting.name} will be removed from your menu. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {deleteError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteBusy}
                >
                  {deleteBusy ? "Deleting…" : "Continue"}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
