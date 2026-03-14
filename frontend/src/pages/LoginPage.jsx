import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BsMoonStars, BsPersonPlus } from 'react-icons/bs';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  login,
  register,
  clearAuthError,
  clearRegisterSuccess,
  selectIsAuthenticated,
  selectIsSeller,
} from '../redux/authSlice';

const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

const initialRegForm = {
  name: '',
  surname: '',
  firm_name: '',
  tax_number: '',
  phone: '',
  email: '',
  password: '',
  address_line1: '',
  address_line2: '',
  city: '',
  district: '',
  post_code: '',
};

function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, registerSuccess } = useSelector((state) => state.auth);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSeller = useSelector(selectIsSeller);

  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});

  const [regForm, setRegForm] = useState(initialRegForm);
  const [regErrors, setRegErrors] = useState({});

  const [loginTurnstileToken, setLoginTurnstileToken] = useState(null);
  const [regTurnstileToken, setRegTurnstileToken] = useState(null);

  useEffect(() => {
    if (isAuthenticated && isSeller) {
      navigate('/seller/dashboard');
    }
  }, [isAuthenticated, isSeller, navigate]);

  useEffect(() => {
    if (registerSuccess) {
      setMode('login');
      setLoginEmail(regForm.email);
      setLoginPassword('');
      setRegForm(initialRegForm);
      setRegErrors({});
      dispatch(clearRegisterSuccess());
    }
  }, [registerSuccess, regForm.email, dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
      dispatch(clearRegisterSuccess());
    };
  }, [dispatch]);

  const switchMode = (newMode) => {
    setMode(newMode);
    dispatch(clearAuthError());
    setLoginErrors({});
    setRegErrors({});
  };

  // --- Login ---
  const validateLogin = () => {
    const errs = {};
    if (!emailRegex.test(loginEmail)) errs.email = 'Lütfen geçerli bir email giriniz';
    if (loginPassword.length < 6) errs.password = 'Şifreniz en az 6 karakterden oluşmalıdır';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    if (!loginTurnstileToken) {
        setLoginErrors((prev) => ({ ...prev, turnstileToken: 'Please complete the reCAPTCHA' }));
        return;
    }
    dispatch(login({ email: loginEmail, password: loginPassword, turnstileToken: loginTurnstileToken }));
    setLoginTurnstileToken(null);
  };

  // --- Register ---
  const updateReg = (field, value) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
    if (regErrors[field]) setRegErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateRegister = () => {
    const errs = {};
    if (!regForm.name.trim()) errs.name = 'İsim giriniz';
    if (!regForm.surname.trim()) errs.surname = 'Soyisim giriniz';
    if (!regForm.firm_name.trim()) errs.firm_name = 'Firma adı giriniz';
    if (!regForm.tax_number.trim() || !/^\d{10,}$/.test(regForm.tax_number.trim()))
      errs.tax_number = 'Vergi numarası en az 10 haneden oluşmalıdır.';
    const cleanPhone = regForm.phone.replace(/[\s\-()]/g, '');
    if (!cleanPhone.replace('+', '').match(/^\d{10,}$/))
      errs.phone = 'Lütfen geçerli bir telefon numarası giriniz';
    if (!emailRegex.test(regForm.email)) errs.email = 'Lütfen geçerli bir email giriniz';
    if (regForm.password.length < 6) errs.password = 'Şifreniz en az 6 karakterden oluşmalıdır';
    if (!regForm.address_line1.trim()) errs.address_line1 = '1. adres satırı giriniz';
    if (!regForm.city.trim()) errs.city = 'Şehir giriniz';
    if (!regForm.district.trim()) errs.district = 'İlçe giriniz';
    if (!regForm.post_code.trim()) errs.post_code = 'Posta kodu giriniz';
    setRegErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    if (!regTurnstileToken) {
        setRegErrors((prev) => ({ ...prev, turnstile: 'Please complete the CAPTCHA' }));
        return;
    }
    dispatch(register({ formData: regForm, turnstileToken: regTurnstileToken }));
    setRegTurnstileToken(null);
  };

  const fieldClass = (err) => `form-control${err ? ' is-invalid' : ''}`;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className={mode === 'login' ? 'col-md-5' : 'col-md-8'}>
          <div className="card border-0 shadow">
            <div className="card-header bg-dark-brown text-center py-4">
              {mode === 'login' ? (
                <>
                  <BsMoonStars size={40} className="text-gold mb-2" />
                  <h3 className="text-white mb-0">Satıcı girişi</h3>
                </>
              ) : (
                <>
                  <BsPersonPlus size={40} className="text-gold mb-2" />
                  <h3 className="text-white mb-0">Satıcı olun</h3>
                </>
              )}
            </div>
            <div className="card-body p-4">
              {/* Tab Buttons */}
              <div className="d-flex mb-4">
                <button
                  type="button"
                  className={`btn flex-fill me-1 ${mode === 'login' ? 'btn-gold' : 'btn-outline-secondary'}`}
                  onClick={() => switchMode('login')}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  className={`btn flex-fill ms-1 ${mode === 'register' ? 'btn-gold' : 'btn-outline-secondary'}`}
                  onClick={() => switchMode('register')}
                >
                  Üye ol
                </button>
              </div>

              {/* Server Error */}
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {typeof error === 'string' ? error : 'An error occurred. Please try again.'}
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} noValidate>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email *</label>
                    <input
                      type="email"
                      className={fieldClass(loginErrors.email)}
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: null })); }}
                      placeholder="seller@example.com"
                    />
                    {loginErrors.email && <div className="invalid-feedback">{loginErrors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Şifre *</label>
                    <input
                      type="password"
                      className={fieldClass(loginErrors.password)}
                      value={loginPassword}
                      onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: null })); }}
                      placeholder="Şifrenizi giriniz"
                    />
                    {loginErrors.password && <div className="invalid-feedback">{loginErrors.password}</div>}
                     <div className="mb-3 mt-3">
                      <Turnstile
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                          setLoginTurnstileToken(token);
                          setLoginErrors((prev) => ({ ...prev, turnstileToken: null }));
                          }}
                      onExpire={() => setLoginTurnstileToken(null)}
                      />
                      {loginErrors.turnstile && (
                          <div className="text-danger small mt-1">{loginErrors.turnstile}</div>
                          )}
                      </div>
                  </div>
                  <button type="submit" className="btn btn-gold w-100 fw-bold py-2" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Giriş Yapılıyor...</>
                    ) : 'Giriş Yap'}
                  </button>
                  <p className="text-center text-muted mt-3 mb-0">
                    Hesabınız yok mu?{' '}
                    <button type="button" className="btn btn-link p-0 fw-semibold" onClick={() => switchMode('üye ol')}>
                      Burdan üye ol
                    </button>
                  </p>
                </form>
              )}

              {/* Register Form */}
              {mode === 'register' && (
                <form onSubmit={handleRegister} noValidate>
                  <h6 className="fw-bold text-muted mb-3 border-bottom pb-2">Kişisel bilgi</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">İsim *</label>
                      <input type="text" className={fieldClass(regErrors.name)} value={regForm.name} onChange={(e) => updateReg('name', e.target.value)} placeholder="isminiz" />
                      {regErrors.name && <div className="invalid-feedback">{regErrors.name}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Soyisim *</label>
                      <input type="text" className={fieldClass(regErrors.surname)} value={regForm.surname} onChange={(e) => updateReg('surname', e.target.value)} placeholder="Soyisminiz" />
                      {regErrors.surname && <div className="invalid-feedback">{regErrors.surname}</div>}
                    </div>
                  </div>
                  <h6 className="fw-bold text-muted mb-3 border-bottom pb-2">Kurumasl bilgiler</h6>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Firma adı *</label>
                      <input type="text" className={fieldClass(regErrors.firm_name)} value={regForm.firm_name} onChange={(e) => updateReg('firm_name', e.target.value)} placeholder="Firma adınız" />
                      {regErrors.firm_name && <div className="invalid-feedback">{regErrors.firm_name}</div>}
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">Vergi numarası *</label>
                      <input type="text" className={fieldClass(regErrors.tax_number)} value={regForm.tax_number} onChange={(e) => updateReg('tax_number', e.target.value)} placeholder="Vergi numaranız" />
                      {regErrors.tax_number && <div className="invalid-feedback">{regErrors.tax_number}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold text-muted mb-3 border-bottom pb-2">İletişim bilgisileri</h6>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Telefon *</label>
                      <input type="tel" className={fieldClass(regErrors.phone)} value={regForm.phone} onChange={(e) => updateReg('phone', e.target.value)} placeholder="+90 555 123 4567" />
                      {regErrors.phone && <div className="invalid-feedback">{regErrors.phone}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Email *</label>
                      <input type="email" className={fieldClass(regErrors.email)} value={regForm.email} onChange={(e) => updateReg('email', e.target.value)} placeholder="seller@example.com" />
                      {regErrors.email && <div className="invalid-feedback">{regErrors.email}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Şifre *</label>
                      <input type="password" className={fieldClass(regErrors.password)} value={regForm.password} onChange={(e) => updateReg('password', e.target.value)} placeholder="En az 6 karakter" />
                      {regErrors.password && <div className="invalid-feedback">{regErrors.password}</div>}
                    </div>
                  </div>

                  <h6 className="fw-bold text-muted mb-3 border-bottom pb-2">Adres bilgileri</h6>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">1. Adres satırı *</label>
                    <input type="text" className={fieldClass(regErrors.address_line1)} value={regForm.address_line1} onChange={(e) => updateReg('address_line1', e.target.value)} placeholder="Mahalle, sokak no." />
                    {regErrors.address_line1 && <div className="invalid-feedback">{regErrors.address_line1}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">2. Adres satırı</label>
                    <input type="text" className="form-control" value={regForm.address_line2} onChange={(e) => updateReg('address_line2', e.target.value)} placeholder="Apartman, bina no. (opsiyonel)" />
                  </div>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Şehir *</label>
                      <input type="text" className={fieldClass(regErrors.city)} value={regForm.city} onChange={(e) => updateReg('city', e.target.value)} placeholder="Ankara" />
                      {regErrors.city && <div className="invalid-feedback">{regErrors.city}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">İlçe *</label>
                      <input type="text" className={fieldClass(regErrors.district)} value={regForm.district} onChange={(e) => updateReg('district', e.target.value)} placeholder="Çankaya" />
                      {regErrors.district && <div className="invalid-feedback">{regErrors.district}</div>}
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label fw-semibold">Posta kodu *</label>
                      <input type="text" className={fieldClass(regErrors.post_code)} value={regForm.post_code} onChange={(e) => updateReg('post_code', e.target.value)} placeholder="posta kodunuz" />
                      {regErrors.post_code && <div className="invalid-feedback">{regErrors.post_code}</div>}
                    </div>
                  </div>
                  <div className="mb-3 mt-3">
                      <Turnstile
                      siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                      onSuccess={(token) => {
                       setRegTurnstileToken(token);
                       setRegErrors((prev) => ({...prev, turnstileToken: null}))
                      }}
                      onExpire={() => setRegTurnstileToken(null)}
                      />
                      {regErrors.turnstile && <div className="text-danger small mt-1">{regErrors.turnstile}</div>}
                  </div>

                  <button type="submit" className="btn btn-gold w-100 fw-bold py-2" disabled={loading}>
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Hesap oluşturuluyor</>
                    ) : 'Hesabı oluştur'}
                  </button>
                  <p className="text-center text-muted mt-3 mb-0">
                    Zaten hesabınız var mı?{' '}
                    <button type="button" className="btn btn-link p-0 fw-semibold" onClick={() => switchMode('login')}>
                      Giriş Yap
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
