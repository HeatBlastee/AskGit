import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const uploadFile = async (
    file: File,
    onProgress?: (percent: number) => void
) => {
    try {
        // Sanitize filename
        let safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        let filePath = `uploads/${safeFileName}`;
        let counter = 1;

        // Check existing files
        const { data: existingFiles } = await supabase
            .storage
            .from("audio-files")
            .list("uploads/");

        const existingFileNames = existingFiles?.map((f) => f.name);

        while (existingFileNames?.includes(safeFileName)) {
            const nameParts = safeFileName.split(".");
            const extension = nameParts.pop();
            const baseName = nameParts.join(".");
            safeFileName = `${baseName}-${counter}.${extension}`;
            filePath = `uploads/${safeFileName}`;
            counter++;
        }

        // Use Supabase client upload
        const { data, error } = await supabase.storage
            .from("audio-files")
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false,
                onUploadProgress: (progressEvent: ProgressEvent) => {
                    if (onProgress && progressEvent.lengthComputable) {
                        const percent = Math.round(
                            (progressEvent.loaded / progressEvent.total) * 100
                        );
                        onProgress(percent);
                    }
                },
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from("audio-files")
            .getPublicUrl(filePath);

        return { success: true, url: urlData.publicUrl, data };
    } catch (err) {
        console.error("Upload error:", err);
        return { success: false, error: err };
    }
};
