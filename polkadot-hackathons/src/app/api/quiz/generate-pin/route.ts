import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Generate a unique 6-digit PIN
    const { data: pinData, error } = await supabase.rpc('generate_quiz_pin');
    
    if (error) {
      // Fallback: generate PIN manually
      let pin: string;
      let attempts = 0;
      
      do {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
        
        // Check if PIN already exists
        const { data: existingRoom } = await supabase
          .from("quiz_rooms")
          .select("id")
          .eq("pin", pin)
          .single();
          
        if (!existingRoom) break;
      } while (attempts < 100);
      
      if (attempts >= 100) {
        return NextResponse.json(
          { error: "Unable to generate unique PIN" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ pin });
    }
    
    return NextResponse.json({ pin: pinData });
  } catch (error) {
    console.error("Error generating PIN:", error);
    return NextResponse.json(
      { error: "Failed to generate PIN" },
      { status: 500 }
    );
  }
}
