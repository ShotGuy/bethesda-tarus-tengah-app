import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadFile(file: File, bucket: string, folder: string = ""): Promise<string> {
    const fileName = `${folder}${Date.now()}_${file.name}`;

    // Use Service Role Key for server-side uploads to bypass RLS
    // Fallback to Anon key if Service Key is not set (but this might fail RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const adminSupabase = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const { data, error } = await adminSupabase.storage.from(bucket).upload(fileName, file, {
        contentType: file.type,
        upsert: false
    });

    if (error) {
        console.error("Supabase Upload Error:", error);
        throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = adminSupabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
}
