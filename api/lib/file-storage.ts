import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'shipment-documents';

export async function uploadFile(
  fileName: string,
  mimeType: string,
  fileContent: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const buffer = Buffer.from(fileContent, 'base64');
  const uniqueFileName = `${Date.now()}-${fileName}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(uniqueFileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uniqueFileName);

  return {
    id: data.path,
    name: fileName,
    webViewLink: urlData.publicUrl,
  };
}

export async function deleteFile(fileId: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileId]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

export async function getFile(fileId: string): Promise<{ name: string; mimeType: string; data: Buffer }> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(fileId);

  if (error) {
    throw new Error(`Download failed: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  
  return {
    name: fileId.split('/').pop() || fileId,
    mimeType: data.type,
    data: Buffer.from(arrayBuffer),
  };
}
