# Chess Opening Trainer — Proje Yönergesi (Claude Code için)

Bu dosya yeni bir VS Code / Claude Code oturumuna başlangıç prompt'u olarak verilmek üzere hazırlandı. Önce tamamını oku, sonra **"Çalışma Şekli"** bölümündeki adımları izle.

---

## 1. Amaç (tek cümle)

Bota karşı oynarken ekranın altında **canlı açılış / varyant adı** ve **Lichess tarzı popüler devam yolları (yüzdeli)** gösteren, istenirse **rakibin hamlesini de kullanıcının oynayabildiği**, mobil öncelikli, tamamen tarayıcıda çalışan (sunucusuz) bir açılış antrenman uygulaması.

## 2. Neden var / hangi boşluğu dolduruyor

- Lichess Opening Explorer: rakip yok, iki tarafı da kendin oynatıyorsun.
- Lichess / Chess.com bot oyunu: explorer yok, hangi varyantta olduğunu maç bitince öğreniyorsun.
- İkisini birleştiren, özellikle telefonda rahat kullanılan bir araç yok. Bu uygulama o boşluğu dolduruyor.

Kullanıcı profili: Chess.com ~1000 rapid, açılış literatürünü (isimler, varyantlar, ana hatlar) **oynarken** öğrenmek istiyor. "Kopya" değil, **guided repertoire training**.

## 3. Zorunlu Özellikler (MVP)

### 3.1 Tahta ve oyun

