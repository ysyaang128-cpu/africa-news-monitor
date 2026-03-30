"use client";

import { useEffect, useState } from "react";

type News = {
  title: string;
  source: string;
  date: string;
  summary: string;
  link: string;
  image?: string;
};

export default function Home() {
  const [news, setNews] = useState<News[]>([]);
  const [filter, setFilter] = useState("All");
  const [keyword, setKeyword] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [showCountries, setShowCountries] = useState(false);
  const [loading, setLoading] = useState(true);

  const sourcesList = ["All", "BBC", "Africanews", "AllAfrica", "Al Jazeera"];

  const countries = [
    "Algeria","Angola","Benin","Botswana","Burkina Faso","Burundi",
    "Cabo Verde","Cameroon","Central African Republic","Chad","Comoros",
    "Democratic Republic of the Congo","Republic of the Congo","Djibouti",
    "Egypt","Equatorial Guinea","Eritrea","Eswatini","Ethiopia","Gabon",
    "Gambia","Ghana","Guinea","Guinea-Bissau","Ivory Coast","Côte d'Ivoire",
    "Kenya","Lesotho","Liberia","Libya","Madagascar","Malawi","Mali",
    "Mauritania","Mauritius","Morocco","Mozambique","Namibia","Niger",
    "Nigeria","Rwanda","Sao Tome and Principe","Senegal","Seychelles",
    "Sierra Leone","Somalia","South Africa","South Sudan","Sudan",
    "Tanzania","Togo","Tunisia","Uganda","Zambia","Zimbabwe"
  ];

  // 🔥 alias 강화
  const aliases: Record<string, string[]> = {
    "Democratic Republic of the Congo": ["drc", "dr congo", "congo drc", "democratic congo"],
    "Republic of the Congo": ["congo", "congo republic"],
    "Ivory Coast": ["cote d'ivoire", "côte d'ivoire", "ivory coast"],
    "Eswatini": ["swaziland"]
  };

  const africaKeywords = [
    "africa","african","african union",
    "sub-saharan","horn of africa",
    "east africa","west africa",
    "north africa","southern africa"
  ];

  function extractCountries(text: string) {
    const lower = text.toLowerCase();
    return countries.filter((c) => {
      const names = [c.toLowerCase(), ...(aliases[c] || [])];
      return names.some((name) => lower.includes(name));
    });
  }

  function extractImage(description: string) {
    const match = description?.match(/<img.*?src="(.*?)"/);
    return match ? match[1] : "";
  }

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);

      const sources = [
        { url: "http://feeds.bbci.co.uk/news/world/africa/rss.xml", source: "BBC" },
        { url: "https://www.africanews.com/feed/rss", source: "Africanews" },
        { url: "https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf", source: "AllAfrica" },
        { url: "https://www.aljazeera.com/xml/rss/all.xml", source: "Al Jazeera" }
      ];

      let allNews: any[] = [];

      for (const s of sources) {
        try {
          const res = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${s.url}`
          );
          const data = await res.json();
          if (!data.items) continue;

          const formatted = data.items.slice(0, 20).map((item: any) => ({
            title: item.title,
            source: s.source,
            date: item.pubDate || "",
            image:
              item.thumbnail ||
              item.enclosure?.link ||
              extractImage(item.description) ||
              "",
            summary:
              item.description
                ?.replace(/<[^>]+>/g, "")
                .slice(0, 300) || "",
            link: item.link
          }));

          allNews = [...allNews, ...formatted];
        } catch {
          console.log(`${s.source} 실패`);
        }
      }

      // 🌍 필터
      allNews = allNews.filter((n) => {
        const text = (n.title + " " + n.summary).toLowerCase();

        const hasCountry = countries.some((c) => {
          const names = [c.toLowerCase(), ...(aliases[c] || [])];
          return names.some((name) => text.includes(name));
        });

        const hasAfricaKeyword = africaKeywords.some((k) =>
          text.includes(k)
        );

        return hasCountry || hasAfricaKeyword;
      });

      // 📅 2주 필터
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentNews = allNews.filter((n) => {
        const d = new Date(n.date);
        return d >= twoWeeksAgo;
      });

      recentNews.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setNews(recentNews);
      setLoading(false);
    };

    fetchNews();
  }, []);

  const filtered = news.filter((n) => {
    const text = n.title + " " + n.summary;

    const matchSource = filter === "All" || n.source === filter;
    const matchKeyword = text.toLowerCase().includes(keyword.toLowerCase());

    const matchCountry =
      !countryFilter ||
      (() => {
        const names = [
          countryFilter.toLowerCase(),
          ...(aliases[countryFilter] || [])
        ];
        return names.some((name) =>
          text.toLowerCase().includes(name)
        );
      })();

    return matchSource && matchKeyword && matchCountry;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">
        🌍 Africa News Monitor
      </h1>

      <input
        type="text"
        placeholder="Search keyword..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="mb-6 w-full px-4 py-2 border rounded-lg"
      />

      {/* 언론사 + 외부 링크 */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {sourcesList.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1 border rounded-full text-sm ${
              filter === s ? "bg-black text-white" : ""
            }`}
          >
            {s}
          </button>
        ))}

        <a href="https://data.k-af.or.kr/main/index" target="_blank"
          className="px-4 py-1 bg-blue-600 text-white rounded-full text-sm">
          Africa Insight
        </a>

        <a href="https://www.reuters.com/world/africa/" target="_blank"
          className="px-4 py-1 bg-green-600 text-white rounded-full text-sm">
          Reuters
        </a>

        <a href="https://www.nytimes.com/section/world/africa" target="_blank"
          className="px-4 py-1 bg-green-600 text-white rounded-full text-sm">
          NYT
        </a>

        <a href="https://edition.cnn.com/africa" target="_blank"
          className="px-4 py-1 bg-red-600 text-white rounded-full text-sm">
          CNN
        </a>
      </div>

      {/* 국가 토글 */}
      <button
        onClick={() => setShowCountries(!showCountries)}
        className="mb-4 px-4 py-2 bg-gray-200 rounded-lg text-sm"
      >
        🌍 국가별 보기 {showCountries ? "▲" : "▼"}
      </button>

      {showCountries && (
        <div className="mb-6 flex gap-2 flex-wrap max-h-32 overflow-y-auto">

          {/* All 버튼 */}
          <button
            onClick={() => setCountryFilter("")}
            className={`text-xs px-3 py-1 rounded-full border ${
              countryFilter === "" ? "bg-blue-600 text-white" : ""
            }`}
          >
            All
          </button>

          {countries.map((c) => (
            <button
              key={c}
              onClick={() => setCountryFilter(c)}
              className={`text-xs px-3 py-1 rounded-full border ${
                countryFilter === c ? "bg-blue-600 text-white" : ""
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 로딩 */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">
          Loading news...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((n, i) => (
            <a key={i} href={n.link} target="_blank"
              className="bg-white rounded-xl shadow-sm overflow-hidden">

              <div className="h-40 bg-gray-200">
                {n.image ? (
                  <img src={n.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-xs text-gray-400 mb-1">
                  {n.source} · {new Date(n.date).toLocaleDateString()}
                </div>

                <div className="font-semibold">{n.title}</div>

                <div className="flex gap-1 flex-wrap mt-2">
                  {extractCountries(n.title + " " + n.summary).map((c) => (
                    <span
                      key={c}
                      onClick={(e) => {
                        e.preventDefault();
                        setCountryFilter(c);
                      }}
                      className="text-xs px-2 py-1 bg-gray-200 rounded-full"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="text-sm text-gray-600 mt-2">
                  {n.summary.slice(0, 150)}...
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}