
import {createRequire as ___nfyCreateRequire} from "module";
import {fileURLToPath as ___nfyFileURLToPath} from "url";
import {dirname as ___nfyPathDirname} from "path";
let __filename=___nfyFileURLToPath(import.meta.url);
let __dirname=___nfyPathDirname(___nfyFileURLToPath(import.meta.url));
let require=___nfyCreateRequire(import.meta.url);


// netlify/functions/tts.js
async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }
  const { text } = await req.json();
  if (!text) {
    return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
  }
  const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.REDDX_VOICE_ID || process.env.GUBBINS_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.35, similarity_boost: 0.85, style: 0.6, use_speaker_boost: true }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: `TTS: ${res.status}`, detail: err }), { status: 502 });
  }
  const audio = await res.arrayBuffer();
  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
export {
  handler as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibmV0bGlmeS9mdW5jdGlvbnMvdHRzLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyBuZXRsaWZ5L2Z1bmN0aW9ucy90dHMuanNcbi8vIExpdmUgVFRTIFx1MjAxNCB0YWtlcyBuYXJyYXRpb24gdGV4dCwgcmV0dXJucyBtcDMgYXVkaW8gdmlhIEVsZXZlbkxhYnNcblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEpIHtcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ1BPU1Qgb25seScgfSksIHsgc3RhdHVzOiA0MDUgfSlcbiAgfVxuXG4gIGNvbnN0IHsgdGV4dCB9ID0gYXdhaXQgcmVxLmpzb24oKVxuICBpZiAoIXRleHQpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIHRleHQnIH0pLCB7IHN0YXR1czogNDAwIH0pXG4gIH1cblxuICBjb25zdCBFTEVWRU5MQUJTX0tFWSA9IHByb2Nlc3MuZW52LkVMRVZFTkxBQlNfQVBJX0tFWVxuICBjb25zdCB2b2ljZUlkID0gcHJvY2Vzcy5lbnYuUkVERFhfVk9JQ0VfSUQgfHwgcHJvY2Vzcy5lbnYuR1VCQklOU19WT0lDRV9JRCB8fCAncE5Jbno2b2JwZ0RRR2NGbWFKZ0InXG5cbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLmVsZXZlbmxhYnMuaW8vdjEvdGV4dC10by1zcGVlY2gvJHt2b2ljZUlkfWAsIHtcbiAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICBoZWFkZXJzOiB7ICd4aS1hcGkta2V5JzogRUxFVkVOTEFCU19LRVksICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICB0ZXh0LFxuICAgICAgbW9kZWxfaWQ6ICdlbGV2ZW5fbXVsdGlsaW5ndWFsX3YyJyxcbiAgICAgIHZvaWNlX3NldHRpbmdzOiB7IHN0YWJpbGl0eTogMC4zNSwgc2ltaWxhcml0eV9ib29zdDogMC44NSwgc3R5bGU6IDAuNiwgdXNlX3NwZWFrZXJfYm9vc3Q6IHRydWUgfVxuICAgIH0pXG4gIH0pXG5cbiAgaWYgKCFyZXMub2spIHtcbiAgICBjb25zdCBlcnIgPSBhd2FpdCByZXMudGV4dCgpXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBgVFRTOiAke3Jlcy5zdGF0dXN9YCwgZGV0YWlsOiBlcnIgfSksIHsgc3RhdHVzOiA1MDIgfSlcbiAgfVxuXG4gIGNvbnN0IGF1ZGlvID0gYXdhaXQgcmVzLmFycmF5QnVmZmVyKClcblxuICByZXR1cm4gbmV3IFJlc3BvbnNlKGF1ZGlvLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhdWRpby9tcGVnJyxcbiAgICAgICdDYWNoZS1Db250cm9sJzogJ3B1YmxpYywgbWF4LWFnZT0zNjAwJyxcbiAgICB9LFxuICB9KVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7OztBQUdBLGVBQU8sUUFBK0IsS0FBSztBQUN6QyxNQUFJLElBQUksV0FBVyxRQUFRO0FBQ3pCLFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8sWUFBWSxDQUFDLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQzdFO0FBRUEsUUFBTSxFQUFFLEtBQUssSUFBSSxNQUFNLElBQUksS0FBSztBQUNoQyxNQUFJLENBQUMsTUFBTTtBQUNULFdBQU8sSUFBSSxTQUFTLEtBQUssVUFBVSxFQUFFLE9BQU8sZUFBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ2hGO0FBRUEsUUFBTSxpQkFBaUIsUUFBUSxJQUFJO0FBQ25DLFFBQU0sVUFBVSxRQUFRLElBQUksa0JBQWtCLFFBQVEsSUFBSSxvQkFBb0I7QUFFOUUsUUFBTSxNQUFNLE1BQU0sTUFBTSwrQ0FBK0MsT0FBTyxJQUFJO0FBQUEsSUFDaEYsUUFBUTtBQUFBLElBQ1IsU0FBUyxFQUFFLGNBQWMsZ0JBQWdCLGdCQUFnQixtQkFBbUI7QUFBQSxJQUM1RSxNQUFNLEtBQUssVUFBVTtBQUFBLE1BQ25CO0FBQUEsTUFDQSxVQUFVO0FBQUEsTUFDVixnQkFBZ0IsRUFBRSxXQUFXLE1BQU0sa0JBQWtCLE1BQU0sT0FBTyxLQUFLLG1CQUFtQixLQUFLO0FBQUEsSUFDakcsQ0FBQztBQUFBLEVBQ0gsQ0FBQztBQUVELE1BQUksQ0FBQyxJQUFJLElBQUk7QUFDWCxVQUFNLE1BQU0sTUFBTSxJQUFJLEtBQUs7QUFDM0IsV0FBTyxJQUFJLFNBQVMsS0FBSyxVQUFVLEVBQUUsT0FBTyxRQUFRLElBQUksTUFBTSxJQUFJLFFBQVEsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLElBQUksQ0FBQztBQUFBLEVBQ25HO0FBRUEsUUFBTSxRQUFRLE1BQU0sSUFBSSxZQUFZO0FBRXBDLFNBQU8sSUFBSSxTQUFTLE9BQU87QUFBQSxJQUN6QixTQUFTO0FBQUEsTUFDUCxnQkFBZ0I7QUFBQSxNQUNoQixpQkFBaUI7QUFBQSxJQUNuQjtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogW10KfQo=
