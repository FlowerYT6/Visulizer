const audio = document.getElementById('audio');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const bgPicker = document.getElementById('bgPicker');
const rainbowToggle = document.getElementById('rainbowToggle');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let source;
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

let currentColor = colorPicker.value;
let bgImage = null;

colorPicker.addEventListener('input', () => {
  currentColor = colorPicker.value;
});

bgPicker.addEventListener('change', function () {
  const file = this.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      bgImage = img;
    };
  };
  reader.readAsDataURL(file);
});

document.getElementById('audioFile').addEventListener('change', function () {
  const fileURL = URL.createObjectURL(this.files[0]);
  audio.src = fileURL;
  audio.load();
  audio.play();

  if (!source) {
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  render();
});

function render() {
  requestAnimationFrame(render);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) / 1.5;

  for (let i = 0; i < bufferLength; i++) {
    const angle = (i / bufferLength) * 2 * Math.PI;
    const barHeight = dataArray[i];
    const barLength = barHeight * 1.5;

    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barLength);
    const y2 = centerY + Math.sin(angle) * (radius + barLength);

    let color = currentColor;
    if (rainbowToggle.checked) {
      const hue = (i * 360 / bufferLength + Date.now() / 20) % 360;
      color = `hsl(${hue}, 100%, 50%)`;
    }

    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

let mediaRecorder;
let recordedChunks = [];

function startRecording() {
  const stream = canvas.captureStream(30);
  mediaRecorder = new MediaRecorder(stream);
  recordedChunks = [];

  mediaRecorder.ondataavailable = e => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visualizer.webm";
    a.click();
  };

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder?.stop();
}
