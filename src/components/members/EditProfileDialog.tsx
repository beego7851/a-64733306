import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Member } from "@/types/member";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { ResponsiveFormLayout } from "@/components/ui/responsive-form-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  full_name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  date_of_birth: z.string().optional(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  town: z.string().min(2, {
    message: "Town must be at least 2 characters.",
  }),
  postcode: z.string().min(5, {
    message: "Postcode must be at least 5 characters.",
  }),
});

interface EditProfileDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({
  member,
  open,
  onOpenChange,
  onProfileUpdated,
}: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: member.full_name || "",
      date_of_birth: member.date_of_birth || "",
      email: member.email || "",
      phone: member.phone || "",
      address: member.address || "",
      town: member.town || "",
      postcode: member.postcode || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("Updating member profile:", values);

      const { error } = await supabase
        .from("members")
        .update({
          full_name: values.full_name,
          date_of_birth: values.date_of_birth,
          email: values.email,
          phone: values.phone,
          address: values.address,
          town: values.town,
          postcode: values.postcode,
        })
        .eq("id", member.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      onProfileUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Profile"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Member Status Section */}
        <div className="p-4 sm:p-6 rounded-lg bg-dashboard-cardHover/50 border border-dashboard-cardBorder">
          <ResponsiveFormLayout spacing="tight">
            <div className="flex justify-between items-center">
              <span className="text-dashboard-muted">Status</span>
              <span className="text-dashboard-accent1 font-medium">{member.status}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dashboard-muted">Collector</span>
              <span className="text-dashboard-accent1 font-medium">{member.collector}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dashboard-muted">Member Number</span>
              <span className="text-xl font-bold text-[#9b87f5]">{member.member_number}</span>
            </div>
          </ResponsiveFormLayout>
        </div>

        <Separator className="bg-dashboard-cardBorder" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ResponsiveFormLayout columns={2}>
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date" 
                        value={field.value || ''} 
                        className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Address</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="town"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Town</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-dashboard-text">Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-dashboard-dark border-dashboard-cardBorder text-dashboard-text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ResponsiveFormLayout>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-dashboard-dark hover:bg-dashboard-cardHover hover:text-white border-dashboard-cardBorder"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
              >
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ResponsiveDialog>
  );
};

export default EditProfileDialog;