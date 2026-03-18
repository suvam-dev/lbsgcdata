export function buildSystemPrompt({ summary, monthly, channels, users, inputTypes, outputTypes, language, platforms, clientId }) {
  const topChannels = [...(channels || [])].sort((a, b) => b.published - a.published).slice(0, 8)
    .map(c => `${c.channel}: ${c.uploaded}up/${c.created}cr/${c.published}pub (${c.created > 0 ? (c.published/c.created*100).toFixed(2) : 0}% rate)`).join(' | ');

  const topUsers = [...(users || [])].sort((a, b) => b.published - a.published).slice(0, 8)
    .map(u => `${u.user} ${u.uploaded}/${u.created}/${u.published}`).join(' | ');

  const outputStr = (outputTypes || []).map(d => `${d.type} cr:${d.created}/pub:${d.published}`).join(' | ');
  const inputStr = (inputTypes || []).slice(0, 8).map(d => `${d.type} up:${d.uploaded}/pub:${d.published}`).join(' | ');
  const langStr = (language || []).map(d => `${d.language} up:${d.uploaded}/pub:${d.published}`).join(' | ');
  const platStr = (platforms || []).filter(p => p.count > 0).map(p => `${p.platform}:${p.count}`).join(' | ');

  const peakMonth = [...(monthly || [])].sort((a, b) => b.uploaded - a.uploaded)[0];
  const bestPubMonth = [...(monthly || [])].sort((a, b) => b.published - a.published)[0];

  return `You are a data analyst for Frammer AI, a B2B video AI platform. Answer questions concisely (2-4 sentences) using ONLY the dataset below for ${(clientId || 'this client').toUpperCase().replace('_',' ')}. Always cite specific numbers.

CLIENT: ${(clientId || 'unknown').toUpperCase().replace('_',' ')}
TOTALS: Uploaded ${summary.total_uploaded || 0} | Created ${summary.total_created || 0} | Published ${summary.total_published || 0} | Upload hrs ${(summary.total_uploaded_hrs || 0).toFixed(1)} | Created hrs ${(summary.total_created_hrs || 0).toFixed(1)}

MONTHLY (${(monthly || []).length} months): Peak uploads: ${peakMonth ? peakMonth.month + ' (' + peakMonth.uploaded + ')' : 'N/A'} | Best publish month: ${bestPubMonth ? bestPubMonth.month + ' (' + bestPubMonth.published + ')' : 'N/A'}

CHANNELS: ${topChannels || 'No data'}

OUTPUT TYPES: ${outputStr || 'No data'}
INPUT TYPES: ${inputStr || 'No data'}
LANGUAGE: ${langStr || 'No data'}
TOP USERS (up/cr/pub): ${topUsers || 'No data'}
PLATFORMS: ${platStr || 'No data'}`;
}

export async function queryNLQ(conversationHistory, systemPrompt) {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return "Groq API key not found. Add REACT_APP_GROQ_API_KEY to your .env file and restart the dev server.";
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
        ]
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) return "Invalid API key. Please check your REACT_APP_GROQ_API_KEY in .env and restart the server.";
      if (response.status === 429) return "Rate limit reached. Please wait a moment and try again.";
      return `API error (${response.status}): ${err.error?.message || "Unknown error"}`;
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response received from Groq.";
  } catch (e) {
    if (e.message?.includes("fetch")) return "Network error — check your internet connection.";
    return `Error: ${e.message}`;
  }
}

