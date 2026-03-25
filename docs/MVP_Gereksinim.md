# Restoran Sipariş Sistemi

## MVP Teknik Gereksinim Dokümanı

------------------------------------------------------------------------

# 1. Proje Tanımı

Bu proje, bir restoranın müşterilerinden **web üzerinden sipariş
almasını sağlayan bir sipariş yönetim sistemidir**.

Sistem aşağıdaki bileşenlerden oluşur:

-   müşteri sipariş web sitesi
-   restoran admin paneli
-   sipariş yönetim backend servisi
-   QR kod menü erişimi

Bu sistem:

-   herhangi bir marketplace değildir
-   yalnızca **tek restoran için çalışır**
-   kullanıcı üyeliği içermez
-   online ödeme içermez (MVP)

------------------------------------------------------------------------

# 2. Sistem Bileşenleri

Sistem dört ana bileşenden oluşacaktır:

### 1️⃣ Public müşteri sitesi

Müşteriler menüyü görüntüler ve sipariş verir.

### 2️⃣ Admin paneli

Restoran sahibi siparişleri ve menüyü yönetir.

### 3️⃣ Backend API

Sipariş ve menü işlemlerini yönetir.

### 4️⃣ Veritabanı

Tüm sistem verileri PostgreSQL'de saklanır.

------------------------------------------------------------------------

# 3. Teknoloji Stack

## Frontend

React

İki ayrı frontend olacaktır: - müşteri sipariş sitesi - admin paneli

## Backend

Python tabanlı REST API

Backend sorumlulukları: - sipariş oluşturma - ürün yönetimi - kategori
yönetimi - admin authentication - sipariş durum yönetimi

## Veritabanı

PostgreSQL

------------------------------------------------------------------------

# 4. Sistem Kullanıcıları

## 4.1 Admin Kullanıcı

Restoran sahibi veya çalışanıdır.

Yetkileri:

-   ürün yönetimi
-   kategori yönetimi
-   fiyat güncelleme
-   stok yönetimi
-   sipariş görüntüleme
-   Geçmiş, iade ve iptal siparişler
-   finans, ekstre raporları
-   sipariş durum güncelleme
-   restoran ayarlarını değiştirme
-   Tüm ürünlere yüzdesel indirim uygulama
-   kategori bazlı indirim uygulama
-   müşteri destek alanı yönetme

## 4.2 Müşteri

Sisteme giriş yapmaz.

Yapabilecekleri:

-   menüyü görüntüleme
-   ürün seçme
-   ürün arama
-   ürün filtreleme
-   restoran iletişim (chatbox vb.)
-   sepete ekleme
-   sipariş oluşturma

------------------------------------------------------------------------

# 5. Admin Kullanıcı Yönetimi

Admin kullanıcı oluşturma **manuel yapılacaktır**.

Admin kullanıcı veritabanına doğrudan eklenir.

Alanlar:

-   id
-   email
-   password_hash
-   name
-   role
-   created_at

### Şifre güvenliği

-   şifreler hash olarak saklanmalıdır
-   plaintext şifre tutulmamalıdır

------------------------------------------------------------------------

# 6. Admin Authentication

Admin paneline erişmek için login gerekir.

### Login alanları

-   email
-   password

### Login akışı

1.  admin login sayfasına gider
2.  email ve şifre girer
3.  backend doğrulama yapar
4.  başarılıysa token/session oluşturulur
5.  admin panel erişimi verilir

### Güvenlik

-   başarısız login denemeleri sınırlanmalıdır
-   token expiration olmalıdır
-   logout endpoint olmalıdır

------------------------------------------------------------------------

# 7. Şifre Sıfırlama

MVP için şifre sıfırlama manuel yapılacaktır.

Super admin veya geliştirici veritabanında şifreyi güncelleyebilir.

Opsiyonel olarak ileride email reset sistemi eklenebilir.

------------------------------------------------------------------------

# 8. Public Müşteri Sitesi

## Landing Page

Gösterilen bilgiler:

-   restoran adı
-   logo
-   açıklama
-   adres
-   telefon

------------------------------------------------------------------------

## Menü Sayfası

Menü kategori bazlı listelenir.

Örnek kategoriler:

-   tatlılar
-   içecekler
-   atıştırmalıklar

------------------------------------------------------------------------

## Ürün Kartı

Her ürün için:

-   ürün adı
-   açıklama
-   fiyat
-   görsel
-   ürün opsiyonları
-   sepete ekle butonu

------------------------------------------------------------------------

## Ürün Seçenekleri

Bazı ürünlerde seçenekler olabilir.

Örnek:

Waffle: - hamur tipi - sos - ekstra

------------------------------------------------------------------------

