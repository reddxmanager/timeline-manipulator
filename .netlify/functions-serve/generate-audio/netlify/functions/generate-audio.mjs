
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/generate-audio.js
var generate_audio_default = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  try {
    const { type, params } = await req.json();
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not set");
    let audioBuffer;
    switch (type) {
      case "music":
        audioBuffer = await generateMusic(apiKey, params);
        break;
      case "sfx":
        audioBuffer = await generateSFX(apiKey, params);
        break;
      case "narration":
        audioBuffer = await generateNarration(apiKey, params);
        break;
      default:
        return Response.json({ error: "Invalid type. Use: music, sfx, narration" }, { status: 400 });
    }
    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch (err) {
    console.error("Audio generation error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
};
async function generateMusic(apiKey, params) {
  const { prompt, music_length_ms = 3e4 } = params;
  const response = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      music_length_ms,
      force_instrumental: true
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs Music: ${response.status} - ${err}`);
  }
  return await response.arrayBuffer();
}
async function generateSFX(apiKey, params) {
  const { text, duration_seconds } = params;
  const body = { text };
  if (duration_seconds) body.duration_seconds = duration_seconds;
  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs SFX: ${response.status} - ${err}`);
  }
  return await response.arrayBuffer();
}
async function generateNarration(apiKey, params) {
  const {
    text,
    voice_id = process.env.REDDX_VOICE_ID || process.env.GUBBINS_VOICE_ID || "pNInz6obpgDQGcFmaJgB",
    model_id = "eleven_multilingual_v2"
  } = params;
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      model_id,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true
      }
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs TTS: ${response.status} - ${err}`);
  }
  return await response.arrayBuffer();
}
var config = {
  path: "/api/generate-audio"
};
export {
  config,
  generate_audio_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvZ2VuZXJhdGUtYXVkaW8uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIG5ldGxpZnkvZnVuY3Rpb25zL2dlbmVyYXRlLWF1ZGlvLmpzXG4vLyBHZW5lcmF0ZXMgbXVzaWMsIFNGWCwgb3IgbmFycmF0aW9uIHZpYSBFbGV2ZW5MYWJzIEFQSXNcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgKHJlcSkgPT4ge1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSgnTWV0aG9kIG5vdCBhbGxvd2VkJywgeyBzdGF0dXM6IDQwNSB9KVxuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IHR5cGUsIHBhcmFtcyB9ID0gYXdhaXQgcmVxLmpzb24oKVxuICAgIGNvbnN0IGFwaUtleSA9IHByb2Nlc3MuZW52LkVMRVZFTkxBQlNfQVBJX0tFWVxuICAgIGlmICghYXBpS2V5KSB0aHJvdyBuZXcgRXJyb3IoJ0VMRVZFTkxBQlNfQVBJX0tFWSBub3Qgc2V0JylcblxuICAgIGxldCBhdWRpb0J1ZmZlclxuXG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdtdXNpYyc6XG4gICAgICAgIGF1ZGlvQnVmZmVyID0gYXdhaXQgZ2VuZXJhdGVNdXNpYyhhcGlLZXksIHBhcmFtcylcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3NmeCc6XG4gICAgICAgIGF1ZGlvQnVmZmVyID0gYXdhaXQgZ2VuZXJhdGVTRlgoYXBpS2V5LCBwYXJhbXMpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICduYXJyYXRpb24nOlxuICAgICAgICBhdWRpb0J1ZmZlciA9IGF3YWl0IGdlbmVyYXRlTmFycmF0aW9uKGFwaUtleSwgcGFyYW1zKVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ0ludmFsaWQgdHlwZS4gVXNlOiBtdXNpYywgc2Z4LCBuYXJyYXRpb24nIH0sIHsgc3RhdHVzOiA0MDAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGF1ZGlvQnVmZmVyLCB7XG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXVkaW8vbXBlZycsXG4gICAgICAgICdDYWNoZS1Db250cm9sJzogJ3B1YmxpYywgbWF4LWFnZT04NjQwMCcsXG4gICAgICB9XG4gICAgfSlcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignQXVkaW8gZ2VuZXJhdGlvbiBlcnJvcjonLCBlcnIpXG4gICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlTXVzaWMoYXBpS2V5LCBwYXJhbXMpIHtcbiAgY29uc3QgeyBwcm9tcHQsIG11c2ljX2xlbmd0aF9tcyA9IDMwMDAwIH0gPSBwYXJhbXNcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaS5lbGV2ZW5sYWJzLmlvL3YxL211c2ljJywge1xuICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICd4aS1hcGkta2V5JzogYXBpS2V5LFxuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHByb21wdCxcbiAgICAgIG11c2ljX2xlbmd0aF9tcyxcbiAgICAgIGZvcmNlX2luc3RydW1lbnRhbDogdHJ1ZSxcbiAgICB9KVxuICB9KVxuXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZXZlbkxhYnMgTXVzaWM6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7ZXJyfWApXG4gIH1cblxuICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZVNGWChhcGlLZXksIHBhcmFtcykge1xuICBjb25zdCB7IHRleHQsIGR1cmF0aW9uX3NlY29uZHMgfSA9IHBhcmFtc1xuXG4gIGNvbnN0IGJvZHkgPSB7IHRleHQgfVxuICBpZiAoZHVyYXRpb25fc2Vjb25kcykgYm9keS5kdXJhdGlvbl9zZWNvbmRzID0gZHVyYXRpb25fc2Vjb25kc1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmVsZXZlbmxhYnMuaW8vdjEvc291bmQtZ2VuZXJhdGlvbicsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAneGktYXBpLWtleSc6IGFwaUtleSxcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KVxuICB9KVxuXG4gIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXNwb25zZS50ZXh0KClcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEVsZXZlbkxhYnMgU0ZYOiAke3Jlc3BvbnNlLnN0YXR1c30gLSAke2Vycn1gKVxuICB9XG5cbiAgcmV0dXJuIGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKClcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVOYXJyYXRpb24oYXBpS2V5LCBwYXJhbXMpIHtcbiAgY29uc3Qge1xuICAgIHRleHQsXG4gICAgdm9pY2VfaWQgPSBwcm9jZXNzLmVudi5SRUREWF9WT0lDRV9JRCB8fCBwcm9jZXNzLmVudi5HVUJCSU5TX1ZPSUNFX0lEIHx8ICdwTkluejZvYnBnRFFHY0ZtYUpnQicsXG4gICAgbW9kZWxfaWQgPSAnZWxldmVuX211bHRpbGluZ3VhbF92MidcbiAgfSA9IHBhcmFtc1xuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLmVsZXZlbmxhYnMuaW8vdjEvdGV4dC10by1zcGVlY2gvJHt2b2ljZV9pZH1gLCB7XG4gICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgaGVhZGVyczoge1xuICAgICAgJ3hpLWFwaS1rZXknOiBhcGlLZXksXG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgdGV4dCxcbiAgICAgIG1vZGVsX2lkLFxuICAgICAgdm9pY2Vfc2V0dGluZ3M6IHtcbiAgICAgICAgc3RhYmlsaXR5OiAwLjQsXG4gICAgICAgIHNpbWlsYXJpdHlfYm9vc3Q6IDAuOCxcbiAgICAgICAgc3R5bGU6IDAuNSxcbiAgICAgICAgdXNlX3NwZWFrZXJfYm9vc3Q6IHRydWUsXG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgY29uc3QgZXJyID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpXG4gICAgdGhyb3cgbmV3IEVycm9yKGBFbGV2ZW5MYWJzIFRUUzogJHtyZXNwb25zZS5zdGF0dXN9IC0gJHtlcnJ9YClcbiAgfVxuXG4gIHJldHVybiBhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpXG59XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIHBhdGg6ICcvYXBpL2dlbmVyYXRlLWF1ZGlvJ1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUdBLElBQU8seUJBQVEsT0FBTyxRQUFRO0FBQzVCLE1BQUksSUFBSSxXQUFXLFFBQVE7QUFDekIsV0FBTyxJQUFJLFNBQVMsc0JBQXNCLEVBQUUsUUFBUSxJQUFJLENBQUM7QUFBQSxFQUMzRDtBQUVBLE1BQUk7QUFDRixVQUFNLEVBQUUsTUFBTSxPQUFPLElBQUksTUFBTSxJQUFJLEtBQUs7QUFDeEMsVUFBTSxTQUFTLFFBQVEsSUFBSTtBQUMzQixRQUFJLENBQUMsT0FBUSxPQUFNLElBQUksTUFBTSw0QkFBNEI7QUFFekQsUUFBSTtBQUVKLFlBQVEsTUFBTTtBQUFBLE1BQ1osS0FBSztBQUNILHNCQUFjLE1BQU0sY0FBYyxRQUFRLE1BQU07QUFDaEQ7QUFBQSxNQUNGLEtBQUs7QUFDSCxzQkFBYyxNQUFNLFlBQVksUUFBUSxNQUFNO0FBQzlDO0FBQUEsTUFDRixLQUFLO0FBQ0gsc0JBQWMsTUFBTSxrQkFBa0IsUUFBUSxNQUFNO0FBQ3BEO0FBQUEsTUFDRjtBQUNFLGVBQU8sU0FBUyxLQUFLLEVBQUUsT0FBTywyQ0FBMkMsR0FBRyxFQUFFLFFBQVEsSUFBSSxDQUFDO0FBQUEsSUFDL0Y7QUFFQSxXQUFPLElBQUksU0FBUyxhQUFhO0FBQUEsTUFDL0IsU0FBUztBQUFBLFFBQ1AsZ0JBQWdCO0FBQUEsUUFDaEIsaUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNILFNBQVMsS0FBSztBQUNaLFlBQVEsTUFBTSwyQkFBMkIsR0FBRztBQUM1QyxXQUFPLFNBQVMsS0FBSyxFQUFFLE9BQU8sSUFBSSxRQUFRLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQzlEO0FBQ0Y7QUFFQSxlQUFlLGNBQWMsUUFBUSxRQUFRO0FBQzNDLFFBQU0sRUFBRSxRQUFRLGtCQUFrQixJQUFNLElBQUk7QUFFNUMsUUFBTSxXQUFXLE1BQU0sTUFBTSxzQ0FBc0M7QUFBQSxJQUNqRSxRQUFRO0FBQUEsSUFDUixTQUFTO0FBQUEsTUFDUCxjQUFjO0FBQUEsTUFDZCxnQkFBZ0I7QUFBQSxJQUNsQjtBQUFBLElBQ0EsTUFBTSxLQUFLLFVBQVU7QUFBQSxNQUNuQjtBQUFBLE1BQ0E7QUFBQSxNQUNBLG9CQUFvQjtBQUFBLElBQ3RCLENBQUM7QUFBQSxFQUNILENBQUM7QUFFRCxNQUFJLENBQUMsU0FBUyxJQUFJO0FBQ2hCLFVBQU0sTUFBTSxNQUFNLFNBQVMsS0FBSztBQUNoQyxVQUFNLElBQUksTUFBTSxxQkFBcUIsU0FBUyxNQUFNLE1BQU0sR0FBRyxFQUFFO0FBQUEsRUFDakU7QUFFQSxTQUFPLE1BQU0sU0FBUyxZQUFZO0FBQ3BDO0FBRUEsZUFBZSxZQUFZLFFBQVEsUUFBUTtBQUN6QyxRQUFNLEVBQUUsTUFBTSxpQkFBaUIsSUFBSTtBQUVuQyxRQUFNLE9BQU8sRUFBRSxLQUFLO0FBQ3BCLE1BQUksaUJBQWtCLE1BQUssbUJBQW1CO0FBRTlDLFFBQU0sV0FBVyxNQUFNLE1BQU0saURBQWlEO0FBQUEsSUFDNUUsUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLE1BQ1AsY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsSUFDbEI7QUFBQSxJQUNBLE1BQU0sS0FBSyxVQUFVLElBQUk7QUFBQSxFQUMzQixDQUFDO0FBRUQsTUFBSSxDQUFDLFNBQVMsSUFBSTtBQUNoQixVQUFNLE1BQU0sTUFBTSxTQUFTLEtBQUs7QUFDaEMsVUFBTSxJQUFJLE1BQU0sbUJBQW1CLFNBQVMsTUFBTSxNQUFNLEdBQUcsRUFBRTtBQUFBLEVBQy9EO0FBRUEsU0FBTyxNQUFNLFNBQVMsWUFBWTtBQUNwQztBQUVBLGVBQWUsa0JBQWtCLFFBQVEsUUFBUTtBQUMvQyxRQUFNO0FBQUEsSUFDSjtBQUFBLElBQ0EsV0FBVyxRQUFRLElBQUksa0JBQWtCLFFBQVEsSUFBSSxvQkFBb0I7QUFBQSxJQUN6RSxXQUFXO0FBQUEsRUFDYixJQUFJO0FBRUosUUFBTSxXQUFXLE1BQU0sTUFBTSwrQ0FBK0MsUUFBUSxJQUFJO0FBQUEsSUFDdEYsUUFBUTtBQUFBLElBQ1IsU0FBUztBQUFBLE1BQ1AsY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsSUFDbEI7QUFBQSxJQUNBLE1BQU0sS0FBSyxVQUFVO0FBQUEsTUFDbkI7QUFBQSxNQUNBO0FBQUEsTUFDQSxnQkFBZ0I7QUFBQSxRQUNkLFdBQVc7QUFBQSxRQUNYLGtCQUFrQjtBQUFBLFFBQ2xCLE9BQU87QUFBQSxRQUNQLG1CQUFtQjtBQUFBLE1BQ3JCO0FBQUEsSUFDRixDQUFDO0FBQUEsRUFDSCxDQUFDO0FBRUQsTUFBSSxDQUFDLFNBQVMsSUFBSTtBQUNoQixVQUFNLE1BQU0sTUFBTSxTQUFTLEtBQUs7QUFDaEMsVUFBTSxJQUFJLE1BQU0sbUJBQW1CLFNBQVMsTUFBTSxNQUFNLEdBQUcsRUFBRTtBQUFBLEVBQy9EO0FBRUEsU0FBTyxNQUFNLFNBQVMsWUFBWTtBQUNwQztBQUVPLElBQU0sU0FBUztBQUFBLEVBQ3BCLE1BQU07QUFDUjsiLAogICJuYW1lcyI6IFtdCn0K
