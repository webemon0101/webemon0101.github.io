"use strict";

const get = (id) => document.getElementById(id);
const preview = get("preview");
const fileInput = get("file");
const range = get("range");
const picker = get("picker");
const status = get("status");
const download = get("download");
const progress = get("progress");
const exportButton = get("export");
const speed = 1.5;
const minimumCut = 0.15;
const tailLength = 3.05;
let inputUrl;
let outputUrl;
let filename;
let cut;
let busy = false;

function timestamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const minutes = Math.floor(ms / 60000);
  const remainder = (ms % 60000 / 1000).toFixed(3).padStart(6, "0");
  return minutes + ":" + remainder;
}

function clearDownload() {
  if (outputUrl) URL.revokeObjectURL(outputUrl);
  outputUrl = undefined;
  download.removeAttribute("href");
  download.hidden = true;
}

function updateControls() {
  get("trim").disabled = busy || preview.hidden;
  fileInput.disabled = busy;
  exportButton.disabled = busy || !Number.isFinite(cut) || cut < minimumCut;
  get("position").value = timestamp(cut ?? Number(range.value));
  get("duration").textContent = cut === undefined ? "—" : timestamp(cut / speed);
}

function load(file) {
  if (!file || busy) return;
  if (inputUrl) URL.revokeObjectURL(inputUrl);
  clearDownload();
  cut = undefined;
  filename = file.name;
  get("filename").textContent = filename;
  get("filename").hidden = false;
  range.value = "0";
  preview.hidden = true;
  get("placeholder").hidden = false;
  status.textContent = "動画を読み込んでいます…";
  inputUrl = URL.createObjectURL(file);
  preview.src = inputUrl;
  updateControls();
}

preview.addEventListener("loadedmetadata", () => {
  if (!preview.videoWidth || !Number.isFinite(preview.duration) || preview.duration < minimumCut) {
    status.textContent = "長さが確定している動画を選んでください。";
    return;
  }
  range.max = String(preview.duration);
  range.value = String(preview.duration);
  get("placeholder").hidden = true;
  preview.hidden = false;
  status.textContent = "";
  updateControls();
});

preview.addEventListener("error", () => {
  cut = undefined;
  preview.hidden = true;
  get("placeholder").hidden = false;
  status.textContent = "動画を読み込めませんでした。このブラウザーで再生できる動画を選んでください。";
  updateControls();
});

fileInput.addEventListener("change", () => {
  load(fileInput.files[0]);
  fileInput.value = "";
});

for (const event of ["dragenter", "dragover"]) {
  picker.addEventListener(event, (e) => {
    e.preventDefault();
    if (!busy) picker.classList.add("dragging");
  });
}
picker.addEventListener("dragleave", () => picker.classList.remove("dragging"));
picker.addEventListener("drop", (e) => {
  e.preventDefault();
  picker.classList.remove("dragging");
  load(e.dataTransfer.files[0]);
});

function setCut(seconds) {
  cut = seconds;
  range.value = String(seconds);
  clearDownload();
  status.textContent = cut < minimumCut ? "開始から0.15秒以上の位置を指定してください。" : "";
  updateControls();
}

range.addEventListener("input", () => {
  preview.pause();
  const seconds = Number(range.value);
  preview.currentTime = seconds;
  setCut(seconds);
});
get("set").addEventListener("click", () => {
  preview.pause();
  setCut(preview.currentTime);
});

get("tail").addEventListener("click", () => {
  if (!Number.isFinite(preview.duration)) return;
  preview.pause();
  const seconds = Math.max(0, preview.duration - tailLength);
  preview.currentTime = seconds;
  setCut(seconds);
});

function ready(video, url) {
  return new Promise((resolve, reject) => {
    video.addEventListener("loadeddata", resolve, { once: true });
    video.addEventListener("error", reject, { once: true });
    video.src = url;
  });
}