export const NLQ_KB = [
  {
    keys: ["channel", "gap", "process", "publish", "drop", "biggest", "difference"],
    answer: "Channel B has the largest absolute gap — 4,251 created vs only 19 published (0.45% rate). Channel D is the most alarming: 701 videos created with 0 ever published, a complete publish drop-off. Channel A leads in publishing with 71 published (1.5% rate), making it the healthiest funnel of all 18 channels."
  },
  {
    keys: ["output type", "format", "publish rate", "best", "key moment", "chapter", "summary", "full package"],
    answer: "My Key Moments has the best publish rate at 2.6% (32 out of 1,237 created). Key Moments leads in absolute publish count with 41 published out of 6,377 created (0.64%). Chapters and Summary have the weakest conversion at 0.1% and 0.12% respectively, despite significant creation volume."
  },
  {
    keys: ["input type", "category", "interview", "news", "speech", "debate", "discussion", "press"],
    answer: "Discussion Show has the highest publish rate at 3.8% (3/79). News Bulletin leads in absolute publishes with 39 (1.2% rate). Interview is the most uploaded type with 1,299 videos but has a low 0.7% publish conversion. Press Conference has the poorest rate at just 0.2% despite 280 uploads."
  },
  {
    keys: ["language", "english", "hindi", "mix"],
    answer: "English dominates with 2,647 uploads and 91 published (1.03% publish rate), accounting for 59% of all uploads. Hindi has 1,792 uploads with only 20 published (0.33% rate) — significantly lower conversion. Mix and other languages are negligible with 0 published, indicating a strong English-first publishing bias."
  },
  {
    keys: ["user", "top", "contributor", "volume", "who"],
    answer: "Chandan is the top contributor with 489 uploads and 19 published. QA-Purushottam follows with 309 uploads and 13 published (4.2% rate — best among top users). Auto Upload generates 176 videos automatically (0 published). Many users like Shadab (83 uploads) and Divyanshu (95 uploads) have 0 published videos."
  },
  {
    keys: ["platform", "youtube", "reels", "shorts", "instagram", "facebook"],
    answer: "YouTube leads with 34 published videos, followed closely by Reels (32) and Shorts (22). Instagram has 11 and Facebook 8. LinkedIn, X/Twitter, and Threads show 0 publishes. Channel D is the biggest contributor to Reels (15) and Shorts (18) publishing, while Channel A leads Instagram (7 publishes)."
  },
  {
    keys: ["month", "trend", "growth", "time", "monthly", "when", "peak", "low"],
    answer: "Feb 2026 is the peak month with 676 uploads and 2,756 created — a +37% MoM spike from Jan 2026. Mar 2025 had the highest creation count at 2,555. July 2025 and Sep 2025 had 0 published videos. The overall publish rate across the year is just 0.74% of created videos, with Apr 2025 being the most published month (44 videos)."
  },
  {
    keys: ["duration", "hours", "usage", "time processed"],
    answer: "Total uploaded duration is ~807 hours across the year, with Frammer AI amplifying that to ~1,561 hours of created content (1.93x multiplier). Feb 2026 alone saw 161.9 hours uploaded and 301.5 hours created. Channel B has the highest uploaded duration (297 hours) but only 0.4 hours published — a severe underutilization."
  },
  {
    keys: ["data quality", "missing", "unknown", "error", "blank", "empty", "null"],
    answer: "Key data quality issues: 100% of videos have 'Unknown' team names, 12 videos have no input type classification, and ~85% of published videos are missing their platform/URL fields. Channel D shows a logical anomaly — the channel-wise platform table shows publishes on YouTube/Reels/Shorts, but the combined data shows 0 published, indicating a data inconsistency worth investigating."
  },
  {
    keys: ["underused", "inactive", "never", "zero", "underperform"],
    answer: "11 out of 18 channels have never published a single video. Channels D, F, I, J, K, L, M, N, O, P, R all show 0 published despite significant creation activity (Channel D: 701 created, Channel F: 320 created). Users like Auto Upload (176), Shadab (83), Divyanshu Dutta Roy (95), and AB (101) also have 0 published videos, suggesting they use Frammer purely for processing, not publishing."
  },
  {
    keys: ["summary", "overview", "highlight", "insight", "key", "main"],
    answer: "Key insights: 4,453 videos uploaded → 14,914 created (3.35x AI amplification) → only 111 published (0.74% publish rate). Channel A is the star with 71 publishes; Channel D is the biggest mystery with 701 created and 0 published. English content publishes 3x more than Hindi. My Key Moments format has the best conversion. Feb 2026 shows accelerating growth, suggesting expanding adoption."
  }
];

export function queryNLQLocal(question) {
  const q = question.toLowerCase();
  const tokens = q.split(/\\s+/);
  let best = { score: 0, idx: -1 };
  NLQ_KB.forEach((entry, idx) => {
    const score = entry.keys.reduce((acc, k) => acc + (q.includes(k) ? 2 : tokens.some(t => k.includes(t) && t.length > 3) ? 1 : 0), 0);
    if (score > best.score) best = { score, idx };
  });
  if (best.score > 0) return NLQ_KB[best.idx].answer;
  return "Based on the dataset (Mar 2025 – Feb 2026): 4,453 videos were uploaded, 14,914 created by Frammer AI (3.35x amplification), and only 111 published (0.74% rate). Channel A leads all publishing with 71 videos.";
}
