import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Building2, Hash, UserX, RefreshCw, ShieldCheck, Users, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/context/auth-context";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ALL_HOSTELS } from "@/lib/hostels";
import { useLocation } from "wouter";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  reg_number: string;
  role: string;
  campus: string | null;
  hostel: string | null;
  room_number: string | null;
  room_updated_at: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

const allHostels = ALL_HOSTELS;

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const user = useCurrentUser();
  const { session } = useAuthContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [campusFilter, setCampusFilter] = useState("all");
  const [evictingId, setEvictingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const token = session?.access_token ?? "";

  const fetchUsers = useCallback(async (): Promise<AdminUser[]> => {
    const params = new URLSearchParams();
    if (hostelFilter !== "all") params.set("hostel", hostelFilter);
    if (campusFilter !== "all") params.set("campus", campusFilter);
    if (search) params.set("q", search);

    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  }, [token, hostelFilter, campusFilter, search]);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", hostelFilter, campusFilter, search],
    queryFn: fetchUsers,
    enabled: !!token && ["admin", "class_rep"].includes(user.role),
  });

  const evictMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/evict`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to remove user from room");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setConfirmId(null);
      setEvictingId(null);
    },
    onError: () => setEvictingId(null),
  });

  if (!["admin", "class_rep"].includes(user.role)) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Access denied</p>
        <p className="text-xs text-muted-foreground/70 mt-1">This panel is for admins and class reps only.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  const usersWithRooms = users?.filter(u => u.room_number) ?? [];
  const usersWithoutRooms = users?.filter(u => !u.room_number) ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="admin-page">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
          <Badge variant="outline" className="capitalize text-xs ml-1">{user.role.replace("_", " ")}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Manage users, inspect rooms, and oversee hostel assignments.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <Card className="border border-card-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Total Users</div>
              <div className="text-lg font-bold">{users?.length ?? "—"}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-card-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">With Rooms</div>
              <div className="text-lg font-bold">{usersWithRooms.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-card-border shadow-sm col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <Hash className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">No Room Assigned</div>
              <div className="text-lg font-bold">{usersWithoutRooms.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or reg number..."
            className="pl-9"
          />
        </div>
        <Select value={campusFilter} onValueChange={v => { setCampusFilter(v); setHostelFilter("all"); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            <SelectItem value="gubi">Gubi</SelectItem>
            <SelectItem value="yelwa">Yelwa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={hostelFilter} onValueChange={setHostelFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Hostel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Hostels</SelectItem>
            {allHostels.map(h => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* User list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border border-card-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-24 shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users && users.length > 0 ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border border-card-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{u.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs capitalize ${u.role === "admin" ? "border-red-300 text-red-600" : u.role === "class_rep" ? "border-blue-300 text-blue-600" : ""}`}
                          >
                            {u.role.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-xs text-muted-foreground">{u.reg_number}</span>
                          {u.hostel && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {u.hostel}
                            </span>
                          )}
                          {u.room_number ? (
                            <span className="text-xs font-medium text-foreground flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              Room {u.room_number}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">No room assigned</span>
                          )}
                        </div>
                      </div>

                      {u.room_number && (
                        <div className="shrink-0">
                          {confirmId === u.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground hidden sm:block">Confirm?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                disabled={evictMutation.isPending}
                                onClick={() => {
                                  setEvictingId(u.id);
                                  evictMutation.mutate(u.id);
                                }}
                              >
                                {evictingId === u.id ? "Removing..." : "Yes, Remove"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmId(u.id)}
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" />
                              Remove from Room
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <Card className="border border-card-border shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No users found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