## Sepet

Sepette:

-   ürün listesi
-   adet
-   seçenekler
-   toplam fiyat
-   minimum sepet tutarı (adrese göre)

------------------------------------------------------------------------

## Sipariş Formu

Sipariş verirken müşteri:

-   ad soyad
-   telefon
-   adres
-   kurumsal müşteriler için vkn
-   teslimat (gel al seçeneği eklenebilir)
-   ödeme türü (kart, nakit)
-   sipariş notu

girer.

------------------------------------------------------------------------

## Sipariş Onayı

Sipariş oluşturulduktan sonra:

-   sipariş numarası gösterilir
-   sipariş onay ekranı gösterilir
-   tahmini teslimat süresi

------------------------------------------------------------------------

## Sipariş Takibi / Sipariş Görüntüleme (Üyelik Yok)

Müşteri sisteme giriş yapmayacağı için sipariş oluşturulduktan sonra siparişi görüntüleyebilmesi için aşağıdaki yöntemlerden en az biri MVP kapsamında desteklenmelidir:

-   **Link ile görüntüleme:** Sipariş sonrası müşterinin **email** adresine ve/veya **WhatsApp** üzerinden sipariş detay ekranına giden bir link gönderilir.
-   **Kod ile görüntüleme:** Müşteri UI üzerinden **sipariş kodu/numarası** ve **email adresini** girerek sipariş detayını görüntüler.

Güvenlik notu (MVP): Link veya kod tabanlı erişim, sipariş bilgilerini ifşa etmeyecek şekilde kurgulanmalıdır (tahmin edilebilir link/kod olmamalı).

------------------------------------------------------------------------

# 9. Sipariş Yönetimi

## Sipariş Listesi

Admin panelde:

-   sipariş numarası
-   müşteri adı
-   telefon
-   adres
-   sipariş zamanı
-   toplam tutar
-   sipariş durumu
-   teslimat türü
-   ödeme türü (kart, nakit)
-   sipariş detay slip (mutfak için)

görüntülenir.

------------------------------------------------------------------------

## Sipariş Detayı

Sipariş detayında:

-   ürün listesi
-   adet
-   seçenekler
-   müşteri notu

------------------------------------------------------------------------

## Sipariş Durumları

-   new
-   confirmed
-   preparing
-   ready
-   delivered
-   cancelled
-   returned

------------------------------------------------------------------------

# 10. Menü Yönetimi

## Kategori Yönetimi

Admin:

-   kategori ekler
-   kategori düzenler
-   kategori siler
-   kategori sıralar

Alanlar:

-   name
-   description
-   sort_order
-   is_active

------------------------------------------------------------------------

## Ürün Yönetimi

Admin:

-   ürün adı
-   açıklama
-   fiyat
-   ürün görseli
-   kategori
-   stok durumu
-   aktif/pasif

yönetir.

------------------------------------------------------------------------

## Stok Yönetimi

MVP için basit model:

-   available
-   unavailable

------------------------------------------------------------------------

# 11. Çalışma Saatleri

Admin:

-   açılış saati
-   kapanış saati
-   haftanın günleri
-   geçici kapatma

ayarlayabilir.

------------------------------------------------------------------------

# 12. QR Menü

QR kod müşteriyi menü sayfasına yönlendirir.

Kullanım:

-   masa menüsü
-   temassız menü
-   restoran içi sipariş

------------------------------------------------------------------------

# 13. Bildirimler

Yeni sipariş geldiğinde:

-   admin panel bildirimi
-   opsiyonel email bildirimi
-   opsiyonel WhatsApp mesajı

gönderilebilir.

------------------------------------------------------------------------

# 14. Veritabanı Minimum Tablolar

-   users
-   categories
-   products
-   product_prices
-   product_options
-   orders
-   order_items
-   order_item_options
-   order_stages
-   restaurant_settings

------------------------------------------------------------------------

# 15. Güvenlik

Sistem şu güvenlik önlemlerini içermelidir:

-   admin authentication
-   input validation
-   rate limiting
-   SQL injection önlemleri
-   XSS önlemleri

------------------------------------------------------------------------

# 16. MVP Başarı Kriterleri

-   menü düzgün görüntülenmeli
-   sipariş oluşturma çalışmalı
-   admin siparişleri görebilmeli
-   ürün ve fiyat güncelleme çalışmalı
-   QR menü erişimi çalışmalı

------------------------------------------------------------------------

# 17. Gelecek Özellikler

-   online ödeme
-   müşteri hesabı
-   sadakat sistemi
-   kampanya sistemi
-   performans metrikleri
-   WhatsApp chatbot
-   masa bazlı sipariş
-   raporlama sistemi
