
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/music.js
async function handler(req) {
  if (req.method !== "POST") {
    return new Response("POST only", { status: 405 });
  }
  try {
    const { musicPrompt } = await req.json();
    const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_KEY || !musicPrompt) {
      return new Response("Missing key or prompt", { status: 400 });
    }
    console.log(`Music gen: "${musicPrompt.substring(0, 60)}..."`);
    const prompt = [
      "Late night noir jazz. Smoky bar.",
      "Muted trumpet, upright bass walking, brush drums, warm piano.",
      musicPrompt,
      "Relaxed but melancholic. No vocals. Film noir jazz. Loopable."
    ].join(" ");
    let res = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, music_length_ms: 18e4, force_instrumental: true })
    });
    if (!res.ok) {
      const errText = await res.text();
      try {
        const errData = JSON.parse(errText);
        if (errData?.detail?.data?.prompt_suggestion) {
          console.log("  Content filter, retrying...");
          res = await fetch("https://api.elevenlabs.io/v1/music", {
            method: "POST",
            headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: errData.detail.data.prompt_suggestion, music_length_ms: 18e4, force_instrumental: true })
          });
        }
      } catch (e) {
      }
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "Music generation failed" }), {
          status: 502,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    const audio = await res.arrayBuffer();
    console.log(`  Music done (${(audio.byteLength / 1024).toFixed(0)} KB)`);
    return new Response(audio, {
      headers: { "Content-Type": "audio/mpeg" }
    });
  } catch (err) {
    console.error("Music crash:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
export {
  handler as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvbXVzaWMuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIG5ldGxpZnkvZnVuY3Rpb25zL211c2ljLmpzXG4vLyBHZW5lcmF0ZXMgY3VzdG9tIG5vaXIgamF6eiBtdXNpYyB2aWEgRWxldmVuTGFic1xuLy8gUmV0dXJucyByYXcgbXAzIGJpbmFyeVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSkge1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnUE9TVCBvbmx5JywgeyBzdGF0dXM6IDQwNSB9KVxuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IG11c2ljUHJvbXB0IH0gPSBhd2FpdCByZXEuanNvbigpXG4gICAgY29uc3QgRUxFVkVOTEFCU19LRVkgPSBwcm9jZXNzLmVudi5FTEVWRU5MQUJTX0FQSV9LRVlcblxuICAgIGlmICghRUxFVkVOTEFCU19LRVkgfHwgIW11c2ljUHJvbXB0KSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCdNaXNzaW5nIGtleSBvciBwcm9tcHQnLCB7IHN0YXR1czogNDAwIH0pXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYE11c2ljIGdlbjogXCIke211c2ljUHJvbXB0LnN1YnN0cmluZygwLCA2MCl9Li4uXCJgKVxuXG4gICAgY29uc3QgcHJvbXB0ID0gW1xuICAgICAgJ0xhdGUgbmlnaHQgbm9pciBqYXp6LiBTbW9reSBiYXIuJyxcbiAgICAgICdNdXRlZCB0cnVtcGV0LCB1cHJpZ2h0IGJhc3Mgd2Fsa2luZywgYnJ1c2ggZHJ1bXMsIHdhcm0gcGlhbm8uJyxcbiAgICAgIG11c2ljUHJvbXB0LFxuICAgICAgJ1JlbGF4ZWQgYnV0IG1lbGFuY2hvbGljLiBObyB2b2NhbHMuIEZpbG0gbm9pciBqYXp6LiBMb29wYWJsZS4nLFxuICAgIF0uam9pbignICcpXG5cbiAgICBsZXQgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmVsZXZlbmxhYnMuaW8vdjEvbXVzaWMnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ3hpLWFwaS1rZXknOiBFTEVWRU5MQUJTX0tFWSwgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwcm9tcHQsIG11c2ljX2xlbmd0aF9tczogMTgwMDAwLCBmb3JjZV9pbnN0cnVtZW50YWw6IHRydWUgfSksXG4gICAgfSlcblxuICAgIC8vIENvbnRlbnQgZmlsdGVyIHJldHJ5XG4gICAgaWYgKCFyZXMub2spIHtcbiAgICAgIGNvbnN0IGVyclRleHQgPSBhd2FpdCByZXMudGV4dCgpXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBlcnJEYXRhID0gSlNPTi5wYXJzZShlcnJUZXh0KVxuICAgICAgICBpZiAoZXJyRGF0YT8uZGV0YWlsPy5kYXRhPy5wcm9tcHRfc3VnZ2VzdGlvbikge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCcgIENvbnRlbnQgZmlsdGVyLCByZXRyeWluZy4uLicpXG4gICAgICAgICAgcmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmVsZXZlbmxhYnMuaW8vdjEvbXVzaWMnLCB7XG4gICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgJ3hpLWFwaS1rZXknOiBFTEVWRU5MQUJTX0tFWSwgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBwcm9tcHQ6IGVyckRhdGEuZGV0YWlsLmRhdGEucHJvbXB0X3N1Z2dlc3Rpb24sIG11c2ljX2xlbmd0aF9tczogMTgwMDAwLCBmb3JjZV9pbnN0cnVtZW50YWw6IHRydWUgfSksXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkgeyAvKiBza2lwICovIH1cblxuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnTXVzaWMgZ2VuZXJhdGlvbiBmYWlsZWQnIH0pLCB7XG4gICAgICAgICAgc3RhdHVzOiA1MDIsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGF1ZGlvID0gYXdhaXQgcmVzLmFycmF5QnVmZmVyKClcbiAgICBjb25zb2xlLmxvZyhgICBNdXNpYyBkb25lICgkeyhhdWRpby5ieXRlTGVuZ3RoIC8gMTAyNCkudG9GaXhlZCgwKX0gS0IpYClcblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYXVkaW8sIHtcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhdWRpby9tcGVnJyB9LFxuICAgIH0pXG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignTXVzaWMgY3Jhc2g6JywgZXJyLm1lc3NhZ2UpXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSwge1xuICAgICAgc3RhdHVzOiA1MDAsIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgIH0pXG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7QUFJQSxlQUFPLFFBQStCLEtBQUs7QUFDekMsTUFBSSxJQUFJLFdBQVcsUUFBUTtBQUN6QixXQUFPLElBQUksU0FBUyxhQUFhLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUNsRDtBQUVBLE1BQUk7QUFDRixVQUFNLEVBQUUsWUFBWSxJQUFJLE1BQU0sSUFBSSxLQUFLO0FBQ3ZDLFVBQU0saUJBQWlCLFFBQVEsSUFBSTtBQUVuQyxRQUFJLENBQUMsa0JBQWtCLENBQUMsYUFBYTtBQUNuQyxhQUFPLElBQUksU0FBUyx5QkFBeUIsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLElBQzlEO0FBRUEsWUFBUSxJQUFJLGVBQWUsWUFBWSxVQUFVLEdBQUcsRUFBRSxDQUFDLE1BQU07QUFFN0QsVUFBTSxTQUFTO0FBQUEsTUFDYjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFBRSxLQUFLLEdBQUc7QUFFVixRQUFJLE1BQU0sTUFBTSxNQUFNLHNDQUFzQztBQUFBLE1BQzFELFFBQVE7QUFBQSxNQUNSLFNBQVMsRUFBRSxjQUFjLGdCQUFnQixnQkFBZ0IsbUJBQW1CO0FBQUEsTUFDNUUsTUFBTSxLQUFLLFVBQVUsRUFBRSxRQUFRLGlCQUFpQixNQUFRLG9CQUFvQixLQUFLLENBQUM7QUFBQSxJQUNwRixDQUFDO0FBR0QsUUFBSSxDQUFDLElBQUksSUFBSTtBQUNYLFlBQU0sVUFBVSxNQUFNLElBQUksS0FBSztBQUMvQixVQUFJO0FBQ0YsY0FBTSxVQUFVLEtBQUssTUFBTSxPQUFPO0FBQ2xDLFlBQUksU0FBUyxRQUFRLE1BQU0sbUJBQW1CO0FBQzVDLGtCQUFRLElBQUksK0JBQStCO0FBQzNDLGdCQUFNLE1BQU0sTUFBTSxzQ0FBc0M7QUFBQSxZQUN0RCxRQUFRO0FBQUEsWUFDUixTQUFTLEVBQUUsY0FBYyxnQkFBZ0IsZ0JBQWdCLG1CQUFtQjtBQUFBLFlBQzVFLE1BQU0sS0FBSyxVQUFVLEVBQUUsUUFBUSxRQUFRLE9BQU8sS0FBSyxtQkFBbUIsaUJBQWlCLE1BQVEsb0JBQW9CLEtBQUssQ0FBQztBQUFBLFVBQzNILENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRixTQUFTLEdBQUc7QUFBQSxNQUFhO0FBRXpCLFVBQUksQ0FBQyxJQUFJLElBQUk7QUFDWCxlQUFPLElBQUksU0FBUyxLQUFLLFVBQVUsRUFBRSxPQUFPLDBCQUEwQixDQUFDLEdBQUc7QUFBQSxVQUN4RSxRQUFRO0FBQUEsVUFBSyxTQUFTLEVBQUUsZ0JBQWdCLG1CQUFtQjtBQUFBLFFBQzdELENBQUM7QUFBQSxNQUNIO0FBQUEsSUFDRjtBQUVBLFVBQU0sUUFBUSxNQUFNLElBQUksWUFBWTtBQUNwQyxZQUFRLElBQUksa0JBQWtCLE1BQU0sYUFBYSxNQUFNLFFBQVEsQ0FBQyxDQUFDLE1BQU07QUFFdkUsV0FBTyxJQUFJLFNBQVMsT0FBTztBQUFBLE1BQ3pCLFNBQVMsRUFBRSxnQkFBZ0IsYUFBYTtBQUFBLElBQzFDLENBQUM7QUFBQSxFQUVILFNBQVMsS0FBSztBQUNaLFlBQVEsTUFBTSxnQkFBZ0IsSUFBSSxPQUFPO0FBQ3pDLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8sSUFBSSxRQUFRLENBQUMsR0FBRztBQUFBLE1BQzFELFFBQVE7QUFBQSxNQUFLLFNBQVMsRUFBRSxnQkFBZ0IsbUJBQW1CO0FBQUEsSUFDN0QsQ0FBQztBQUFBLEVBQ0g7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
