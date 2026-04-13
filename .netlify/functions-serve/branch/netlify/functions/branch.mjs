
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/branch.js
async function handler(req) {
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }
  try {
    const body = await req.json();
    const { eventTitle, ripples, userChoice } = body;
    if (!userChoice || !eventTitle) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: "No API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    let parallelsText = "";
    const TURBOPUFFER_KEY = process.env.TURBOPUFFER_API_KEY;
    if (TURBOPUFFER_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e3);
        const tpRes = await fetch("https://api.turbopuffer.com/v2/namespaces/consequence-events/query", {
          method: "POST",
          headers: { "Authorization": `Bearer ${TURBOPUFFER_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            rank_by: ["text", "BM25", userChoice],
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
              (p) => `- ${p.attributes?.event_name || p.id} (${p.attributes?.year || "?"})`
            ).join("\n")}`;
          }
        }
      } catch (e) {
      }
    }
    const chainSummary = ripples ? ripples.slice(-4).map((r, i) => `${i + 1}. ${r.headline}`).join("\n") : "";
    console.log(`Branch: "${userChoice}" for "${eventTitle}"`);
    let branch = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: attempt < 3 ? "claude-sonnet-4-20250514" : "claude-haiku-4-5-20251001",
            max_tokens: 2e3,
            system: `You generate 3-4 branching consequences for Timeline Manipulator by ReddX Industries. The user chose a response to a crisis.

Rules:
- Each consequence: punchy headline, domain, severity 1-5, delay
- Write a narration script for each (2-3 sentences, YouTube energy, sarcastic)
- LAST consequence is ALWAYS absurdly mundane. Narrator gets LIVID about something trivial.
- NEVER use em dashes
- Respond with ONLY valid JSON. No markdown.`,
            messages: [{
              role: "user",
              content: `Event: "${eventTitle}"
Recent consequences: ${chainSummary}
${parallelsText}
User chose: "${userChoice}"

Return JSON:
{
  "branch_title": "short title",
  "ripples": [
    {"id":1,"headline":"consequence","domain":"energy","severity":3,"delay":"weeks","source":{"title":"source","url":"https://example.com"}}
  ],
  "narrations": ["script 1","script 2","script 3"],
  "roast": "One sentence roasting the user"
}`
            }]
          })
        });
        if (claudeRes.status === 429) {
          console.log(`  Rate limited (attempt ${attempt}/3), waiting 10s...`);
          await new Promise((r) => setTimeout(r, 1e4));
          continue;
        }
        if (claudeRes.status >= 500) {
          console.log(`  Claude ${claudeRes.status} (attempt ${attempt}/3), retrying...`);
          await new Promise((r) => setTimeout(r, 3e3));
          continue;
        }
        if (!claudeRes.ok) {
          const err = await claudeRes.text();
          console.error("Claude error:", claudeRes.status, err.substring(0, 200));
          throw new Error(`Claude ${claudeRes.status}`);
        }
        const claudeData = await claudeRes.json();
        const text = claudeData.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("No JSON, retrying...");
          continue;
        }
        branch = JSON.parse(jsonMatch[0].replace(/```json|```/g, "").trim());
        break;
      } catch (err) {
        console.error(`  Attempt ${attempt} error:`, err.message);
        if (attempt === 3) throw err;
        await new Promise((r) => setTimeout(r, 3e3));
      }
    }
    if (!branch) {
      throw new Error("All retries failed");
    }
    console.log(`Branch generated: ${branch.ripples?.length || 0} ripples`);
    return new Response(JSON.stringify(branch), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Branch crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
export {
  handler as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvYnJhbmNoLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBuZXRsaWZ5L2Z1bmN0aW9ucy9icmFuY2guanNcbi8vIExpdmUgYnJhbmNoaW5nIHdpdGggcmV0cnkgKyBncmFjZWZ1bCBmYWxsYmFja1xuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSkge1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnUE9TVCBvbmx5JywgeyBzdGF0dXM6IDQwNSB9KVxuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgIGNvbnN0IHsgZXZlbnRUaXRsZSwgcmlwcGxlcywgdXNlckNob2ljZSB9ID0gYm9keVxuXG4gICAgaWYgKCF1c2VyQ2hvaWNlIHx8ICFldmVudFRpdGxlKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIGZpZWxkcycgfSksIHtcbiAgICAgICAgc3RhdHVzOiA0MDAsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb25zdCBBTlRIUk9QSUNfS0VZID0gcHJvY2Vzcy5lbnYuQU5USFJPUElDX0FQSV9LRVlcbiAgICBpZiAoIUFOVEhST1BJQ19LRVkpIHtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ05vIEFQSSBrZXknIH0pLCB7XG4gICAgICAgIHN0YXR1czogNTAwLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gVHVyYm9wdWZmZXIgcGFyYWxsZWxzICgzcyB0aW1lb3V0LCBub24tYmxvY2tpbmcpXG4gICAgbGV0IHBhcmFsbGVsc1RleHQgPSAnJ1xuICAgIGNvbnN0IFRVUkJPUFVGRkVSX0tFWSA9IHByb2Nlc3MuZW52LlRVUkJPUFVGRkVSX0FQSV9LRVlcbiAgICBpZiAoVFVSQk9QVUZGRVJfS0VZKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgMzAwMClcbiAgICAgICAgY29uc3QgdHBSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGkudHVyYm9wdWZmZXIuY29tL3YyL25hbWVzcGFjZXMvY29uc2VxdWVuY2UtZXZlbnRzL3F1ZXJ5Jywge1xuICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgIGhlYWRlcnM6IHsgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7VFVSQk9QVUZGRVJfS0VZfWAsICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICByYW5rX2J5OiBbJ3RleHQnLCAnQk0yNScsIHVzZXJDaG9pY2VdLFxuICAgICAgICAgICAgdG9wX2s6IDMsXG4gICAgICAgICAgICBpbmNsdWRlX2F0dHJpYnV0ZXM6IFsnZXZlbnRfbmFtZScsICdjb25zZXF1ZW5jZXMnLCAneWVhciddLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICAgIH0pXG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgICAgICBpZiAodHBSZXMub2spIHtcbiAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdHBSZXMuanNvbigpXG4gICAgICAgICAgY29uc3Qgcm93cyA9IGRhdGEucm93cyB8fCBbXVxuICAgICAgICAgIGlmIChyb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHBhcmFsbGVsc1RleHQgPSBgXFxuSGlzdG9yaWNhbCBwYXJhbGxlbHM6XFxuJHtyb3dzLm1hcChwID0+XG4gICAgICAgICAgICAgIGAtICR7cC5hdHRyaWJ1dGVzPy5ldmVudF9uYW1lIHx8IHAuaWR9ICgke3AuYXR0cmlidXRlcz8ueWVhciB8fCAnPyd9KWBcbiAgICAgICAgICAgICkuam9pbignXFxuJyl9YFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkgeyAvKiBza2lwICovIH1cbiAgICB9XG5cbiAgICBjb25zdCBjaGFpblN1bW1hcnkgPSByaXBwbGVzXG4gICAgICA/IHJpcHBsZXMuc2xpY2UoLTQpLm1hcCgociwgaSkgPT4gYCR7aSArIDF9LiAke3IuaGVhZGxpbmV9YCkuam9pbignXFxuJylcbiAgICAgIDogJydcblxuICAgIGNvbnNvbGUubG9nKGBCcmFuY2g6IFwiJHt1c2VyQ2hvaWNlfVwiIGZvciBcIiR7ZXZlbnRUaXRsZX1cImApXG5cbiAgICAvLyBDbGF1ZGUgd2l0aCByZXRyeSAodXAgdG8gMyBhdHRlbXB0cylcbiAgICBsZXQgYnJhbmNoID0gbnVsbFxuICAgIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IDM7IGF0dGVtcHQrKykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgY2xhdWRlUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmFudGhyb3BpYy5jb20vdjEvbWVzc2FnZXMnLCB7XG4gICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICd4LWFwaS1rZXknOiBBTlRIUk9QSUNfS0VZLFxuICAgICAgICAgICAgJ2FudGhyb3BpYy12ZXJzaW9uJzogJzIwMjMtMDYtMDEnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgbW9kZWw6IGF0dGVtcHQgPCAzID8gJ2NsYXVkZS1zb25uZXQtNC0yMDI1MDUxNCcgOiAnY2xhdWRlLWhhaWt1LTQtNS0yMDI1MTAwMScsXG4gICAgICAgICAgICBtYXhfdG9rZW5zOiAyMDAwLFxuICAgICAgICAgICAgc3lzdGVtOiBgWW91IGdlbmVyYXRlIDMtNCBicmFuY2hpbmcgY29uc2VxdWVuY2VzIGZvciBUaW1lbGluZSBNYW5pcHVsYXRvciBieSBSZWRkWCBJbmR1c3RyaWVzLiBUaGUgdXNlciBjaG9zZSBhIHJlc3BvbnNlIHRvIGEgY3Jpc2lzLlxuXG5SdWxlczpcbi0gRWFjaCBjb25zZXF1ZW5jZTogcHVuY2h5IGhlYWRsaW5lLCBkb21haW4sIHNldmVyaXR5IDEtNSwgZGVsYXlcbi0gV3JpdGUgYSBuYXJyYXRpb24gc2NyaXB0IGZvciBlYWNoICgyLTMgc2VudGVuY2VzLCBZb3VUdWJlIGVuZXJneSwgc2FyY2FzdGljKVxuLSBMQVNUIGNvbnNlcXVlbmNlIGlzIEFMV0FZUyBhYnN1cmRseSBtdW5kYW5lLiBOYXJyYXRvciBnZXRzIExJVklEIGFib3V0IHNvbWV0aGluZyB0cml2aWFsLlxuLSBORVZFUiB1c2UgZW0gZGFzaGVzXG4tIFJlc3BvbmQgd2l0aCBPTkxZIHZhbGlkIEpTT04uIE5vIG1hcmtkb3duLmAsXG4gICAgICAgICAgICBtZXNzYWdlczogW3tcbiAgICAgICAgICAgICAgcm9sZTogJ3VzZXInLFxuICAgICAgICAgICAgICBjb250ZW50OiBgRXZlbnQ6IFwiJHtldmVudFRpdGxlfVwiXG5SZWNlbnQgY29uc2VxdWVuY2VzOiAke2NoYWluU3VtbWFyeX1cbiR7cGFyYWxsZWxzVGV4dH1cblVzZXIgY2hvc2U6IFwiJHt1c2VyQ2hvaWNlfVwiXG5cblJldHVybiBKU09OOlxue1xuICBcImJyYW5jaF90aXRsZVwiOiBcInNob3J0IHRpdGxlXCIsXG4gIFwicmlwcGxlc1wiOiBbXG4gICAge1wiaWRcIjoxLFwiaGVhZGxpbmVcIjpcImNvbnNlcXVlbmNlXCIsXCJkb21haW5cIjpcImVuZXJneVwiLFwic2V2ZXJpdHlcIjozLFwiZGVsYXlcIjpcIndlZWtzXCIsXCJzb3VyY2VcIjp7XCJ0aXRsZVwiOlwic291cmNlXCIsXCJ1cmxcIjpcImh0dHBzOi8vZXhhbXBsZS5jb21cIn19XG4gIF0sXG4gIFwibmFycmF0aW9uc1wiOiBbXCJzY3JpcHQgMVwiLFwic2NyaXB0IDJcIixcInNjcmlwdCAzXCJdLFxuICBcInJvYXN0XCI6IFwiT25lIHNlbnRlbmNlIHJvYXN0aW5nIHRoZSB1c2VyXCJcbn1gXG4gICAgICAgICAgICB9XVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKGNsYXVkZVJlcy5zdGF0dXMgPT09IDQyOSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAgIFJhdGUgbGltaXRlZCAoYXR0ZW1wdCAke2F0dGVtcHR9LzMpLCB3YWl0aW5nIDEwcy4uLmApXG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDEwMDAwKSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNsYXVkZVJlcy5zdGF0dXMgPj0gNTAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYCAgQ2xhdWRlICR7Y2xhdWRlUmVzLnN0YXR1c30gKGF0dGVtcHQgJHthdHRlbXB0fS8zKSwgcmV0cnlpbmcuLi5gKVxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAzMDAwKSlcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjbGF1ZGVSZXMub2spIHtcbiAgICAgICAgICBjb25zdCBlcnIgPSBhd2FpdCBjbGF1ZGVSZXMudGV4dCgpXG4gICAgICAgICAgY29uc29sZS5lcnJvcignQ2xhdWRlIGVycm9yOicsIGNsYXVkZVJlcy5zdGF0dXMsIGVyci5zdWJzdHJpbmcoMCwgMjAwKSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENsYXVkZSAke2NsYXVkZVJlcy5zdGF0dXN9YClcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNsYXVkZURhdGEgPSBhd2FpdCBjbGF1ZGVSZXMuanNvbigpXG4gICAgICAgIGNvbnN0IHRleHQgPSBjbGF1ZGVEYXRhLmNvbnRlbnQuZmlsdGVyKGIgPT4gYi50eXBlID09PSAndGV4dCcpLm1hcChiID0+IGIudGV4dCkuam9pbignJylcbiAgICAgICAgY29uc3QganNvbk1hdGNoID0gdGV4dC5tYXRjaCgvXFx7W1xcc1xcU10qXFx9LylcblxuICAgICAgICBpZiAoIWpzb25NYXRjaCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIEpTT04sIHJldHJ5aW5nLi4uJylcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgYnJhbmNoID0gSlNPTi5wYXJzZShqc29uTWF0Y2hbMF0ucmVwbGFjZSgvYGBganNvbnxgYGAvZywgJycpLnRyaW0oKSlcbiAgICAgICAgYnJlYWsgLy8gc3VjY2Vzc1xuXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgICBBdHRlbXB0ICR7YXR0ZW1wdH0gZXJyb3I6YCwgZXJyLm1lc3NhZ2UpXG4gICAgICAgIGlmIChhdHRlbXB0ID09PSAzKSB0aHJvdyBlcnJcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UociA9PiBzZXRUaW1lb3V0KHIsIDMwMDApKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghYnJhbmNoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCByZXRyaWVzIGZhaWxlZCcpXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYEJyYW5jaCBnZW5lcmF0ZWQ6ICR7YnJhbmNoLnJpcHBsZXM/Lmxlbmd0aCB8fCAwfSByaXBwbGVzYClcblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoYnJhbmNoKSwge1xuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXG4gICAgfSlcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdCcmFuY2ggY3Jhc2g6JywgZXJyLm1lc3NhZ2UpXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIH0pXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFHQSxlQUFPLFFBQStCLEtBQUs7QUFDekMsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksU0FBUyxhQUFhLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUNsRDtBQUVBLE1BQUk7QUFDRixVQUFNLE9BQU8sTUFBTSxJQUFJLEtBQUs7QUFDNUIsVUFBTSxFQUFFLFlBQVksU0FBUyxXQUFXLElBQUk7QUFFNUMsUUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZO0FBQzlCLGFBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8saUJBQWlCLENBQUMsR0FBRztBQUFBLFFBQy9ELFFBQVE7QUFBQSxRQUFLLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDN0QsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLGdCQUFnQixRQUFRLElBQUk7QUFDbEMsUUFBSSxDQUFDLGVBQWU7QUFDbEIsYUFBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxhQUFhLENBQUMsR0FBRztBQUFBLFFBQzNELFFBQVE7QUFBQSxRQUFLLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDN0QsQ0FBQztBQUFBLElBQ0g7QUFHQSxRQUFJLGdCQUFnQjtBQUNwQixVQUFNLGtCQUFrQixRQUFRLElBQUk7QUFDcEMsUUFBSSxpQkFB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
