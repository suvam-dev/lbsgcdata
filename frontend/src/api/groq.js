// ─── NLQ ENGINE ──────────────────────────────────────────────────────────────

export function buildSystemPrompt({
  summary,
  monthly,
  channels,
  users,
  inputTypes,
  outputTypes,
  language,
  platforms,
  clientId
}) {

  const topChannels = [...(channels || [])]
    .sort((a,b)=>b.published-a.published)
    .slice(0,8)
    .map(c =>
      `${c.channel}: ${c.uploaded}up/${c.created}cr/${c.published}pub (${c.created>0 ? (c.published/c.created*100).toFixed(2) : 0}% rate)`
    )
    .join(" | ")

  const topUsers = [...(users || [])]
    .sort((a,b)=>b.published-a.published)
    .slice(0,8)
    .map(u => `${u.user} ${u.uploaded}/${u.created}/${u.published}`)
    .join(" | ")

  const outputStr = (outputTypes || [])
    .map(d => `${d.type} cr:${d.created}/pub:${d.published}`)
    .join(" | ")

  const inputStr = (inputTypes || [])
    .slice(0,8)
    .map(d => `${d.type} up:${d.uploaded}/pub:${d.published}`)
    .join(" | ")

  const langStr = (language || [])
    .map(d => `${d.language} up:${d.uploaded}/pub:${d.published}`)
    .join(" | ")

  const platStr = (platforms || [])
    .filter(p => p.count > 0)
    .map(p => `${p.platform}:${p.count}`)
    .join(" | ")

  const peakMonth = [...(monthly || [])].sort((a,b)=>b.uploaded-a.uploaded)[0]
  const bestPubMonth = [...(monthly || [])].sort((a,b)=>b.published-a.published)[0]

  return `You are a data analyst for Frammer AI, a B2B video AI platform.

Answer questions concisely (2–4 sentences) using ONLY the dataset below for ${(clientId || "this client")
    .toUpperCase()
    .replace("_"," ")}.

Always cite specific numbers.

CLIENT: ${(clientId || "unknown").toUpperCase().replace("_"," ")}

TOTALS:
Uploaded ${summary.total_uploaded || 0}
Created ${summary.total_created || 0}
Published ${summary.total_published || 0}
Upload hrs ${(summary.total_uploaded_hrs || 0).toFixed(1)}
Created hrs ${(summary.total_created_hrs || 0).toFixed(1)}

MONTHLY (${(monthly || []).length} months):
Peak uploads: ${peakMonth ? `${peakMonth.month} (${peakMonth.uploaded})` : "N/A"}
Best publish month: ${bestPubMonth ? `${bestPubMonth.month} (${bestPubMonth.published})` : "N/A"}

CHANNELS:
${topChannels || "No data"}

OUTPUT TYPES:
${outputStr || "No data"}

INPUT TYPES:
${inputStr || "No data"}

LANGUAGE:
${langStr || "No data"}

TOP USERS (up/cr/pub):
${topUsers || "No data"}

PLATFORMS:
${platStr || "No data"}
`
}



export async function queryNLQ(conversationHistory, systemPrompt) {

  const apiKey = process.env.REACT_APP_GROQ_API_KEY

  if(!apiKey || !apiKey.trim()){
    return "Groq API key not found. Add REACT_APP_GROQ_API_KEY to your .env file and restart the dev server."
  }

  try{

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          Authorization:`Bearer ${apiKey.trim()}`
        },
        body:JSON.stringify({
          model:"llama-3.3-70b-versatile",
          max_tokens:500,
          messages:[
            { role:"system", content:systemPrompt },
            ...conversationHistory
          ]
        })
      }
    )

    if(!response.ok){

      const err = await response.json().catch(()=>({}))

      if(response.status===401)
        return "Invalid API key. Check REACT_APP_GROQ_API_KEY."

      if(response.status===429)
        return "Rate limit reached. Please wait a moment."

      return `API error (${response.status}): ${err.error?.message || "Unknown error"}`
    }

    const data = await response.json()

    return data.choices?.[0]?.message?.content || "No response received from Groq."

  }catch(e){

    if(e.message?.includes("fetch"))
      return "Network error — check your internet connection."

    return `Error: ${e.message}`
  }
}



export const NLQ_KB = [

{
keys:["channel","gap","publish","difference"],
answer:"Channel B shows the biggest publish gap — 4,251 created vs only 19 published (0.45%). Channel D created 701 videos but published none. Channel A leads publishing with 71 videos."
},

{
keys:["output","format","publish rate"],
answer:"My Key Moments has the strongest publish rate (~2.6%). Key Moments leads total publishing with 41 videos."
},

{
keys:["input","interview","news"],
answer:"Interview is the most uploaded type with about 1,299 uploads, while News Bulletin leads in publishes."
},

{
keys:["language","english","hindi"],
answer:"English dominates uploads with 2,647 videos and 91 published. Hindi has 1,792 uploads but only 20 published."
},

{
keys:["user","contributor","top"],
answer:"Chandan is the top contributor with 489 uploads and 19 published. QA-Purushottam follows with 309 uploads and 13 published."
},

{
keys:["platform","youtube","reels","shorts"],
answer:"YouTube leads publishing followed by Reels and Shorts. Instagram and Facebook trail behind."
},

{
keys:["month","trend","growth"],
answer:"February 2026 is the peak upload month with 676 uploads and 2,756 created videos."
},

{
keys:["duration","hours"],
answer:"About 807 hours of video were uploaded which generated roughly 1,561 hours of created AI content."
},

{
keys:["summary","overview"],
answer:"Overall: 4,453 uploaded videos generated 14,914 created outputs but only 111 were published (0.74% rate). Channel A leads publishing."
}

]



export function queryNLQLocal(question){

  const q = question.toLowerCase()
  const tokens = q.split(/\s+/)

  let best = {score:0, idx:-1}

  NLQ_KB.forEach((entry,idx)=>{

    const score = entry.keys.reduce(
      (acc,k)=>
        acc +
        (q.includes(k)
          ? 2
          : tokens.some(t=>k.includes(t) && t.length>3)
          ? 1
          : 0),
      0
    )

    if(score > best.score)
      best = {score, idx}

  })

  if(best.score > 0)
    return NLQ_KB[best.idx].answer

  return "Dataset overview: 4,453 uploads generated 14,914 created videos, but only 111 were published (~0.74%)."
}