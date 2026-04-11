import { useState, useEffect } from 'react';
import { BsArrowLeft, BsShop, BsClock, BsTelephone, BsGeoAlt, BsImage, BsClipboard, BsXCircle, BsCheckCircle } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { getRestaurantSettings, updateRestaurantSettings } from '../services/restaurantSettingsService';

const DAYS = [
  { key: 'monday', label: 'Pazartesi' },
  { key: 'tuesday', label: 'Salı' },
  { key: 'wednesday', label: 'Çarşamba' },
  { key: 'thursday', label: 'Perşembe' },
  { key: 'friday', label: 'Cuma' },
  { key: 'saturday', label: 'Cumartesi' },
  { key: 'sunday', label: 'Pazar' },
];

const PRESETS = [
  { label: '09:00 – 22:00', open: '09:00', close: '22:00' },
  { label: '10:00 – 23:00', open: '10:00', close: '23:00' },
  { label: '08:00 – 20:00', open: '08:00', close: '20:00' },
  { label: '11:00 – 00:00', open: '11:00', close: '00:00' },
];

function ManageSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getRestaurantSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ayarlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg('');
      const payload = {
        name: settings.name,
        logo_url: settings.logo_url,
        phone: settings.phone,
        address: settings.address,
        is_temporarily_closed: settings.is_temporarily_closed,
        temporary_close_message: settings.temporary_close_message,
      };
      DAYS.forEach((d) => {
        payload[d.key] = settings[d.key] || { open: null, close: null };
      });
      const updated = await updateRestaurantSettings(payload);
      setSettings(updated);
      setSuccessMsg('Ayarlar başarıyla kaydedildi.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateDayTime = (day, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value || null },
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-gold" role="status">
          <span className="visually-hidden">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Ayarlar yüklenemedi.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none mb-3 back-link" onClick={() => navigate('/seller/dashboard')}>
        <BsArrowLeft className="me-1" /> Geri
      </button>

      <h2 className="fw-bold section-title mb-4">Restoran Ayarları</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div className="row g-4">
        {/* Genel Bilgiler */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-dark-brown text-white d-flex align-items-center gap-2">
              <BsShop />
              <h5 className="mb-0 fw-bold">Genel Bilgiler</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Restoran Adı</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <BsTelephone className="me-1" /> Telefon
                </label>
                <input
                  type="tel"
                  className="form-control"
                  value={settings.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+90 555 123 4567"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <BsGeoAlt className="me-1" /> Adres
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={settings.address || ''}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Restoran adresi"
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <BsImage className="me-1" /> Logo URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  value={settings.logo_url || ''}
                  onChange={(e) => updateField('logo_url', e.target.value)}
                  placeholder="https://..."
                />
                {settings.logo_url && (
                  <div className="mt-2">
                    <img
                      src={settings.logo_url}
                      alt="Logo"
                      className="rounded border"
                      style={{ maxHeight: '80px', objectFit: 'contain' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Geçici Kapama */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark-brown text-white d-flex align-items-center gap-2">
              <BsShop />
              <h5 className="mb-0 fw-bold">Geçici Kapama</h5>
            </div>
            <div className="card-body">
              <div className="form-check form-switch mb-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  role="switch"
                  id="tempClosed"
                  checked={settings.is_temporarily_closed || false}
                  onChange={(e) => updateField('is_temporarily_closed', e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="tempClosed">
                  Restoran Geçici Olarak Kapalı
                </label>
              </div>
              {settings.is_temporarily_closed && (
                <div className="alert alert-warning mb-3">
                  <strong>Restoran şu anda kapalı.</strong> Müşteriler sipariş veremez.
                </div>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold">Kapanış Mesajı</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={settings.temporary_close_message || ''}
                  onChange={(e) => updateField('temporary_close_message', e.target.value)}
                  placeholder="Geçici kapanış sebebini yazınız..."
                />
              </div>
            </div>
          </div>

          {/* Kaydet butonu sağ üst */}
          <div className="mt-3 text-end">
            <button className="btn btn-gold btn-lg fw-bold px-5" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </div>

        {/* Çalışma Saatleri */}
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-dark-brown text-white d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <BsClock />
                <h5 className="mb-0 fw-bold">Çalışma Saatleri</h5>
              </div>
            </div>
            <div className="card-body">
              {/* Quick Presets */}
              <div className="mb-3">
                <label className="form-label fw-semibold small text-muted mb-2">Hızlı Şablon (Tüm Günlere Uygula)</label>
                <div className="d-flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setSettings((prev) => {
                          const updated = { ...prev };
                          DAYS.forEach((d) => {
                            updated[d.key] = { open: preset.open, close: preset.close };
                          });
                          return updated;
                        });
                      }}
                    >
                      <BsClock className="me-1" /> {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setSettings((prev) => {
                        const updated = { ...prev };
                        DAYS.forEach((d) => {
                          updated[d.key] = { open: null, close: null };
                        });
                        return updated;
                      });
                    }}
                  >
                    <BsXCircle className="me-1" /> Tümünü Kapat
                  </button>
                </div>
              </div>

              <hr />

              {/* Per-day rows */}
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '140px' }}>Gün</th>
                      <th style={{ width: '80px' }} className="text-center">Açık</th>
                      <th>Açılış</th>
                      <th>Kapanış</th>
                      <th style={{ width: '100px' }} className="text-center">Kopyala</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((d) => {
                      const dayData = settings[d.key] || {};
                      const isDayOpen = !!(dayData.open && dayData.close);
                      return (
                        <tr key={d.key} className={!isDayOpen ? 'table-light text-muted' : ''}>
                          <td className="fw-semibold">{d.label}</td>
                          <td className="text-center">
                            <div className="form-check form-switch d-flex justify-content-center mb-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                role="switch"
                                checked={isDayOpen}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Default to 09:00-22:00 when toggling on
                                    updateDayTime(d.key, 'open', '09:00');
                                    setSettings((prev) => ({
                                      ...prev,
                                      [d.key]: { open: '09:00', close: '22:00' },
                                    }));
                                  } else {
                                    setSettings((prev) => ({
                                      ...prev,
                                      [d.key]: { open: null, close: null },
                                    }));
                                  }
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              style={{ maxWidth: '140px' }}
                              value={dayData.open || ''}
                              disabled={!isDayOpen}
                              onChange={(e) => updateDayTime(d.key, 'open', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              style={{ maxWidth: '140px' }}
                              value={dayData.close || ''}
                              disabled={!isDayOpen}
                              onChange={(e) => updateDayTime(d.key, 'close', e.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            {isDayOpen && (
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                title="Bu saatleri diğer günlere kopyala"
                                onClick={() => {
                                  setSettings((prev) => {
                                    const updated = { ...prev };
                                    DAYS.forEach((otherDay) => {
                                      if (otherDay.key !== d.key) {
                                        updated[otherDay.key] = {
                                          open: dayData.open,
                                          close: dayData.close,
                                        };
                                      }
                                    });
                                    return updated;
                                  });
                                }}
                              >
                                <BsClipboard />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-muted small mt-2 mb-0">
                <BsCheckCircle className="me-1 text-success" />
                Açık/Kapalı düğmesiyle günleri hızlıca ayarlayabilirsiniz. Kopyala düğmesiyle bir günün saatlerini diğer günlere uygulayabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageSettings;
