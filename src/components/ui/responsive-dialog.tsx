import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
};

export const ResponsiveDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = "md",
}: ResponsiveDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`w-[95%] ${maxWidthClasses[maxWidth]} mx-auto bg-dashboard-card border-dashboard-cardBorder
          p-4 sm:p-6 max-h-[90vh] overflow-y-auto`}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle className="text-xl sm:text-2xl text-dashboard-accent1">{title}</DialogTitle>}
            {description && <DialogDescription className="text-dashboard-muted">{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
};