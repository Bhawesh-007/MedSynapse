const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function getSampleReports() {
  const res = await fetch(`${API_BASE_URL}/api/sample-reports`);
  if (!res.ok) throw new Error('Failed to load sample reports');
  return await res.json();
}

export async function parseReportOCR({ file, rawText, diseaseType = 'all' }) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  if (rawText) {
    formData.append('raw_text', rawText);
  }
  formData.append('disease_type', diseaseType);

  const res = await fetch(`${API_BASE_URL}/api/ocr/parse-report`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'OCR processing failed');
  }
  return await res.json();
}

export async function predictDiabetes(params) {
  const res = await fetch(`${API_BASE_URL}/api/predict/diabetes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Diabetes prediction failed');
  }
  return await res.json();
}

export async function predictHeart(params) {
  const res = await fetch(`${API_BASE_URL}/api/predict/heart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Heart prediction failed');
  }
  return await res.json();
}

export async function predictXRay(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/predict/xray`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'X-Ray analysis failed');
  }
  return await res.json();
}

export async function predictMRI(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/predict/mri`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'MRI analysis failed');
  }
  return await res.json();
}
