import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { inquiriesQuery, leadsQuery, updateInquiryHandledFn } from "@/lib/site-data";

type Row = {
  id: string;
  kind: "bot" | "property";
  name: string;
  mobile: string;
  email: string;
  source: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "bot", label: "Bot forms" },
  { key: "property", label: "Property enquiries" },
] as const;

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function LeadsDashboard() {
  const qc = useQueryClient();
  const { data: leads, isLoading: leadsLoading } = useQuery(leadsQuery);
  const { data: inquiries, isLoading: inqLoading } = useQuery(inquiriesQuery);
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const rows = useMemo<Row[]>(() => {
    const botRows: Row[] = (leads ?? []).map((lead) => ({
      id: lead.id,
      kind: "bot",
      name: lead.name,
      mobile: lead.mobile,
      email: lead.email,
      source: lead.source,
      subject: "WhatsApp community",
      message: lead.notes ?? "",
      status: lead.joined_whatsapp ? "Joined WhatsApp" : "Not joined",
      created_at: lead.created_at,
    }));
    const propertyRows: Row[] = (inquiries ?? []).map((inq) => ({
      id: inq.id,
      kind: "property",
      name: inq.name,
      mobile: inq.mobile,
      email: inq.email,
      source: "property_page",
      subject: inq.property_title ?? "General enquiry",
      message: inq.message ?? "",
      status: inq.handled ? "Handled" : "New",
      created_at: inq.created_at,
    }));
    return [...botRows, ...propertyRows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [leads, inquiries]);

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && row.kind !== filter) return false;
      if (!q) return true;
      return [row.name, row.mobile, row.email, row.source, row.subject, row.message]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, term, filter]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.error("Nothing to export with the current filters.");
      return;
    }
    const header = ["Captured", "Type", "Name", "Mobile", "Email", "Source", "Subject", "Message", "Status"];
    const lines = [
      header.join(","),
      ...filtered.map((row) =>
        [
          new Date(row.created_at).toLocaleString(),
          row.kind === "bot" ? "Bot form" : "Property enquiry",
          row.name,
          row.mobile,
          row.email,
          row.source,
          row.subject,
          row.message,
          row.status,
        ]
          .map(csvCell)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prime-pure-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"}.`);
  };

  const markHandled = async (id: string) => {
    try {
      await updateInquiryHandledFn({ data: id });
      toast.success("Marked as handled");
      qc.invalidateQueries({ queryKey: ["property_inquiries"] });
    } catch (err: any) {
      toast.error(err.message ?? "Could not mark as handled");
    }
  };

  const loading = leadsLoading || inqLoading;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total submissions" value={rows.length} />
        <StatCard label="Bot forms" value={rows.filter((r) => r.kind === "bot").length} />
        <StatCard label="Property enquiries" value={rows.filter((r) => r.kind === "property").length} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            maxLength={80}
            placeholder="Search name, mobile, email, listing…"
            className="pl-9"
            aria-label="Search submissions"
          />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button size="sm" variant="gold" onClick={exportCsv}>
          <Download className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Mobile</th>
              <th className="p-3">Email</th>
              <th className="p-3">Type</th>
              <th className="p-3">Subject / query</th>
              <th className="p-3">Status</th>
              <th className="p-3">Captured</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={`${row.kind}-${row.id}`} className="border-t border-border align-top">
                <td className="p-3 font-medium">{row.name}</td>
                <td className="p-3 tabular-nums">
                  <a className="hover:text-accent" href={`tel:${row.mobile.replace(/[^\d+]/g, "")}`}>
                    {row.mobile}
                  </a>
                </td>
                <td className="p-3">
                  <a className="hover:text-accent" href={`mailto:${row.email}`}>
                    {row.email}
                  </a>
                </td>
                <td className="p-3">
                  <Badge variant="secondary">{row.kind === "bot" ? "Bot" : "Property"}</Badge>
                </td>
                <td className="max-w-[18rem] p-3">
                  <p className="font-medium">{row.subject}</p>
                  {row.message && <p className="text-xs text-muted-foreground">{row.message}</p>}
                </td>
                <td className="p-3">
                  <span className="text-xs text-muted-foreground">{row.status}</span>
                  {row.kind === "property" && row.status === "New" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 px-2 text-xs"
                      onClick={() => void markHandled(row.id)}
                    >
                      <Check className="size-3" /> Mark handled
                    </Button>
                  )}
                </td>
                <td className="p-3 text-xs text-muted-foreground tabular-nums">
                  {new Date(row.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {loading ? (
                    <Loader2 className="mx-auto size-5 animate-spin text-accent" />
                  ) : (
                    "No submissions match your search."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}
