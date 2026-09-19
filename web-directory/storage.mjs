export const STATE_KEY = 'skkugit.demo.v1';
const DB_NAME = 'skkugit.photos.v1';
let dbPromise;

export function loadState(storage = localStorage) {
  const raw = storage.getItem(STATE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

export function saveState(state, storage = localStorage) {
  storage.setItem(STATE_KEY, JSON.stringify(state));
}

function database() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('이 브라우저에서는 사진 보관함을 사용할 수 없어요.'));
  if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); dbPromise = undefined; };
      resolve(db);
    };
    request.onerror = () => { dbPromise = undefined; reject(request.error); };
    request.onblocked = () => { dbPromise = undefined; reject(new Error('다른 스꾸깃 탭을 닫고 다시 시도해 주세요.')); };
  });
  return dbPromise;
}

async function photoTransaction(mode, operation) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', mode);
    let result;
    const request = operation(tx.objectStore('photos'));
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error('사진 보관함을 읽지 못했어요.'));
    tx.onabort = () => reject(tx.error || new Error('사진 저장이 중단됐어요.'));
  });
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ORIGINAL_PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif']);
const STICKER_PHOTO_TYPES = new Set(['image/png', 'image/webp']);

function assertRasterBlob(blob, allowedTypes, label) {
  if (!(blob instanceof Blob)) throw new Error(`${label}은(는) 이미지 파일(Blob)이어야 해요.`);
  if (!blob.size) throw new Error(`${label}이(가) 비어 있어요.`);
  if (blob.size > MAX_PHOTO_BYTES) throw new Error(`${label}이(가) 너무 커요. 2MB 이하만 저장할 수 있어요.`);
  if (!allowedTypes.has(blob.type)) throw new Error(`${label} 형식을 지원하지 않아요.`);
}

// A photo record is either:
// - a legacy Blob (pre-v2): the single "displayed" image, restored as { version: 2, originalBlob, stickerBlob: null }.
// - a v2 record { version: 2, originalBlob, stickerBlob: Blob|null }, where stickerBlob is the
//   background-removed cutout (from @imgly/background-removal) shown in place of originalBlob when present.
// Legacy Blob compatibility intentionally checks only "is a Blob" and "nonempty" — it must not impose
// the newer type/size limits that did not exist when those Blobs were written.
export function normalizePhotoRecord(value) {
  if (value === undefined || value === null) return null;
  if (value instanceof Blob) {
    if (!value.size) throw new Error('저장된 사진이 비어 있어요.');
    return { version: 2, originalBlob: value, stickerBlob: null };
  }
  if (typeof value === 'object' && value.version === 2) {
    assertRasterBlob(value.originalBlob, ORIGINAL_PHOTO_TYPES, '원본 사진');
    if (value.stickerBlob !== null && value.stickerBlob !== undefined) {
      assertRasterBlob(value.stickerBlob, STICKER_PHOTO_TYPES, '스티커 이미지');
    }
    return { version: 2, originalBlob: value.originalBlob, stickerBlob: value.stickerBlob ?? null };
  }
  throw new Error('사진 데이터 형식을 알 수 없어요.');
}

function isPhotoRecordShape(value) {
  return value !== null && typeof value === 'object' && !(value instanceof Blob);
}

// New v2 records are validated before the IndexedDB transaction even opens, so a bad record never
// reaches storage. Legacy direct-Blob writes (compressPhoto's output) are stored as before, unchanged.
export async function putPhoto(id, value) {
  if (isPhotoRecordShape(value)) normalizePhotoRecord(value);
  return photoTransaction('readwrite', store => store.put(value, id));
}

export async function getPhotoRecord(id) {
  const raw = await photoTransaction('readonly', store => store.get(id));
  return normalizePhotoRecord(raw);
}

// Backward-compatible: returns the single Blob that should be displayed, exactly like before v2 existed.
export async function getPhoto(id) {
  const record = await getPhotoRecord(id);
  return record ? (record.stickerBlob ?? record.originalBlob) : undefined;
}

export const deletePhoto = id => photoTransaction('readwrite', store => store.delete(id));
export const clearPhotos = () => photoTransaction('readwrite', store => store.clear());

// Metadata is committed only after the photo transaction succeeds.
// A failed metadata write rolls back the newly inserted photo, without changing UI state.
export async function commitPhoto(state, id, blob, io = { putPhoto, deletePhoto, saveState }) {
  await io.putPhoto(id, blob);
  try {
    io.saveState(state);
  } catch (error) {
    try { await io.deletePhoto(id); } catch { /* orphan can be removed by full reset */ }
    throw error;
  }
}

export async function resetStorage(storage = localStorage) {
  await clearPhotos();
  storage.removeItem(STATE_KEY);
}

export async function compressPhoto(file) {
  if (!(file instanceof Blob) || !file.size) throw new Error('비어 있지 않은 사진을 선택해 주세요.');
  if (file.size > 20 * 1024 * 1024) throw new Error('20MB 이하의 사진을 선택해 주세요.');
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif'].includes(file.type)) {
    throw new Error('JPEG, PNG, WebP 등 일반 사진 파일을 선택해 주세요. SVG는 사용할 수 없어요.');
  }
  let bitmap;
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { throw new Error('이 사진 형식을 읽지 못했어요. JPEG나 PNG로 바꿔 선택해 주세요.'); }
  try {
    if (bitmap.width * bitmap.height > 60_000_000) throw new Error('사진이 너무 커요. 6천만 화소 이하로 줄여주세요.');
    let edge = 1600;
    for (let attempt = 0; attempt < 2; attempt++) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('사진 미리보기를 만들지 못했어요.');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .8));
      if (!blob) throw new Error('사진 압축에 실패했어요. 다른 사진을 선택해 주세요.');
      if (blob.size <= 2 * 1024 * 1024) return { blob, width: canvas.width, height: canvas.height };
      edge = 1024;
    }
    throw new Error('압축해도 사진이 커요. 다른 사진이나 더 작은 파일을 선택해 주세요.');
  } finally { bitmap.close(); }
}

export function storageMessage(error) {
  if (error?.name === 'QuotaExceededError') return '기기 저장 공간이 부족해요. 변경을 저장하지 못했고, 입력은 그대로 남아 있어요.';
  if (error?.name === 'SecurityError') return '브라우저가 기기 저장을 막고 있어요. 사이트 데이터 저장을 허용한 뒤 다시 시도해 주세요.';
  return error?.message || '기기에 저장하지 못했어요. 입력을 유지했으니 다시 시도해 주세요.';
}
