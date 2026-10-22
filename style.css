const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const photoInput = document.getElementById("photoInput");
const zoomSlider = document.getElementById("zoom");
const resetButton = document.getElementById("resetButton");
const downloadButton = document.getElementById("downloadButton");

const overlay = new Image();
overlay.src = "square-format-twibbon.png";

let photo = null;

let zoom = 1;
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let lastX = 0;
let lastY = 0;


// DRAW CANVAS

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw uploaded photograph

    if (photo) {

        const baseScale = Math.max(
            canvas.width / photo.width,
            canvas.height / photo.height
        );

        const scale = baseScale * zoom;

        const width = photo.width * scale;
        const height = photo.height * scale;

        const x = (canvas.width - width) / 2 + offsetX;
        const y = (canvas.height - height) / 2 + offsetY;

        ctx.drawImage(
            photo,
            x,
            y,
            width,
            height
        );
    }

    // Draw CMD26 artwork on top

    if (overlay.complete) {
        ctx.drawImage(
            overlay,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }
}


// LOAD OVERLAY

overlay.onload = draw;


// UPLOAD PHOTO

photoInput.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        const img = new Image();

        img.onload = function() {

            photo = img;

            zoom = 1;
            offsetX = 0;
            offsetY = 0;

            zoomSlider.value = 1;

            downloadButton.disabled = false;

            draw();
        };

        img.src = e.target.result;
    };

    reader.readAsDataURL(file);
});


// ZOOM

zoomSlider.addEventListener("input", function() {

    zoom = parseFloat(this.value);

    draw();
});


// RESET

resetButton.addEventListener("click", function() {

    zoom = 1;
    offsetX = 0;
    offsetY = 0;

    zoomSlider.value = 1;

    draw();
});


// START DRAGGING

canvas.addEventListener("pointerdown", function(event) {

    if (!photo) return;

    dragging = true;

    lastX = event.clientX;
    lastY = event.clientY;

    canvas.setPointerCapture(event.pointerId);
});


// DRAG PHOTO

canvas.addEventListener("pointermove", function(event) {

    if (!dragging || !photo) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const dx = (event.clientX - lastX) * scaleX;
    const dy = (event.clientY - lastY) * scaleY;

    offsetX += dx;
    offsetY += dy;

    lastX = event.clientX;
    lastY = event.clientY;

    draw();
});


// STOP DRAGGING

canvas.addEventListener("pointerup", function() {
    dragging = false;
});

canvas.addEventListener("pointercancel", function() {
    dragging = false;
});


// DOWNLOAD

downloadButton.addEventListener("click", function() {

    draw();

    const link = document.createElement("a");

    link.download = "CMD26-profile-picture.png";
    link.href = canvas.toDataURL("image/png");

    link.click();
});


// INITIAL DRAW

draw();
