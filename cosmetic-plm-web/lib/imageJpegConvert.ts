"use client";

// 원료 발주관리 "검수조서" 등 원료 사진 업로드용 - 휴대폰 카메라로 찍은 원본은 보통 수 MB~수십 MB라
// 그대로 Supabase Storage에 올리면 용량/업로드 시간이 부담스럽다. 업로드 직전 브라우저에서 캔버스로
// 가로/세로를 적당히 줄이고 JPEG로 재인코딩해서 보통 수백 KB 수준으로 낮춘다(검수조서는 사람이 육안으로
// 확인하는 사진이라 원본 해상도까지 필요하지 않음 - 긴 변 1600px, 품질 82% 정도면 충분히 또렷하다).
// 변환에 실패해도(예: 브라우저가 못 여는 포맷) 업로드 자체가 막히지 않도록 원본 파일을 그대로 반환한다.
export async function convertImageToJpeg(
  file: File,
  opts: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
  const maxDimension = opts.maxDimension ?? 1600;
  const quality = opts.quality ?? 0.82;

  try {
    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (!width || !height) return file;

    if (width > maxDimension || height > maxDimension) {
      const scale = maxDimension / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file; // 변환은 용량 최적화를 위한 보조 기능 - 실패해도 원본으로 업로드는 계속 진행
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 열 수 없습니다."));
    img.src = src;
  });
}
