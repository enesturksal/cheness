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

| Kart                 | Ne yapar                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Oyna**             | Taraf (Beyaz/Siyah/Rastgele) ve zorluk seç, Stockfish'e karşı oyna. "Tutor açık" işaretliyse açılış paneli çalışır.                                         |
| **Analiz et**        | Lichess veya chess.com'dan kopyaladığın PGN'i ya da bir Lichess oyun linkini yapıştır; oyun hamle hamle notlanır, Rapor sekmesi açılır.                     |
| **Arkadaşınla oyna** | Aynı cihazda sırayla; tahta her hamlede döner.                                                                                                              |
| **Dersler**          | Lichess'teki herkese açık çalışmalar (study) adım adım ders olarak: yazarın notu, okları, "Sonraki hamle" düğmesi. Link/kimlik yapıştır ya da listeden seç. |
| **Açılışlar**        | Lichess'ten canlı ağaç (giriş gerekli), popüler açılışlar, kitaptaki 149 ailenin tamamı (arama var). Her hattan ♔ veya ♚ olarak çalış.                      |
| **Kütüphane**        | ECO cilt → aile → varyant: 3.815 adlandırılmış hat, tahtada adım adım.                                                                                      |
| **Oyunlarım**        | Lichess/chess.com'dan son oyunlarını çek, incele, açılış başına skor tablosu.                                                                               |
| **Profil**           | Giriş, kullanıcı adları, dil, tema.                                                                                                                         |

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

## Oyunlar kaybolmaz

Hamlesi olan her oyun cihazda saklanır. Ana ekranda "Oyuna devam et" kartı süren oyunu,
"Bu cihazdaki son oyunlar" listesi öncekileri gösterir; "Devam" ile kaldığın yerden açılır.
Not: telefonda tarayıcı ile ana ekrana eklenmiş uygulama ayrı depolama kullanır; birinde
yaptığın giriş diğerinde görünmez.

## Geri gitme

Üst çubuktaki ok ve telefonun geri tuşu bir önceki ekrana döner (kütüphanede varyanttan
aileye, aileden listeye). Logo ana sayfaya götürür.

## Oyun incelemesi

- Tahtanın üstünde ve altında her tarafın aldığı taşlar ve puan farkı (+2 gibi) görünür.
- Tahtanın altındaki not satırında hem senin son hamlen hem rakibin son hamlesi notlanır.
- Geri al (◀) tek hamle geri alır; böylece bot cevap verdikten sonra kendi hamlenin notuna
  bakabilirsin. İleri (▶) ile devam edersin.
- Oyunun içinde geriye gidince açılış panelinde o pozisyonda **oynadığın hamle** turuncu
  "oynanan" etiketiyle, literatürün oynadıklarının yanında görünür; tahtada turuncu okla çizilir.
- Açılış panelindeki "Usta oyunları / Örnek oyunlar" bölümü o pozisyonun oynandığı gerçek
  oyunları listeler (oyuncular, rating, yıl, sonuç). "Aç" ile oyunun tamamı uygulamada,
  baktığın pozisyona konumlanmış olarak açılır.
- Panelin sağ üstündeki "i" düğmesi ve ana sayfadaki "Veri kaynakları" bağlantısı her verinin
  nereden geldiğini açıklar.

## Dersler (Lichess çalışmaları)

- Ana ekrandaki **Dersler** kartı, Lichess'te yayımlanmış herkese açık açılış derslerini listeler
  (Sicilya, İtalyan, Londra, Caro-Kann, tuzaklar…). Herhangi bir Lichess çalışma linkini ya da
  8 haneli kimliğini de yapıştırabilirsin; çalışma herkese açıksa giriş gerekmez.
- Ders açılınca oyun ekranında **Ders** sekmesi gelir: bölüm seçici, o pozisyon için yazarın notu
  ve **Sonraki hamle** düğmesi. Yazarın çizdiği oklar ve boyadığı kareler tahtada görünür.
- Kendi hamleni denemek serbest: hattan ayrılınca "Derse dön" ile kaldığın yere dönersin.
  Açılış paneli, motor notları ve değerlendirme çubuğu derste de çalışır.
- İçerik yazarlarına aittir; her derste yazar adı ve Lichess bağlantısı vardır. Uygulama içeriği
  yalnızca cihazında önbelleğe alır.

## Değerlendirme çubuğu ve oklar

- Tahtanın yanındaki dikey çubuk chess.com'daki gibi Beyaz'ın kazanma olasılığını gösterir;
  hamle notlarıyla aynı motor kaynaklarını kullanır (Lichess bulut → ChessDB → cihazdaki
  Stockfish). Pozisyon henüz değerlendirilmediyse soluk görünür. Kontrol satırındaki çubuk
  düğmesi veya Ayarlar'dan kapatılır.
- Göz düğmesi ok modunu döndürür: **popüler** (yeşil, oynanma sıklığı ve yüzdesi), **motor**
  (mavi, hamle sonrası değerlendirme, hamleyi yapan taraf açısından), **ikisi**, **kapalı**.
  Veri tabanında hiç oyun olmayan pozisyonlarda popüler mod motor oklarına düşer.
- Motor önerileri bot seviyesinden bağımsızdır; her zaman tam güçtedir.

## Küçük ipuçları

- Zorluk oyun ortasında değiştirilebilir; bir sonraki hamleden itibaren etkili olur.
- Rating aralığını kendi seviyene göre daralt (Ayarlar → Rating aralığı); yüzdeler o gruptaki
  oyunlara göre gelir.
- Analiz derinliği telefonda "Hızlı" ile başlasın; Lichess bulut değerlendirmeleri açık kaldıkça
  bilinen pozisyonlar zaten çok derin gelir.
- Geri al (◀) bot modunda kendi sırana kadar geri alır; sonra farklı hamle oynayabilirsin.
