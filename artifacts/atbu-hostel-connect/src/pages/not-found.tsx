import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
        <p className="text-lg font-semibold text-foreground mb-1">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          This page doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
