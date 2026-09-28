# Cheness kullanım kılavuzu

Adres: **https://enesturksal.github.io/cheness/** — telefon, tablet ve bilgisayarda aynı adres.
Sunucu yok: girdiğin her şey (Lichess girişi, kullanıcı adları, ayarlar, süren oyun) yalnızca o
cihazın tarayıcısında saklanır.

## Kurulum (telefon)

1. Adresi Chrome (Android) veya Safari (iPhone) ile aç.
2. Tarayıcı menüsünden **"Ana ekrana ekle"** de. Cheness ikonuyla, tam ekran açılır.
3. İlk açılışta motor (1,8 MB) ve açılış kitabı indirilip önbelleğe alınır; sonrasında internet
   yokken de bot, kitap ve analiz çalışır. Canlı istatistikler ve teori için internet gerekir.

Bilgisayarda kurulum gerekmez; adresi aç. Chrome'da adres çubuğundaki "yükle" ikonuyla
pencere uygulaması olarak da ekleyebilirsin.

## İlk ayar: Profil

Üst çubuktaki kişi ikonu veya ana ekrandaki **Profil** kartı.

- **Lichess ile giriş yap**: Lichess'e yönlendirir, onaylarsın, geri döner. Canlı açılış
  istatistikleri (milyarlarca oyun), Ustalar veritabanı ve Lichess oyun arşivin bununla açılır.
  Alternatif: lichess.org/account/oauth/token adresinden **hiçbir kutuyu işaretlemeden** token
  oluşturup yapıştır.
- **Kullanıcı adları**: "Oyunlarım" için Lichess adı girişten otomatik dolar; chess.com adını
  elle yaz.
- Dil (Türkçe/İngilizce) ve tema.

Token'ı kimseyle paylaşma; hesabın adına işlem yapabilir.

## Ana ekran

| Kart                 | Ne yapar                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Oyna**             | Taraf (Beyaz/Siyah/Rastgele) ve zorluk seç, Stockfish'e karşı oyna. "Tutor açık" işaretliyse açılış paneli çalışır.                     |
| **Analiz et**        | Lichess veya chess.com'dan kopyaladığın PGN'i ya da bir Lichess oyun linkini yapıştır; oyun hamle hamle notlanır, Rapor sekmesi açılır. |
| **Arkadaşınla oyna** | Aynı cihazda sırayla; tahta her hamlede döner.                                                                                          |
| **Açılışlar**        | Lichess'ten canlı ağaç (giriş gerekli), popüler açılışlar, kitaptaki 149 ailenin tamamı (arama var). Her hattan ♔ veya ♚ olarak çalış.  |
| **Kütüphane**        | ECO cilt → aile → varyant: 3.815 adlandırılmış hat, tahtada adım adım.                                                                  |
| **Oyunlarım**        | Lichess/chess.com'dan son oyunlarını çek, incele, açılış başına skor tablosu.                                                           |
| **Profil**           | Giriş, kullanıcı adları, dil, tema.                                                                                                     |

## Oyun ekranı

Tahtanın altında: açılış adı ve ECO kodu (kitap dışına çıkınca "kitap dışı" etiketi), hamle
listesi, değerlendirme çubuğu ve son hamlenin notu (Kitap / En iyi / Harika / Mükemmel / İyi /
Hatalı / Hata / Vahim hata; hata varsa "en iyisi: …").

Düğmeler: başa/geri/ileri/sona, tahtayı çevir, **göz** (oklar), **+** (yeni oyun → ana ekran).
Bot moduna özel: "Rakibi ben oynatayım" ve zorluk (yeni seviye botun bir sonraki hamlesinden
itibaren geçerli).

**Göz düğmesi**: en çok oynanan 3 devam yolu yeşil oklarla çizilir; en yoğun ok en çok oynanan.
Explorer verisi yoksa mavi oklarla motorun ilk 3 önerisi ve değerlendirmesi çizilir.

Paneldeki sekmeler:

- **Açılış**: Lichess/Ustalar havuzunda popüler devamlar (yüzde, Beyaz/berabere/Siyah barı, her
  hamlenin götürdüğü varyant). Bir satıra dokun → ok; tekrar dokun → oyna. Uzun bas → o hamleyi
  rakip adına oyna. Altta yerel kitaptaki adlandırılmış devamlar.
- **Teori**: o hat için Wikibooks açılış teorisi (İngilizce), sayfa yoksa en yakın üst hat.
- **Hamleler**: notasyon; hamleye dokununca o pozisyona gider. Rozetler hamle kalitesi.
- **Rapor**: taraf başına doğruluk yüzdesi, hamle türü sayıları, incelenecek hatalar listesi,
  "Buradan bota karşı oyna".
- **Ayarlar**: mod, taraf, zorluk, tutor/ok/ipucu seçenekleri, analiz derinliği, rating aralığı
  ve tempo filtreleri, tema, dil.

## Küçük ipuçları

- Zorluk oyun ortasında değiştirilebilir; bir sonraki hamleden itibaren etkili olur.
- Rating aralığını kendi seviyene göre daralt (Ayarlar → Rating aralığı); yüzdeler o gruptaki
  oyunlara göre gelir.
- Analiz derinliği telefonda "Hızlı" ile başlasın; Lichess bulut değerlendirmeleri açık kaldıkça
  bilinen pozisyonlar zaten çok derin gelir.
- Geri al (◀) bot modunda kendi sırana kadar geri alır; sonra farklı hamle oynayabilirsin.
