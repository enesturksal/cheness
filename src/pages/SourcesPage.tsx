import { AppFooter } from '../components/AppFooter';
import { bookMeta } from '../explorer/book';
import { useT } from '../i18n/useT';
import { useStore } from '../store/useStore';

interface Item {
  title: string;
  body: string;
  link?: { href: string; label: string };
}

function content(lang: 'tr' | 'en', bookCount: number, bookDate: string): Item[] {
  if (lang === 'tr') {
    return [
      {
        title: 'Açılış adları ve varyantlar',
        body: `Lichess'in kendi kullandığı lichess-org/chess-openings listesi (CC0): ${bookCount} adlandırılmış hat, ${bookDate} tarihli. Uygulamaya gömülüdür, çevrimdışı çalışır; pozisyonlar EPD ile eşleştiği için farklı hamle sırasıyla ulaşılan aynı pozisyon (transpozisyon) doğru adı alır. "Kitap dışı" etiketi, pozisyonun bu listede olmadığı ama daha önce bir adın bulunduğu anlamına gelir.`,
        link: { href: 'https://github.com/lichess-org/chess-openings', label: 'chess-openings' },
      },
      {
        title: 'Popüler devam yolları, yüzdeler ve Beyaz/berabere/Siyah barları',
        body: 'Lichess Opening Explorer. "Lichess" havuzu: Lichess\'te oynanmış puanlı oyunlar (milyarlarca), Ayarlar\'daki rating aralığı ve tempo filtreleriyle. "Ustalar" havuzu: 1952\'den beri masa başı (OTB) usta oyunları, 2200+ Elo, 2,5 milyondan fazla. Her hamlenin götürdüğü varyant adı da bu servisten gelir. Token gerektirir; her pozisyon için en fazla bir istek atılır ve 14 gün önbellekte tutulur.',
        link: { href: 'https://lichess.org/api#tag/Opening-Explorer', label: 'Lichess API' },
      },
      {
        title: 'Örnek oyunlar',
        body: 'Explorer\'ın pozisyon için listelediği oyunlar: Ustalar havuzunda en yüksek ratingli oyunlar, Lichess havuzunda öne çıkan oyunlar. "Aç" ile oyunun PGN\'i indirilir (Ustalar: explorer PGN uç noktası; Lichess: oyun dışa aktarımı) ve uygulamada analiz modunda, baktığın pozisyona konumlanmış olarak açılır.',
      },
      {
        title: 'Teori sekmesi',
        body: 'Wikibooks "Chess Opening Theory" kitabı (CC BY-SA, İngilizce). Hat başına bir sayfa vardır; sayfa yoksa en yakın üst hattın sayfası gösterilir. MediaWiki API üzerinden alınır ve önbelleğe konur.',
        link: { href: 'https://en.wikibooks.org/wiki/Chess_Opening_Theory', label: 'Wikibooks' },
      },
      {
        title: 'Değerlendirmeler ve hamle notları',
        body: "Üç kaynak, sırayla: (1) Lichess bulut değerlendirmeleri: Lichess'in daha önce analiz ettiği pozisyonlar için Stockfish sonuçları, genellikle derinlik 30–75, giriş gerektirmez. (2) ChessDB (chessdb.cn): milyarlarca pozisyon için motor skorları; ok önerilerinde kullanılır. (3) Cihazındaki Stockfish 19 lite (WASM): diğer ikisinin bilmediği pozisyonlar için, Ayarlar'daki derinlikle. Hamle notları kazanma olasılığı kaybına göre verilir (Lichess eşikleri: hatalı ≥5, hata ≥10, vahim hata ≥15 puan); \"Harika\" için motorun ikinci en iyi hamlesi ≥10 puan daha kötü olmalıdır. Bir hamlenin iki pozisyonu her zaman aynı kaynakla değerlendirilir. Doğruluk yüzdesi Lichess'in formülüdür.",
        link: { href: 'https://lichess.org/api#tag/Analysis', label: 'Lichess cloud eval' },
      },
      {
        title: 'Dersler',
        body: 'Lichess çalışmaları (study): kullanıcıların lichess.org’da yayımladığı herkese açık dersler. Uygulama, çalışmayı bölüm bölüm PGN olarak Lichess API’sinden anlık alır; yazarın yorumları pozisyona bağlı not, [%cal]/[%csl] işaretleri tahtada ok ve kare olarak gösterilir. İçerik yazarlarına aittir, her derste yazar ve Lichess bağlantısı görünür; uygulama içeriği depolayıp dağıtmaz (yalnızca cihazda önbellek).',
        link: { href: 'https://lichess.org/study', label: 'Lichess studies' },
      },
      {
        title: 'Oyunlarım',
        body: 'Lichess: hesabının oyun arşivi (Lichess girişi gerekir). chess.com: herkese açık "published data API"; oyunlar aylık arşivlerden PGN olarak okunur. Açılış adları platformların kendi verdiği adlardır.',
      },
      {
        title: 'Bot',
        body: 'Stockfish 19 lite, tek iş parçacıklı WebAssembly derlemesi, cihazında çalışır. Zorluk seviyeleri UCI "Skill Level" (0–20) ile düşünme süresi/derinlik sınırlarının birleşimidir; Elo değerleri kaba tahmindir.',
      },
      {
        title: 'Gizlilik',
        body: "Cheness'in sunucusu yoktur. İstekler doğrudan tarayıcından yukarıdaki servislere gider; Lichess token'ı, kullanıcı adları, ayarlar ve oyunlar yalnızca bu cihazın tarayıcısında saklanır.",
      },
    ];
  }
  return [
    {
      title: 'Opening names and variations',
      body: `The lichess-org/chess-openings list Lichess itself uses (CC0): ${bookCount} named lines as of ${bookDate}. It is embedded in the app and works offline; positions are matched by EPD, so transpositions get the right name. "Out of book" means the position is not in the list but an earlier one was.`,
      link: { href: 'https://github.com/lichess-org/chess-openings', label: 'chess-openings' },
    },
    {
      title: 'Popular continuations, percentages and W/D/L bars',
      body: 'Lichess Opening Explorer. "Lichess" pool: rated games played on Lichess (billions), filtered by the rating and time-control settings. "Masters" pool: over-the-board master games since 1952, 2200+ Elo, 2.5M+. The variation each move leads to also comes from this service. Needs a token; at most one request per position, cached for 14 days.',
      link: { href: 'https://lichess.org/api#tag/Opening-Explorer', label: 'Lichess API' },
    },
    {
      title: 'Reference games',
      body: 'The games the explorer lists for the position: highest-rated games in the Masters pool, featured games in the Lichess pool. "Open" downloads the PGN (Masters: explorer PGN endpoint; Lichess: game export) and opens it in analysis mode at the position you were looking at.',
    },
    {
      title: 'Theory tab',
      body: 'Wikibooks "Chess Opening Theory" (CC BY-SA, English), one page per line; when a line has no page the nearest parent line is shown. Fetched through the MediaWiki API and cached.',
      link: { href: 'https://en.wikibooks.org/wiki/Chess_Opening_Theory', label: 'Wikibooks' },
    },
    {
      title: 'Evaluations and move verdicts',
      body: 'Three sources, in order: (1) Lichess cloud evaluations: Stockfish results for positions Lichess has analysed before, typically depth 30–75, no login needed. (2) ChessDB (chessdb.cn): engine scores for billions of positions, used for arrow suggestions. (3) Stockfish 19 lite (WASM) on your device for everything else, at the depth set in Settings. Verdicts follow win-probability loss (Lichess thresholds: inaccuracy ≥5, mistake ≥10, blunder ≥15 points); "Great" requires the engine\'s second choice to be ≥10 points worse. Both positions of a move are always scored by the same source. Accuracy uses Lichess\'s formula.',
      link: { href: 'https://lichess.org/api#tag/Analysis', label: 'Lichess cloud eval' },
    },
    {
      title: 'Lessons',
      body: 'Lichess studies: public lessons published by users on lichess.org. The app fetches a study chapter by chapter as PGN from the Lichess API; the author’s comments become position-bound notes and [%cal]/[%csl] tags become arrows and squares on the board. Content belongs to its authors, every lesson shows the author and a link to Lichess; the app does not store or redistribute it (device cache only).',
      link: { href: 'https://lichess.org/study', label: 'Lichess studies' },
    },
    {
      title: 'My games',
      body: 'Lichess: your account\'s game archive (Lichess sign-in required). chess.com: the public "published data API"; games are read as PGN from the monthly archives. Opening names are the platforms\' own.',
    },
    {
      title: 'Bot',
      body: 'Stockfish 19 lite, single-threaded WebAssembly build, running on your device. Levels combine UCI "Skill Level" (0–20) with time/depth limits; Elo figures are rough estimates.',
    },
    {
      title: 'Privacy',
      body: "Cheness has no server. Requests go straight from your browser to the services above; the Lichess token, usernames, settings and games are stored only in this device's browser.",
    },
  ];
}

export function SourcesPage() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const meta = bookMeta();
  const items = content(lang, meta.count, meta.generatedAt);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-3 md:p-6">
      <h2 className="text-lg font-bold">{t('sources.title')}</h2>
      <p className="text-sm text-muted">{t('sources.desc')}</p>
      {items.map((it) => (
        <section key={it.title} className="card p-3">
          <h3 className="text-sm font-bold">{it.title}</h3>
          <p className="mt-1 text-sm leading-relaxed">{it.body}</p>
          {it.link && (
            <a
              className="mt-2 inline-block text-xs text-accent underline"
              href={it.link.href}
              target="_blank"
              rel="noreferrer"
            >
              {it.link.label}
            </a>
          )}
        </section>
      ))}
      <AppFooter />
    </div>
  );
}
