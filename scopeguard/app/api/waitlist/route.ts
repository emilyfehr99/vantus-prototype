import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.warn("Failed to init Supabase client", e);
    }
}

export async function POST(req: Request) {
    try {
        const { email, role } = await req.json();

        if (!email || !role) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Insert into Supabase
        // Requires a 'waitlist' table with columns: id, created_at, email, role
        if (supabase) {
            const { error } = await supabase
                .from("waitlist")
                .insert([{ email, role }]);

            if (error) {
                console.error("Supabase Error:", error);
                // Don't fail the request for the user if it's a backend config issue, just log it.
                // But realistically we should return error if critical.
                // For now, let's assume if creds exist, we expect it to work.
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        } else {
            console.warn("Supabase credentials missing. Mocking success.");
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
