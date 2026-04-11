import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

/**
 * Crop alanından canvas üzerinde kırpılmış blob üretir.
 */
function getCroppedImg(imageSrc, pixelCrop, outputSize = { width: 600, height: 600 }) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize.width;
      canvas.height = outputSize.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize.width,
        outputSize.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas boş — kırpma başarısız.'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.92,
      );
    };
    image.onerror = (e) => reject(e);
    image.src = imageSrc;
  });
}

/**
 * Görsel kırpma modalı.
 *
 * Props:
 *  - imageSrc : string          — kırpılacak görselin data-url veya blob-url'i
 *  - aspect   : number          — en/boy oranı (varsayılan 1 = kare)
 *  - outputSize: {width,height} — çıktı piksel boyutu (varsayılan 600×600)
 *  - onConfirm: (blob) => void  — kırpılmış blob
 *  - onCancel : () => void
 */
export default function ImageCropModal({
  imageSrc,
  aspect = 1,
  outputSize = { width: 600, height: 600 },
  onConfirm,
  onCancel,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      setProcessing(true);
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputSize);
      onConfirm(blob);
    } catch {
      alert('Görsel kırpılırken bir hata oluştu.');
    } finally {
      setProcessing(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ background: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-dark text-white">
            <h5 className="modal-title">Görseli Kırp</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              disabled={processing}
            />
          </div>

          <div className="modal-body p-0" style={{ height: '460px', position: 'relative', background: '#111' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="modal-footer justify-content-between">
            <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '300px' }}>
              <label className="form-label mb-0 small text-muted" style={{ whiteSpace: 'nowrap' }}>Yakınlaştır</label>
              <input
                type="range"
                className="form-range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={processing}
              >
                İptal
              </button>
              <button
                className="btn btn-gold"
                onClick={handleConfirm}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" />
                    Kırpılıyor...
                  </>
                ) : (
                  'Kırp ve Yükle'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

