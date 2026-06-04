import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingBag, Search, Zap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListListings,
  useGetFeaturedListings,
  useCreateListing,
  getListListingsQueryKey,
  getGetFeaturedListingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuthContext } from "@/context/auth-context";
import type { Listing } from "@workspace/api-client-react";

const typeConfig: Record<string, { label: string; cls: string }> = {
  sell: { label: "For Sale", cls: "bg-green-100 text-green-700 border-green-200" },
  buy: { label: "Wanted", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  trade: { label: "Trade", cls: "bg-purple-100 text-purple-700 border-purple-200" },
};

const formSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  type: z.enum(["sell", "buy", "trade"]),
  category: z.enum(["electronics", "books", "clothing", "food", "furniture", "services", "other"]),
  contactInfo: z.string().optional(),
  negotiable: z.boolean().default(false),
});

function ListingCard({
  listing,
  isElevated,
  token,
  onDeleted,
}: {
  listing: Listing;
  isElevated: boolean;
  token: string;
  onDeleted: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete listing");
      }
    },
    onSuccess: () => {
      setConfirmDelete(false);
      onDeleted();
    },
  });

  const tc = typeConfig[listing.type] ?? typeConfig.sell;

  return (
    <Card
      data-testid={`listing-${listing.id}`}
      className="border border-card-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 relative"
    >
      {isElevated && (
        <div className="absolute top-2 right-2 z-10">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-6 text-xs px-2"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "..." : "Delete"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              data-testid={`delete-listing-${listing.id}`}
              onClick={() => setConfirmDelete(true)}
              className="p-1 rounded bg-white/80 hover:bg-red-50 text-red-500 hover:text-red-700 border border-red-200 transition-colors"
              title="Delete listing"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 flex-1">
            {listing.title}
          </h3>
          <Badge className={`text-xs border shrink-0 ${tc.cls} ${isElevated ? "mr-8" : ""}`}>
            {tc.label}
          </Badge>
        </div>
        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{listing.description}</p>
        )}
        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="text-lg font-bold text-foreground">
              {listing.type === "buy" ? "Up to " : ""}₦{listing.price.toLocaleString()}
            </div>
            {listing.negotiable && (
              <div className="text-xs text-muted-foreground">Negotiable</div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-muted-foreground">{listing.sellerName}</div>
            <div className="text-xs text-muted-foreground/70">{listing.sellerHostel}</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
          <Badge variant="outline" className="text-xs capitalize">{listing.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(listing.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function NewListingDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const createListing = useCreateListing();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      type: "sell",
      category: "other",
      contactInfo: "",
      negotiable: false,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createListing.mutate(
      {
        data: {
          title: values.title,
          description: values.description,
          price: values.price,
          type: values.type,
          category: values.category,
          sellerId: user.id,
          campus: user.campus as "gubi" | "yelwa",
          contactInfo: values.contactInfo,
          negotiable: values.negotiable,
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
        <Button data-testid="new-listing-btn" className="gap-2">
          <Plus className="w-4 h-4" /> Post Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Listing</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input data-testid="listing-title-input" placeholder="What are you selling/buying?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea data-testid="listing-desc-input" placeholder="More details..." rows={2} {...field} />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="listing-type-select"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sell">Selling</SelectItem>
                      <SelectItem value="buy">Buying</SelectItem>
                      <SelectItem value="trade">Trading</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="listing-category-select"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["electronics", "books", "clothing", "food", "furniture", "services", "other"].map((c) => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₦)</FormLabel>
                <FormControl>
                  <Input data-testid="listing-price-input" type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="contactInfo" render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Info (optional)</FormLabel>
                <FormControl>
                  <Input data-testid="listing-contact-input" placeholder="WhatsApp, room number..." {...field} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="negotiable" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    data-testid="listing-negotiable-check"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="!mt-0 cursor-pointer">Price is negotiable</FormLabel>
              </FormItem>
            )} />

            <Button
              type="submit"
              className="w-full"
              disabled={createListing.isPending}
              data-testid="submit-listing-btn"
            >
              {createListing.isPending ? "Posting..." : "Post Listing"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const qc = useQueryClient();
  const user = useCurrentUser();
  const { session } = useAuthContext();
  const token = session?.access_token ?? "";
  const isElevated = ["admin", "class_rep"].includes(user.role);

  const params = {
    ...(typeFilter !== "all" ? { type: typeFilter as "sell" | "buy" | "trade" } : {}),
    ...(catFilter !== "all" ? { category: catFilter as "electronics" | "books" | "clothing" | "food" | "furniture" | "services" | "other" } : {}),
    ...(search ? { q: search } : {}),
  };

  const hasParams = Object.keys(params).length > 0;

  const { data: listings, isLoading } = useListListings(hasParams ? params : undefined, {
    query: { queryKey: getListListingsQueryKey(hasParams ? params : undefined) },
  });
  const { data: featured } = useGetFeaturedListings();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListListingsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFeaturedListingsQueryKey() });
  };

  const stagger = {
    container: { show: { transition: { staggerChildren: 0.04 } } },
    item: { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1 } },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="marketplace-page">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campus Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">Buy, sell, and trade within ATBU</p>
        </div>
        <NewListingDialog onCreated={invalidate} />
      </div>

      {/* Featured */}
      {featured && featured.length > 0 && !search && typeFilter === "all" && catFilter === "all" && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Recent Listings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {featured.slice(0, 4).map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                isElevated={isElevated}
                token={token}
                onDeleted={invalidate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="marketplace-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger data-testid="type-filter" className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sell">Selling</SelectItem>
            <SelectItem value="buy">Buying</SelectItem>
            <SelectItem value="trade">Trading</SelectItem>
          </SelectContent>
        </Select>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger data-testid="category-filter" className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["electronics", "books", "clothing", "food", "furniture", "services", "other"].map((c) => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border border-card-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {listings.map((l) => (
            <motion.div key={l.id} variants={stagger.item}>
              <ListingCard
                listing={l}
                isElevated={isElevated}
                token={token}
                onDeleted={invalidate}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No listings found</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
