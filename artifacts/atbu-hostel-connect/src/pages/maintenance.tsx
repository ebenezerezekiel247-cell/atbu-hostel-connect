import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Wrench, Clock, CheckCircle, AlertTriangle, XCircle, Filter, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListMaintenanceTickets,
  useCreateMaintenanceTicket,
  useGetMaintenanceStats,
  getListMaintenanceTicketsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getHostelGroupsForCampus, type Campus } from "@/lib/hostels";

const statusConfig = {
  open: { label: "Open", icon: Clock, className: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", icon: AlertTriangle, className: "bg-blue-100 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", icon: CheckCircle, className: "bg-green-100 text-green-700 border-green-200" },
  closed: { label: "Closed", icon: XCircle, className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const priorityConfig: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  category: z.enum(["plumbing", "electrical", "furniture", "cleaning", "security", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  campus: z.enum(["gubi", "yelwa"]),
  hostel: z.string().min(1, "Please select a hostel"),
  roomNumber: z.string().optional(),
});

function NewTicketDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const createTicket = useCreateMaintenanceTicket();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "plumbing",
      priority: "medium",
      campus: (user.campus as "gubi" | "yelwa") || "gubi",
      hostel: user.hostel || "",
      roomNumber: user.roomNumber ?? "",
    },
  });

  const selectedCampus = form.watch("campus");
  const hostelGroups = getHostelGroupsForCampus(selectedCampus as Campus);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTicket.mutate(
      {
        data: {
          title: values.title,
          description: values.description,
          category: values.category,
          priority: values.priority,
          hostel: values.hostel,
          campus: values.campus,
          roomNumber: values.roomNumber,
          reportedBy: user.id,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          onCreated();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="new-ticket-btn" className="gap-2">
          <Plus className="w-4 h-4" /> Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Title</FormLabel>
                <FormControl>
                  <Input data-testid="ticket-title-input" placeholder="e.g. Leaking pipe in bathroom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea data-testid="ticket-desc-input" placeholder="Describe the issue..." rows={3} {...field} />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="campus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Campus</FormLabel>
                  <Select value={field.value} onValueChange={(v) => { field.onChange(v); form.setValue("hostel", ""); }}>
                    <FormControl>
                      <SelectTrigger data-testid="ticket-campus-select"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gubi">Gubi</SelectItem>
                      <SelectItem value="yelwa">Yelwa</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="ticket-category-select"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["plumbing", "electrical", "furniture", "cleaning", "security", "other"].map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="hostel" render={({ field }) => (
              <FormItem>
                <FormLabel>Hostel</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger data-testid="ticket-hostel-select"><SelectValue placeholder="Select hostel" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {hostelGroups.map((group) => (
                      <div key={group.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.label}</div>
                        {group.hostels.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="ticket-priority-select"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["low", "medium", "high", "urgent"].map((p) => (
                        <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="roomNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input data-testid="ticket-room-input" placeholder="e.g. B12" {...field} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <Button type="submit" className="w-full" disabled={createTicket.isPending} data-testid="submit-ticket-btn">
              {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Maintenance() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const qc = useQueryClient();
  const params = statusFilter !== "all" ? { status: statusFilter as "open" | "in_progress" | "resolved" | "closed" } : undefined;
  const { data: tickets, isLoading } = useListMaintenanceTickets(params, {
    query: { queryKey: getListMaintenanceTicketsQueryKey(params) },
  });
  const { data: stats } = useGetMaintenanceStats();

  const stagger = {
    container: { show: { transition: { staggerChildren: 0.05 } } },
    item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto" data-testid="maintenance-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Maintenance Desk</h1>
          <p className="text-muted-foreground text-sm mt-1">Log and track hostel repair requests</p>
        </div>
        <NewTicketDialog onCreated={() => qc.invalidateQueries({ queryKey: getListMaintenanceTicketsQueryKey() })} />
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", val: stats.total, cls: "text-foreground" },
            { label: "Open", val: stats.open, cls: "text-amber-600" },
            { label: "In Progress", val: stats.inProgress, cls: "text-blue-600" },
            { label: "Resolved", val: stats.resolved, cls: "text-green-600" },
          ].map(({ label, val, cls }) => (
            <Card key={label} className="border border-card-border shadow-sm">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold tabular-nums ${cls}`}>{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="status-filter" className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border border-card-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tickets && tickets.length > 0 ? (
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="space-y-3">
          {tickets.map((ticket) => {
            const sc = statusConfig[ticket.status as keyof typeof statusConfig] ?? statusConfig.open;
            const StatusIcon = sc.icon;
            return (
              <motion.div key={ticket.id} variants={stagger.item}>
                <Card data-testid={`ticket-${ticket.id}`} className="border border-card-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h3 className="font-semibold text-foreground text-sm">{ticket.title}</h3>
                          <Badge className={`text-xs border ${sc.className} gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </Badge>
                          <Badge variant="outline" className={`text-xs border ${priorityConfig[ticket.priority] ?? ""}`}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{ticket.hostel}{ticket.roomNumber && ` · Room ${ticket.roomNumber}`}</span>
                          <span className="capitalize">{ticket.category}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Report an issue using the button above</p>
        </div>
      )}
    </div>
  );
}