async function convert(url, end, onProgress) {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!window.MediaRecorder || !canvas.captureStream || !Audio) {
    throw new Error("このブラウザーでは書き出せません。Edge または Chrome で開いてください。");
  }

  const audio = new Audio();
  video.className = "export-source";
  video.playsInline = true;
  video.setAttribute("aria-hidden", "true");
  document.body.append(video);
  let recorder;
  let canvasStream;
  let destination;
  let timer;
  let frame;
  try {
    await Promise.all([audio.resume(), ready(video, url)]);
    video.playbackRate = speed;
    video.preservesPitch = true;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { alpha: false });
    context.drawImage(video, 0, 0);
    canvasStream = canvas.captureStream(60);
    destination = audio.createMediaStreamDestination();
    audio.createMediaElementSource(video).connect(destination);
    const stream = new MediaStream([...canvasStream.getTracks(), ...destination.stream.getTracks()]);
    const mimeType = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      .find((type) => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks = [];

    return await new Promise((resolve, reject) => {
      const stop = () => {
        video.pause();
        if (recorder.state !== "inactive") recorder.stop();
      };

      function draw(mediaTime) {
        if (mediaTime >= end || video.ended) {
          stop();
          return;
        }
        context.drawImage(video, 0, 0);
        onProgress(Math.min(video.currentTime / end, 1));
        frame = video.requestVideoFrameCallback
          ? video.requestVideoFrameCallback((_, metadata) => draw(metadata.mediaTime))
          : requestAnimationFrame(() => draw(video.currentTime));
      }

      recorder.addEventListener("dataavailable", ({ data }) => {
        if (data.size) chunks.push(data);
      });
      recorder.addEventListener("error", () => reject(new Error("動画の書き出し中にエラーが発生しました。")));
      recorder.addEventListener("stop", () => {
        if (!chunks.length) {
          reject(new Error("書き出した動画にデータがありません。カット位置を確認してください。"));
          return;
        }
        resolve(new Blob(chunks, { type: chunks[0].type || recorder.mimeType }));
      });
      video.addEventListener("ended", stop, { once: true });
      video.addEventListener("error", () => reject(new Error("元の動画を再生できませんでした。")), { once: true });
      video.addEventListener("playing", () => {
        try {
          recorder.start();
          draw(0);
          timer = setInterval(() => {
            if (video.currentTime >= end || video.ended) stop();
          }, 10);
        } catch (error) {
          reject(error);
        }
      }, { once: true });
      video.play().catch(reject);
    });
  } finally {
    clearInterval(timer);
    if (frame !== undefined) {
      if (video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frame);
      else cancelAnimationFrame(frame);
    }
    video.pause();
    if (recorder && recorder.state !== "inactive") recorder.stop();
    canvasStream?.getTracks().forEach((track) => track.stop());
    destination?.stream.getTracks().forEach((track) => track.stop());
    video.removeAttribute("src");
    video.load();
    video.remove();
    await audio.close();
  }
}

exportButton.addEventListener("click", async () => {
  if (busy || cut === undefined || cut < minimumCut) return;
  busy = true;
  updateControls();
  preview.pause();
  clearDownload();
  progress.value = 0;
  progress.hidden = false;
  status.textContent = "書き出し中です。このタブを表示したままお待ちください。";

  try {
    const blob = await convert(inputUrl, cut, (value) => { progress.value = value; });
    const extension = blob.type.startsWith("video/mp4") ? "mp4" : "webm";
    outputUrl = URL.createObjectURL(blob);
    download.href = outputUrl;
    download.download = filename.replace(/\.[^.]+$/, "") + "_cut_1.5x." + extension;
    download.hidden = false;
    status.textContent = extension.toUpperCase() + "で書き出しました。";
  } catch (error) {
    status.textContent = error?.message || "動画を書き出せませんでした。";
  } finally {
    progress.hidden = true;
    busy = false;
    updateControls();
  }
});