- Mobil öncelikli, dokunmatikle sürükle/tıkla hamle.
- Kurallar: `chess.js` (yasal hamleler, FEN, PGN, SAN).
- Tahta: `chessground` (Lichess'in tahtası; hafif, mobilde iyi). Alternatif kabul edilmez, aksi bir teknik engel yoksa bunu kullan.
- Tarafı seç (beyaz/siyah), tahtayı çevir, yeni oyun, geri al (undo), ileri al.
- Hamle listesi (SAN), tıklayınca o pozisyona git.

### 3.2 Bot (Stockfish, tarayıcıda)

- Stockfish WASM, **Web Worker** içinde. Ana thread'i bloklama.
- **Tek thread'li (non-SharedArrayBuffer) build** kullan ki GitHub Pages / Vercel'de COOP/COEP header derdi olmasın. (`stockfish.js` npm paketi ya da `lila-stockfish-web` — hangisi güncel ve kolay entegre oluyorsa onu seç, kararı README'ye yaz.)
- **Zorluk canlı değiştirilebilir** (oyun ortasında bile): UCI `Skill Level` (0–20) + `movetime`/`depth` kombinasyonuyla 5–6 kademe sun (örn. Çaylak / Kolay / Orta / Zor / Çok Zor / Maksimum). Kademe → parametre eşlemesi tek bir config dosyasında dursun.
- Bot düşünürken UI'da belirgin bir gösterge olsun.

### 3.3 Canlı Açılış Paneli (ürünün kalbi)

Her hamleden sonra (hem kullanıcı hem bot hamlesi) tahtanın altındaki panelde:

- **Şu anki açılış:** ECO kodu + isim + varyant (örn. `B41 — Sicilian Defense: Kan Variation`).
- Pozisyon kitaptan çıktıysa: **son bilinen açılış adı** kalmaya devam etsin ve "kitap dışı" etiketi eklensin.
- **Popüler devam yolları:** en çok oynanan ilk 3–5 hamle, her biri için:
  - SAN hamle
  - oynanma yüzdesi (toplam içinde)
  - Beyaz kazanç / berabere / Siyah kazanç oranları — **Lichess'teki gibi üç renkli yatay bar**
  - o hamlenin götürdüğü varyantın adı (varsa)
- Hamle satırına dokununca:
  - **tahtada ok olarak göster** (chessground `drawable.autoShapes`)
  - ikinci dokunuşta **o hamleyi oyna** (sırası kimdeyse onun adına — bkz. 3.4)
- Panel **hem kullanıcının hem botun sırasında** çalışsın. Yani bot hamle yapmadan önce "rakip için popüler devamlar" da görülebilsin (bunu açıp kapatan bir toggle olsun: "Rakip ipuçlarını göster").

### 3.4 Rakip Hamlesini Kendin Oyna (takeover modu)

Amaç: "Bu varyantta zorlanıyorum; rakip şunu oynasa ben ne yaparım?" antrenmanı.

- Bir toggle: **"Rakibi ben oynatayım"**. Açıkken bot beklemez, kullanıcı iki taraf için de hamle yapar.
- Toggle'ı kapatınca bot kaldığı pozisyondan devam eder.
- Ayrıca botun sırasında tek seferlik: **"Bu hamleyi rakibe oynat"** — açılış panelindeki bir hamleye basılı tutunca / uzun basınca o hamleyi rakip adına oynar, sonra bot moduna geri döner.
- Undo bu modda da çalışmalı.

### 3.5 Veri kaynağı: Lichess Opening Explorer API

- Endpoint'ler (koda başlamadan **güncel dokümanı doğrula**: https://lichess.org/api#tag/Opening-Explorer):
  - `https://explorer.lichess.ovh/lichess?fen=...&variant=standard&speeds=blitz,rapid,classical&ratings=1000,1200,1400,1600,1800,2000&moves=8`
  - `https://explorer.lichess.ovh/masters?fen=...&moves=8`
- Yanıtta `opening: {eco, name}`, `moves: [{uci, san, white, draws, black, averageRating, ...}]`, `white/draws/black` toplamları var. Yüzdeleri buradan hesapla.
- Kullanıcı, **Lichess havuzu / Ustalar havuzu** arasında geçiş yapabilsin; Lichess havuzu için rating aralığı seçilebilsin (varsayılan 1000–2000, kullanıcının seviyesine yakın).
- **Zorunlu istemci tarafı önlemler:**
  - FEN → yanıt için bellek + `localStorage`/IndexedDB cache (aynı pozisyon ikinci kez istenmesin).
  - İstekleri debounce et; hızlı geri/ileri sararken her pozisyon için istek atma.
  - Rate limit (429) gelirse zarif geri çekil, panelde "yükleniyor / bekleniyor" göster, uygulamayı kilitleme.
  - `User-Agent`/`Accept` konusunu doküman ne diyorsa ona uy.
- **Çevrimdışı / API yoksa açılış adı için yedek:** `lichess-org/chess-openings` repo'sundaki TSV'leri (ECO, name, PGN) build sırasında projeye gömüp EPD → isim eşlemesi yap. Böylece API cevap vermese bile "hangi açılıştayım" çalışır. Bu, ilk milestone'da opsiyonel; ikinci milestone'da zorunlu.

### 3.6 Mobil / PWA

- Mobile-first layout: tahta üstte tam genişlik, panel altta kaydırılabilir. Desktop'ta tahta solda, panel sağda.
- PWA: manifest + service worker (vite-plugin-pwa). Ana ekrana eklenince tam ekran açılsın. Statik varlıklar + Stockfish WASM offline cache'lensin.
- Koyu tema varsayılan, açık tema opsiyonel.

## 4. Sonraya Bırakılanlar (MVP'de YAPMA)

- Kullanıcı hesabı, sunucu, veritabanı.
- Online multiplayer.
- Chess.com / Lichess hesabından oyun çekme.
- Repertuar kaydetme, spaced repetition, notasyon oyunu, puzzle. (Bunlar v2 fikirleri; README'de "Roadmap" olarak listele.)

## 5. Teknik Kararlar

| Konu        | Karar                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| Framework   | Vite + React + TypeScript                                                                                   |
| State       | Zustand (tek store: oyun, bot ayarları, explorer verisi, UI modları)                                        |
| Tahta       | chessground                                                                                                 |
| Kurallar    | chess.js                                                                                                    |
| Motor       | Stockfish WASM, Web Worker, tek thread                                                                      |
| Stil        | Tailwind (hızlı mobil layout için)                                                                          |
| Test        | Vitest (kural/FEN/yüzde hesap gibi saf fonksiyonlar için)                                                   |
| Lint/format | ESLint + Prettier                                                                                           |
| Deploy      | GitHub Pages **veya** Vercel — ikisi de sıfır maliyet; hangisi seçildiyse `README` + CI workflow'u ona göre |
| Lisans      | MIT                                                                                                         |
| Backend     | **Yok.** Her şey istemcide.                                                                                 |

Klasör yapısı önerisi:

```
src/
  engine/        # stockfish worker wrapper, difficulty config
  explorer/      # lichess api client, cache, opening-name fallback
  game/          # chess.js wrapper, history, branch/undo
  store/         # zustand store
  components/    # Board, OpeningPanel, MoveList, Controls, DifficultySelect
  pages/         # tek sayfa; gerekirse Settings
public/          # stockfish wasm, manifest, icons
```

## 6. Milestone'lar (bu sırayla, her biri çalışır durumda commit'lensin)

1. **İskelet:** Vite+React+TS, Tailwind, chessground + chess.js, iki tarafı da elle oynanabilen tahta, hamle listesi, undo. Mobilde düzgün görünsün.
2. **Explorer paneli:** Lichess API entegrasyonu, açılış adı, popüler hamleler + yüzdeli barlar, ok gösterme, tıklayınca oynama, cache + debounce.
3. **Bot:** Stockfish worker, zorluk seçici (canlı), taraf seçimi, bot düşünüyor göstergesi.
4. **Takeover modu:** "Rakibi ben oynatayım" toggle'ı + "bu hamleyi rakibe oynat" kısayolu, bot ile sorunsuz geçiş.
5. **PWA + deploy:** manifest, service worker, offline WASM, GitHub Actions ile otomatik deploy, README (ekran görüntüsü, özellikler, mimari, roadmap).
6. **Cila:** kitap-dışı yedek isimlendirme (chess-openings TSV), Ustalar/Lichess havuz geçişi, rating aralığı seçimi, tema.

## 7. Çalışma Şekli (Claude Code'a talimat)

- Başlamadan önce **plan modunda** kısa bir plan çıkar; kütüphane sürümlerini ve Lichess API dokümanını **güncel kaynaktan doğrula** (varsayma). Belirsiz olan en fazla 2–3 şeyi sor, gerisi için makul kararı ver ve README'ye not düş.
- Her milestone sonunda `npm run build` ve `npm run test` geçmeli; anlamlı commit mesajı at.
- Küçük, okunabilir modüller. Over-engineering yok; MVP'de olmayan şey için soyutlama kurma.
- Explorer istek sayısını her zaman düşük tut; bu API ücretsiz ve paylaşımlı, kötüye kullanma.
- Mobilde gerçekten test edilebilmesi için dev server'ı `--host` ile aç ve LAN adresini yaz.
- Kullanıcı Türkçe konuşuyor; kod, değişken adları, commit mesajları ve README **İngilizce** (GitHub / CV için). UI metinleri Türkçe + İngilizce (i18n'e ilk günden basit bir sözlük dosyasıyla hazırlıklı ol, ama kütüphane ekleme).

## 8. Kabul Kriterleri (MVP tamam sayılır, eğer:)

- Telefonda tarayıcıdan açılıp Orta seviye bota karşı bir oyun oynanabiliyor.
- Her hamleden sonra 1 saniye içinde açılış adı ve devam yolları güncelleniyor.
- Devam yollarına dokununca ok çıkıyor, ikinci dokunuşta oynanıyor.
- Bot düşünürken zorluk değiştirilebiliyor, sonraki hamlede etkili oluyor.
- "Rakibi ben oynatayım" açıkken iki taraf da elle oynanıyor, kapatınca bot devam ediyor.
- İnternet kesilince uygulama açılıyor, tahta ve bot çalışıyor; sadece explorer paneli "çevrimdışı" diyor.
- `npm run build` temiz, GitHub Pages/Vercel'de yayında, README'de ekran görüntüsü var.
