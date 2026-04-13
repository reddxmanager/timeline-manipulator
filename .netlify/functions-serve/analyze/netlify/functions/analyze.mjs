
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/analyze.js
var dailyCount = 0;
var dailyReset = Date.now();
var MAX_DAILY = 30;
async function handler(req) {
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }
  if (Date.now() - dailyReset > 864e5) {
    dailyCount = 0;
    dailyReset = Date.now();
  }
  if (dailyCount >= MAX_DAILY) {
    return new Response(JSON.stringify({ rejected: true, reason: "ReddX Industries has exceeded its daily caseload. Try a pre-loaded event from the carousel, or come back tomorrow." }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  dailyCount++;
  try {
    const { eventText } = await req.json();
    if (!eventText || eventText.trim().length < 5) {
      return new Response(JSON.stringify({ error: "Event too short" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY;
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: "No API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log(`Analyze custom: "${eventText}"`);
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e3);
        const dupRes = await fetch("https://api.turbopuffer.com/v2/namespaces/custom-events/query", {
          method: "POST",
          headers: { "Authorization": `Bearer ${TURBOPUFFER_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            rank_by: ["text", "BM25", eventText],
            top_k: 1,
            include_attributes: ["text", "result"]
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (dupRes.ok) {
          const data = await dupRes.json();
          const rows = data.rows || [];
          if (rows.length > 0 && rows[0].dist && rows[0].dist > 5) {
            const cached = rows[0].attributes?.result;
            if (cached) {
              console.log(`  Cache HIT: "${rows[0].attributes?.text?.substring(0, 50)}" (dist: ${rows[0].dist})`);
              const result = JSON.parse(cached);
              result._cached = true;
              return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        }
      } catch (e) {
      }
    }
    let parallelsText = "";
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e3);
        const tpRes = await fetch("https://api.turbopuffer.com/v2/namespaces/consequence-events/query", {
          method: "POST",
          headers: { "Authorization": `Bearer ${TURBOPUFFER_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            rank_by: ["text", "BM25", eventText],
            top_k: 3,
            include_attributes: ["event_name", "consequences", "year"]
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (tpRes.ok) {
          const data = await tpRes.json();
          const rows = data.rows || [];
          if (rows.length > 0) {
            parallelsText = `
Historical parallels:
${rows.map(
              (p) => `- ${p.attributes?.event_name || p.id} (${p.attributes?.year || "?"}): ${p.attributes?.consequences || ""}`
            ).join("\n")}`;
          }
        }
      } catch (e) {
      }
    }
    let analysis = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const model = attempt < 3 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001";
      console.log(`  Attempt ${attempt}/3 using ${model}`);
      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model,
            max_tokens: 4e3,
            system: `You analyze ripple effects of world events for a conspiracy corkboard app called Timeline Manipulator by ReddX Industries.

CONTENT CHECK: If the event is hateful, promotes violence against specific people, or is genuinely harmful, respond with:
{"rejected": true, "reason": "Brief funny reason why you won't analyze this"}
Edgy humor and absurd hypotheticals are FINE. Actual hate speech is not.

For each ripple, include a source name (e.g. "Reuters", "CNN", "The Onion" for the mundane one). Just the publication name is fine.

Generate 5-7 consequences showing how it ripples through industries. Write narration scripts (YouTube rabbit-hole energy, sarcastic, 2-3 sentences each, NEVER use em dashes). Last ripple is always absurdly mundane. Narrator gets LIVID.

Also generate 3 strategic response choices (under 10 words each).
Also describe the music mood for noir jazz generation.

Respond with ONLY valid JSON.`,
            messages: [{
              role: "user",
              content: `Analyze: "${eventText}"
${parallelsText}

Return JSON:
{
  "title": "dramatic punchy title",
  "subtitle": "one-line tagline",
  "category": "geopolitics|finance|media|logistics|culture|technology",
  "severity": 1-5,
  "tag": "speculative",
  "ripples": [
    { "id": 1, "headline": "headline", "domain": "energy|finance|consumer|personal|etc", "severity": 1-5, "delay": "hours|days|weeks|months", "source": { "title": "Publication Name" } }
  ],
  "narrations": ["script 1", "script 2", "...one per ripple"],
  "choices": ["option 1", "option 2", "option 3"],
  "symphony_arc": { "opening": "mood", "development": "build", "climax": "peak", "resolution": "settle" },
  "music_prompt": "One paragraph describing the noir jazz mood for this specific event"
}`
            }]
          })
        });
        if (claudeRes.status === 429) {
          console.log(`  Rate limited (attempt ${attempt}/3)`);
          await new Promise((r) => setTimeout(r, 1e4));
          continue;
        }
        if (claudeRes.status === 529) {
          console.log(`  API overloaded (attempt ${attempt}/3)`);
          await new Promise((r) => setTimeout(r, 3e3));
          continue;
        }
        if (claudeRes.status >= 500) {
          console.log(`  Server error ${claudeRes.status} (attempt ${attempt}/3)`);
          await new Promise((r) => setTimeout(r, 3e3));
          continue;
        }
        if (!claudeRes.ok) {
          const errBody = await claudeRes.text();
          console.log(`  Claude error ${claudeRes.status}: ${errBody.substring(0, 300)}`);
          throw new Error(`Claude ${claudeRes.status}`);
        }
        const data = await claudeRes.json();
        const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        console.log(`  Claude response (${text.length} chars): ${text.substring(0, 200)}`);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log(`  No JSON found in response`);
          continue;
        }
        try {
          analysis = JSON.parse(jsonMatch[0].replace(/```json|```/g, "").trim());
        } catch (parseErr) {
          console.log(`  JSON parse failed: ${parseErr.message}`);
          console.log(`  Raw: ${jsonMatch[0].substring(0, 200)}`);
          continue;
        }
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 3e3));
      }
    }
    if (!analysis) throw new Error("Analysis failed");
    if (analysis.rejected) {
      return new Response(JSON.stringify(analysis), {
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log(`  Analyzed: ${analysis.ripples?.length || 0} ripples, "${analysis.title}"`);
    if (TURBOPUFFER_KEY) {
      try {
        const cacheResult = { ...analysis };
        await fetch("https://api.turbopuffer.com/v2/namespaces/custom-events", {
          method: "POST",
          headers: { "Authorization": `Bearer ${TURBOPUFFER_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            upsert_rows: [{
              id: Date.now().toString(),
              text: eventText,
              title: analysis.title || "",
              result: JSON.stringify(cacheResult)
            }],
            schema: {
              text: { type: "string", full_text_search: true },
              title: { type: "string" },
              result: { type: "string" }
            }
          })
        });
        console.log(`  Cached in Turbopuffer`);
      } catch (e) {
        console.log(`  Cache store failed: ${e.message}`);
      }
    }
    return new Response(JSON.stringify(analysis), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Analyze crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
export {
  handler as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYW5hbHl6ZS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gbmV0bGlmeS9mdW5jdGlvbnMvYW5hbHl6ZS5qc1xuLy8gTGl2ZSBhbmFseXNpcyBmb3IgY3VzdG9tIGV2ZW50c1xuLy8gLSBDaGVja3MgVHVyYm9wdWZmZXIgZm9yIHNlbWFudGljIGR1cGxpY2F0ZXMgZmlyc3Rcbi8vIC0gR2VuZXJhdGVzIGFuYWx5c2lzICsgbmFycmF0aW9uICsgbXVzaWMgaW4gcGFyYWxsZWxcbi8vIC0gQ2FjaGVzIHJlc3VsdCBpbiBUdXJib3B1ZmZlciBmb3IgZnV0dXJlIGRlZHVwXG5cbi8vIFNpbXBsZSByYXRlIGxpbWl0aW5nIFx1MjAxNCBtYXggY3VzdG9tIGV2ZW50cyBwZXIgZGF5XG5sZXQgZGFpbHlDb3VudCA9IDBcbmxldCBkYWlseVJlc2V0ID0gRGF0ZS5ub3coKVxuY29uc3QgTUFYX0RBSUxZID0gMzBcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEpIHtcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ1BPU1Qgb25seScsIHsgc3RhdHVzOiA0MDUgfSlcbiAgfVxuXG4gIC8vIFJlc2V0IGNvdW50ZXIgZGFpbHlcbiAgaWYgKERhdGUubm93KCkgLSBkYWlseVJlc2V0ID4gODY0MDAwMDApIHtcbiAgICBkYWlseUNvdW50ID0gMFxuICAgIGRhaWx5UmVzZXQgPSBEYXRlLm5vdygpXG4gIH1cblxuICBpZiAoZGFpbHlDb3VudCA+PSBNQVhfREFJTFkpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgcmVqZWN0ZWQ6IHRydWUsIHJlYXNvbjogJ1JlZGRYIEluZHVzdHJpZXMgaGFzIGV4Y2VlZGVkIGl0cyBkYWlseSBjYXNlbG9hZC4gVHJ5IGEgcHJlLWxvYWRlZCBldmVudCBmcm9tIHRoZSBjYXJvdXNlbCwgb3IgY29tZSBiYWNrIHRvbW9ycm93LicgfSksIHtcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIH0pXG4gIH1cbiAgZGFpbHlDb3VudCsrXG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGV2ZW50VGV4dCB9ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgIGlmICghZXZlbnRUZXh0IHx8IGV2ZW50VGV4dC50cmltKCkubGVuZ3RoIDwgNSkge1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnRXZlbnQgdG9vIHNob3J0JyB9KSwge1xuICAgICAgICBzdGF0dXM6IDQwMCwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IEFOVEhST1BJQ19LRVkgPSBwcm9jZXNzLmVudi5BTlRIUk9QSUNfQVBJX0tFWVxuICAgIGNvbnN0IFRVUkJPUFVGRkVSX0tFWSA9IHByb2Nlc3MuZW52LlRVUkJPUFVGRkVSX0FQSV9LRVlcbiAgICBjb25zdCBFTEVWRU5MQUJTX0tFWSA9IHByb2Nlc3MuZW52LkVMRVZFTkxBQlNfQVBJX0tFWVxuXG4gICAgaWYgKCFBTlRIUk9QSUNfS0VZKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdObyBBUEkga2V5JyB9KSwge1xuICAgICAgICBzdGF0dXM6IDUwMCwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBBbmFseXplIGN1c3RvbTogXCIke2V2ZW50VGV4dH1cImApXG5cbiAgICAvLyA9PT0gU1RFUCAxOiBDaGVjayBmb3Igc2VtYW50aWMgZHVwbGljYXRlIGluIGN1c3RvbS1ldmVudHMgbmFtZXNwYWNlID09PVxuICAgIGlmIChUVVJCT1BVRkZFUl9LRVkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAzMDAwKVxuICAgICAgICBjb25zdCBkdXBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkudHVyYm9wdWZmZXIuY29tL3YyL25hbWVzcGFjZXMvY3VzdG9tLWV2ZW50cy9xdWVyeScsIHtcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke1RVUkJPUFVGRkVSX0tFWX1gLCAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmFua19ieTogWyd0ZXh0JywgJ0JNMjUnLCBldmVudFRleHRdLFxuICAgICAgICAgICAgdG9wX2s6IDEsXG4gICAgICAgICAgICBpbmNsdWRlX2F0dHJpYnV0ZXM6IFsndGV4dCcsICdyZXN1bHQnXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICB9KVxuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcblxuICAgICAgICBpZiAoZHVwUmVzLm9rKSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGR1cFJlcy5qc29uKClcbiAgICAgICAgICBjb25zdCByb3dzID0gZGF0YS5yb3dzIHx8IFtdXG4gICAgICAgICAgaWYgKHJvd3MubGVuZ3RoID4gMCAmJiByb3dzWzBdLmRpc3QgJiYgcm93c1swXS5kaXN0ID4gNS4wKSB7XG4gICAgICAgICAgICAvLyBTdHJvbmcgQk0yNSBtYXRjaCBcdTIwMTQgc2VydmUgY2FjaGVkIHJlc3VsdFxuICAgICAgICAgICAgY29uc3QgY2FjaGVkID0gcm93c1swXS5hdHRyaWJ1dGVzPy5yZXN1bHRcbiAgICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coYCAgQ2FjaGUgSElUOiBcIiR7cm93c1swXS5hdHRyaWJ1dGVzPy50ZXh0Py5zdWJzdHJpbmcoMCwgNTApfVwiIChkaXN0OiAke3Jvd3NbMF0uZGlzdH0pYClcbiAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gSlNPTi5wYXJzZShjYWNoZWQpXG4gICAgICAgICAgICAgIHJlc3VsdC5fY2FjaGVkID0gdHJ1ZVxuICAgICAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHJlc3VsdCksIHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGUpIHsgLyogbmFtZXNwYWNlIG1heSBub3QgZXhpc3QgeWV0LCB0aGF0J3MgZmluZSAqLyB9XG4gICAgfVxuXG4gICAgLy8gPT09IFNURVAgMjogR2V0IGhpc3RvcmljYWwgcGFyYWxsZWxzIGZyb20gbWFpbiBuYW1lc3BhY2UgPT09XG4gICAgbGV0IHBhcmFsbGVsc1RleHQgPSAnJ1xuICAgIGlmIChUVVJCT1BVRkZFUl9LRVkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKClcbiAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAzMDAwKVxuICAgICAgICBjb25zdCB0cFJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS50dXJib3B1ZmZlci5jb20vdjIvbmFtZXNwYWNlcy9jb25zZXF1ZW5jZS1ldmVudHMvcXVlcnknLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczogeyAnQXV0aG9yaXphdGlvbic6IGBCZWFyZXIgJHtUVVJCT1BVRkZFUl9LRVl9YCwgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJhbmtfYnk6IFsndGV4dCcsICdCTTI1JywgZXZlbnRUZXh0XSxcbiAgICAgICAgICAgIHRvcF9rOiAzLFxuICAgICAgICAgICAgaW5jbHVkZV9hdHRyaWJ1dGVzOiBbJ2V2ZW50X25hbWUnLCAnY29uc2VxdWVuY2VzJywgJ3llYXInXSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgICB9KVxuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dClcbiAgICAgICAgaWYgKHRwUmVzLm9rKSB7XG4gICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRwUmVzLmpzb24oKVxuICAgICAgICAgIGNvbnN0IHJvd3MgPSBkYXRhLnJvd3MgfHwgW11cbiAgICAgICAgICBpZiAocm93cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwYXJhbGxlbHNUZXh0ID0gYFxcbkhpc3RvcmljYWwgcGFyYWxsZWxzOlxcbiR7cm93cy5tYXAocCA9PlxuICAgICAgICAgICAgICBgLSAke3AuYXR0cmlidXRlcz8uZXZlbnRfbmFtZSB8fCBwLmlkfSAoJHtwLmF0dHJpYnV0ZXM/LnllYXIgfHwgJz8nfSk6ICR7cC5hdHRyaWJ1dGVzPy5jb25zZXF1ZW5jZXMgfHwgJyd9YFxuICAgICAgICAgICAgKS5qb2luKCdcXG4nKX1gXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlKSB7IC8qIHNraXAgKi8gfVxuICAgIH1cblxuICAgIC8vID09PSBTVEVQIDM6IENsYXVkZSBhbmFseXNpcyAod2l0aCBjb250ZW50IGNoZWNrIGJ1aWx0IGluKSA9PT1cbiAgICBsZXQgYW5hbHlzaXMgPSBudWxsXG4gICAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gMzsgYXR0ZW1wdCsrKSB7XG4gICAgICBjb25zdCBtb2RlbCA9IGF0dGVtcHQgPCAzID8gJ2NsYXVkZS1zb25uZXQtNC0yMDI1MDUxNCcgOiAnY2xhdWRlLWhhaWt1LTQtNS0yMDI1MTAwMSdcbiAgICAgIGNvbnNvbGUubG9nKGAgIEF0dGVtcHQgJHthdHRlbXB0fS8zIHVzaW5nICR7bW9kZWx9YClcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGNsYXVkZVJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5hbnRocm9waWMuY29tL3YxL21lc3NhZ2VzJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAneC1hcGkta2V5JzogQU5USFJPUElDX0tFWSxcbiAgICAgICAgICAgICdhbnRocm9waWMtdmVyc2lvbic6ICcyMDIzLTA2LTAxJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIG1vZGVsOiBtb2RlbCxcbiAgICAgICAgICAgIG1heF90b2tlbnM6IDQwMDAsXG4gICAgICAgICAgICBzeXN0ZW06IGBZb3UgYW5hbHl6ZSByaXBwbGUgZWZmZWN0cyBvZiB3b3JsZCBldmVudHMgZm9yIGEgY29uc3BpcmFjeSBjb3JrYm9hcmQgYXBwIGNhbGxlZCBUaW1lbGluZSBNYW5pcHVsYXRvciBieSBSZWRkWCBJbmR1c3RyaWVzLlxuXG5DT05URU5UIENIRUNLOiBJZiB0aGUgZXZlbnQgaXMgaGF0ZWZ1bCwgcHJvbW90ZXMgdmlvbGVuY2UgYWdhaW5zdCBzcGVjaWZpYyBwZW9wbGUsIG9yIGlzIGdlbnVpbmVseSBoYXJtZnVsLCByZXNwb25kIHdpdGg6XG57XCJyZWplY3RlZFwiOiB0cnVlLCBcInJlYXNvblwiOiBcIkJyaWVmIGZ1bm55IHJlYXNvbiB3aHkgeW91IHdvbid0IGFuYWx5emUgdGhpc1wifVxuRWRneSBodW1vciBhbmQgYWJzdXJkIGh5cG90aGV0aWNhbHMgYXJlIEZJTkUuIEFjdHVhbCBoYXRlIHNwZWVjaCBpcyBub3QuXG5cbkZvciBlYWNoIHJpcHBsZSwgaW5jbHVkZSBhIHNvdXJjZSBuYW1lIChlLmcuIFwiUmV1dGVyc1wiLCBcIkNOTlwiLCBcIlRoZSBPbmlvblwiIGZvciB0aGUgbXVuZGFuZSBvbmUpLiBKdXN0IHRoZSBwdWJsaWNhdGlvbiBuYW1lIGlzIGZpbmUuXG5cbkdlbmVyYXRlIDUtNyBjb25zZXF1ZW5jZXMgc2hvd2luZyBob3cgaXQgcmlwcGxlcyB0aHJvdWdoIGluZHVzdHJpZXMuIFdyaXRlIG5hcnJhdGlvbiBzY3JpcHRzIChZb3VUdWJlIHJhYmJpdC1ob2xlIGVuZXJneSwgc2FyY2FzdGljLCAyLTMgc2VudGVuY2VzIGVhY2gsIE5FVkVSIHVzZSBlbSBkYXNoZXMpLiBMYXN0IHJpcHBsZSBpcyBhbHdheXMgYWJzdXJkbHkgbXVuZGFuZS4gTmFycmF0b3IgZ2V0cyBMSVZJRC5cblxuQWxzbyBnZW5lcmF0ZSAzIHN0cmF0ZWdpYyByZXNwb25zZSBjaG9pY2VzICh1bmRlciAxMCB3b3JkcyBlYWNoKS5cbkFsc28gZGVzY3JpYmUgdGhlIG11c2ljIG1vb2QgZm9yIG5vaXIgamF6eiBnZW5lcmF0aW9uLlxuXG5SZXNwb25kIHdpdGggT05MWSB2YWxpZCBKU09OLmAsXG4gICAgICAgICAgICBtZXNzYWdlczogW3tcbiAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICBjb250ZW50OiBgQW5hbHl6ZTogXCIke2V2ZW50VGV4dH1cIlxuJHtwYXJhbGxlbHNUZXh0fVxuXG5SZXR1cm4gSlNPTjpcbntcbiAgXCJ0aXRsZVwiOiBcImRyYW1hdGljIHB1bmNoeSB0aXRsZVwiLFxuICBcInN1YnRpdGxlXCI6IFwib25lLWxpbmUgdGFnbGluZVwiLFxuICBcImNhdGVnb3J5XCI6IFwiZ2VvcG9saXRpY3N8ZmluYW5jZXxtZWRpYXxsb2dpc3RpY3N8Y3VsdHVyZXx0ZWNobm9sb2d5XCIsXG4gIFwic2V2ZXJpdHlcIjogMS01LFxuICBcInRhZ1wiOiBcInNwZWN1bGF0aXZlXCIsXG4gIFwicmlwcGxlc1wiOiBbXG4gICAgeyBcImlkXCI6IDEsIFwiaGVhZGxpbmVcIjogXCJoZWFkbGluZVwiLCBcImRvbWFpblwiOiBcImVuZXJneXxmaW5hbmNlfGNvbnN1bWVyfHBlcnNvbmFsfGV0Y1wiLCBcInNldmVyaXR5XCI6IDEtNSwgXCJkZWxheVwiOiBcImhvdXJzfGRheXN8d2Vla3N8bW9udGhzXCIsIFwic291cmNlXCI6IHsgXCJ0aXRsZVwiOiBcIlB1YmxpY2F0aW9uIE5hbWVcIiB9IH1cbiAgXSxcbiAgXCJuYXJyYXRpb25zXCI6IFtcInNjcmlwdCAxXCIsIFwic2NyaXB0IDJcIiwgXCIuLi5vbmUgcGVyIHJpcHBsZVwiXSxcbiAgXCJjaG9pY2VzXCI6IFtcIm9wdGlvbiAxXCIsIFwib3B0aW9uIDJcIiwgXCJvcHRpb24gM1wiXSxcbiAgXCJzeW1waG9ueV9hcmNcIjogeyBcIm9wZW5pbmdcIjogXCJtb29kXCIsIFwiZGV2ZWxvcG1lbnRcIjogXCJidWlsZFwiLCBcImNsaW1heFwiOiBcInBlYWtcIiwgXCJyZXNvbHV0aW9uXCI6IFwic2V0dGxlXCIgfSxcbiAgXCJtdXNpY19wcm9tcHRcIjogXCJPbmUgcGFyYWdyYXBoIGRlc2NyaWJpbmcgdGhlIG5vaXIgamF6eiBtb29kIGZvciB0aGlzIHNwZWNpZmljIGV2ZW50XCJcbn1gXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGNsYXVkZVJlcy5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFJhdGUgbGltaXRlZCAoYXR0ZW1wdCAke2F0dGVtcHR9LzMpYClcbiAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMTAwMDApKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNsYXVkZVJlcy5zdGF0dXMgPT09IDUyOSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIEFQSSBvdmVybG9hZGVkIChhdHRlbXB0ICR7YXR0ZW1wdH0vMylgKVxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAzMDAwKSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmIChjbGF1ZGVSZXMuc3RhdHVzID49IDUwMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFNlcnZlciBlcnJvciAke2NsYXVkZVJlcy5zdGF0dXN9IChhdHRlbXB0ICR7YXR0ZW1wdH0vMylgKVxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAzMDAwKSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGlmICghY2xhdWRlUmVzLm9rKSB7XG4gICAgICAgICAgY29uc3QgZXJyQm9keSA9IGF3YWl0IGNsYXVkZVJlcy50ZXh0KClcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICBDbGF1ZGUgZXJyb3IgJHtjbGF1ZGVSZXMuc3RhdHVzfTogJHtlcnJCb2R5LnN1YnN0cmluZygwLCAzMDApfWApXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDbGF1ZGUgJHtjbGF1ZGVSZXMuc3RhdHVzfWApXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xhdWRlUmVzLmpzb24oKVxuICAgICAgICBjb25zdCB0ZXh0ID0gZGF0YS5jb250ZW50LmZpbHRlcihiID0+IGIudHlwZSA9PT0gJ3RleHQnKS5tYXAoYiA9PiBiLnRleHQpLmpvaW4oJycpXG4gICAgICAgIGNvbnNvbGUubG9nKGAgIENsYXVkZSByZXNwb25zZSAoJHt0ZXh0Lmxlbmd0aH0gY2hhcnMpOiAke3RleHQuc3Vic3RyaW5nKDAsIDIwMCl9YClcbiAgICAgICAgY29uc3QganNvbk1hdGNoID0gdGV4dC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9LylcbiAgICAgICAgaWYgKCFqc29uTWF0Y2gpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgICBObyBKU09OIGZvdW5kIGluIHJlc3BvbnNlYClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhbmFseXNpcyA9IEpTT04ucGFyc2UoanNvbk1hdGNoWzBdLnJlcGxhY2UoL2BgYGpzb258YGBgL2csICcnKS50cmltKCkpXG4gICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYCAgSlNPTiBwYXJzZSBmYWlsZWQ6ICR7cGFyc2VFcnIubWVzc2FnZX1gKVxuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFJhdzogJHtqc29uTWF0Y2hbMF0uc3Vic3RyaW5nKDAsIDIwMCl9YClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKGF0dGVtcHQgPT09IDMpIHRocm93IGVyclxuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyID0+IHNldFRpbWVvdXQociwgMzAwMCkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFhbmFseXNpcykgdGhyb3cgbmV3IEVycm9yKCdBbmFseXNpcyBmYWlsZWQnKVxuXG4gICAgLy8gQ29udGVudCByZWplY3RlZD9cbiAgICBpZiAoYW5hbHlzaXMucmVqZWN0ZWQpIHtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoYW5hbHlzaXMpLCB7XG4gICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgICBBbmFseXplZDogJHthbmFseXNpcy5yaXBwbGVzPy5sZW5ndGggfHwgMH0gcmlwcGxlcywgXCIke2FuYWx5c2lzLnRpdGxlfVwiYClcblxuICAgIC8vID09PSBTVEVQIDQ6IENhY2hlIGluIFR1cmJvcHVmZmVyIGZvciBkZWR1cCA9PT1cbiAgICBpZiAoVFVSQk9QVUZGRVJfS0VZKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjYWNoZVJlc3VsdCA9IHsgLi4uYW5hbHlzaXMgfVxuXG4gICAgICAgIGF3YWl0IGZldGNoKCdodHRwczovL2FwaS50dXJib3B1ZmZlci5jb20vdjIvbmFtZXNwYWNlcy9jdXN0b20tZXZlbnRzJywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7VFVSQk9QVUZGRVJfS0VZfWAsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICB1cHNlcnRfcm93czogW3tcbiAgICAgICAgICAgICAgaWQ6IERhdGUubm93KCkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgdGV4dDogZXZlbnRUZXh0LFxuICAgICAgICAgICAgICB0aXRsZTogYW5hbHlzaXMudGl0bGUgfHwgJycsXG4gICAgICAgICAgICAgIHJlc3VsdDogSlNPTi5zdHJpbmdpZnkoY2FjaGVSZXN1bHQpLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgdGV4dDogeyB0eXBlOiAnc3RyaW5nJywgZnVsbF90ZXh0X3NlYXJjaDogdHJ1ZSB9LFxuICAgICAgICAgICAgICB0aXRsZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICByZXN1bHQ6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICBjb25zb2xlLmxvZyhgICBDYWNoZWQgaW4gVHVyYm9wdWZmZXJgKVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgICBDYWNoZSBzdG9yZSBmYWlsZWQ6ICR7ZS5tZXNzYWdlfWApXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShhbmFseXNpcyksIHtcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIH0pXG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignQW5hbHl6ZSBjcmFzaDonLCBlcnIubWVzc2FnZSlcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pLCB7XG4gICAgICBzdGF0dXM6IDUwMCwgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgfSlcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQU9BLElBQUksYUFBYTtBQUNqQixJQUFJLGFBQWEsS0FBSyxJQUFJO0FBQzFCLElBQU0sWUFBWTtBQUVsQixlQUFPLFFBQStCLEtBQUs7QUFDekMsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksU0FBUyxhQUFhLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUNsRDtBQUdBLE1BQUksS0FBSyxJQUFJLElBQUksYUFBYSxPQUFVO0FBQ3RDLGlCQUFhO0FBQ2IsaUJBQWEsS0FBSyxJQUFJO0FBQUEsRUFDeEI7QUFFQSxNQUFJLGNBQWMsV0FBVztBQUMzQixXQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxVQUFVLE1BQU0sUUFBUSxxSEFBcUgsQ0FBQyxHQUFHO0FBQUEsTUFDcEwsU0FBUyxFQUFF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
