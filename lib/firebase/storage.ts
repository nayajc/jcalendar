import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from './admin';
import type { Bucket } from '@google-cloud/storage';

export function getBucket(): Bucket {
  return getStorage(getAdminApp()).bucket();
}

/**
 * 버퍼를 Firebase Storage에 업로드하고 long-lived signed URL을 반환합니다.
 * signed URL 만료: 7년 (첨부파일은 변호사만 열람)
 */
export async function uploadBuffer(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: { contentType },
    resumable: false,
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 7 * 365 * 24 * 60 * 60 * 1000, // 7년
  });

  return url;
}
