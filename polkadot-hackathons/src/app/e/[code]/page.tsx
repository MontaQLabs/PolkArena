"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function ShareableEventPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const redirectToEvent = async () => {
      try {
        const shortCode = params.code as string;
        
        if (!shortCode) {
          router.push('/events');
          return;
        }

        // Find event by short code
        const { data, error } = await supabase
          .from('events')
          .select('id')
          .eq('short_code', shortCode)
          .single();

        if (error || !data) {
          console.error('Event not found:', error);
          router.push('/events');
          return;
        }

        // Redirect to full event page
        router.push(`/events/${data.id}`);
      } catch (error) {
        console.error('Error redirecting to event:', error);
        router.push('/events');
      }
    };

    redirectToEvent();
  }, [params.code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-crucible-orange mx-auto" />
        <p className="text-muted-foreground">Redirecting to event...</p>
      </div>
    </div>
  );
} 