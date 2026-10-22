const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const photoUpload = document.getElementById("photoUpload");
const zoomSlider = document.getElementById("zoom");
const downloadButton = document.getElementById("downloadButton");

let photo = null;
let zoom = 1;


/* Draw everything on the canvas */

function drawCanvas() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background

    ctx.fillStyle = "#e9eeee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Uploaded photo

    if (photo) {

        const scale =
            Math.max(
                canvas.width / photo.width,
                canvas.height / photo.height
            ) * zoom;

        const width = photo.width * scale;
        const height = photo.height * scale;

        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;

        ctx.drawImage(
            photo,
            x,
            y,
            width,
            height
        );

    }


    // Temporary CMD26 frame

    ctx.fillStyle = "rgba(0, 140, 119, 0.92)";
    ctx.fillRect(0, 0, canvas.width, 120);

    ctx.fillRect(
        0,
        canvas.height - 120,
        canvas.width,
        120
    );

    ctx.fillStyle = "white";

    ctx.font = "bold 40px Arial";
    ctx.fillText(
        "CATALISTI & MOONSHOT DAY 2026",
        45,
        75
    );

    ctx.font = "28px Arial";
    ctx.fillText(
        "THE NEXT DECADE",
        45,
        canvas.height - 48
    );

}


/* Upload photo */

photoUpload.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {

        const image = new Image();

        image.onload = function() {

            photo = image;

            zoom = 1;
            zoomSlider.value = 1;

            downloadButton.disabled = false;

            drawCanvas();

        };

        image.src = event.target.result;

    };

    reader.readAsDataURL(file);

});


/* Zoom */

zoomSlider.addEventListener("input", function() {

    zoom = Number(this.value);

    drawCanvas();

});


/* Download */

downloadButton.addEventListener("click", function() {

    drawCanvas();

    const link = document.createElement("a");

    link.download = "CMD26-profile-picture.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

});


/* Initial canvas */

drawCanvas();
