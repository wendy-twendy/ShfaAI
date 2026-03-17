import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  BookOpen,
  ShieldAlert,
  FileText,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchKnowledgeBase } from "@/api";
import type { KnowledgeBaseDocument } from "@/api";

type CategoryFilter = "all" | "clean" | "poisoned";

export function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState<KnowledgeBaseDocument[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchKnowledgeBase()
      .then((docs) => {
        setDocuments(docs);
        setIsLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setIsLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!documents) return [];
    let docs = documents;
    if (categoryFilter !== "all") {
      docs = docs.filter((d) => d.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q)
      );
    }
    return docs;
  }, [documents, categoryFilter, searchQuery]);

  const cleanDocs = useMemo(() => filtered.filter((d) => d.category === "clean"), [filtered]);
  const poisonedDocs = useMemo(() => filtered.filter((d) => d.category === "poisoned"), [filtered]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allExpanded = filtered.length > 0 && filtered.every((d) => expandedIds.has(d.id));

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(filtered.map((d) => d.id)));
    }
  }, [allExpanded, filtered]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-destructive text-sm font-medium">Failed to load knowledge base</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <span className="text-xs text-muted-foreground">
          {documents?.length ?? 0} documents
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex gap-1">
          {(["all", "clean", "poisoned"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                categoryFilter === cat
                  ? "bg-primary/15 text-primary"
                  : "bg-muted hover:bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={toggleAll}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-muted hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {allExpanded ? (
            <><ChevronsDownUp className="h-3 w-3" /> Collapse All</>
          ) : (
            <><ChevronsUpDown className="h-3 w-3" /> Expand All</>
          )}
        </button>

        <span className="text-[10px] text-muted-foreground ml-auto">
          {filtered.length} match{filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Clean Documents */}
      {cleanDocs.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Clean Documents ({cleanDocs.length})
            </h3>
          </div>
          <div className="space-y-2">
            {cleanDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                expanded={expandedIds.has(doc.id)}
                onToggle={() => toggleExpanded(doc.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Poisoned Documents */}
      {poisonedDocs.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldAlert className="h-3 w-3 text-threat" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-threat">
              Poisoned Documents ({poisonedDocs.length})
            </h3>
          </div>
          <div className="space-y-2">
            {poisonedDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                expanded={expandedIds.has(doc.id)}
                onToggle={() => toggleExpanded(doc.id)}
              />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No documents match your search.
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  doc,
  expanded,
  onToggle,
}: {
  doc: KnowledgeBaseDocument;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isPoisoned = doc.category === "poisoned";

  return (
    <div
      className={`rounded-lg border bg-card ${
        isPoisoned ? "border-threat/30" : "border-border"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors rounded-lg"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-medium truncate flex-1">{doc.title}</span>
        {isPoisoned && doc.attack_type && (
          <Badge
            variant="destructive"
            className="text-[9px] px-1.5 py-0 h-4 font-mono shrink-0"
          >
            {doc.attack_type.replaceAll("_", " ")}
          </Badge>
        )}
        <Badge
          className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${
            isPoisoned
              ? "bg-threat/15 text-threat border-threat/30"
              : "bg-safe/15 text-safe border-safe/30"
          }`}
        >
          {doc.category}
        </Badge>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          <pre className="mt-2 text-xs text-foreground/80 whitespace-pre-wrap break-words leading-relaxed font-mono bg-background/50 rounded px-3 py-2 border border-border/30 max-h-96 overflow-y-auto">
            {doc.content}
          </pre>
        </div>
      )}
    </div>
  );
}
