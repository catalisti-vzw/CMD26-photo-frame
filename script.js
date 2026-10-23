const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const photoInput = document.getElementById("photoInput");
const resetButton = document.getElementById("resetButton");
const downloadButton = document.getElementById("downloadButton");

const copyButton = document.getElementById("copyButton");
const shareText = document.getElementById("shareText");

const overlay = new Image();

let photo = null;
let bluePhoto = null;

// Position and size of the uploaded photograph
let photoX = 0;
let photoY = 0;
let photoWidth = 0;
let photoHeight = 0;

// Original image aspect ratio
let photoAspectRatio = 1;

// Interaction state
let action = null;
let activeHandle = null;

let startPointerX = 0;
let startPointerY = 0;

let startPhotoX = 0;
let startPhotoY = 0;
let startPhotoWidth = 0;
let startPhotoHeight = 0;

// Handle appearance
const handleRadius = 17;
const minimumPhotoWidth = 120;

// The overlay opacity shown while editing
const editingOverlayOpacity = 0.80;


// LOAD THE CMD26 OVERLAY

overlay.onload = function () {
    drawEditor();
};

overlay.onerror = function () {
    console.error("The CMD26 overlay could not be loaded.");
};

overlay.src = "./square-format-twibbon.png";


// INITIAL PHOTO SIZE

function resetPhoto() {
    if (!photo) return;

    /*
    Fit the complete photograph inside the canvas initially.
    This ensures that all four corner handles remain visible.
    */

    const fitScale = Math.min(
        canvas.width / photo.width,
        canvas.height / photo.height
    );

    photoWidth = photo.width * fitScale;
    photoHeight = photo.height * fitScale;

    photoX = (canvas.width - photoWidth) / 2;
    photoY = (canvas.height - photoHeight) / 2;

    drawEditor();
}


// DRAW THE EDITING VIEW

function drawEditor() {
    drawComposition(true);
}

// CREATE A BLUE-TINTED VERSION OF THE UPLOADED PHOTO
function createBluePhoto(image) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = image.naturalWidth || image.width;
    tempCanvas.height = image.naturalHeight || image.height;

    // Draw original image onto temporary canvas
    tempCtx.drawImage(
        image,
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    // Get the pixels
    const imageData = tempCtx.getImageData(
        0,
        0,
        tempCanvas.width,
        tempCanvas.height
    );

    const data = imageData.data;

    // Dark and light colours of the blue duotone
    const dark = {
        r: 5,
        g: 38,
        b: 115
    };

    const light = {
        r: 232,
        g: 241,
        b: 250
    };

    for (let i = 0; i < data.length; i += 4) {

        // Convert original pixel to luminance
        const brightness =
            (data[i] * 0.299 +
             data[i + 1] * 0.587 +
             data[i + 2] * 0.114) / 255;

        // Increase contrast slightly
        let adjusted =
            (brightness - 0.5) * 1.20 + 0.68;

        adjusted = Math.max(0, Math.min(1, adjusted));
        

        // Map dark pixels to navy and light pixels to cyan
        adjusted = Math.pow(adjusted, 0.88);
        data[i] =
            dark.r + (light.r - dark.r) * adjusted;

        data[i + 1] =
            dark.g + (light.g - dark.g) * adjusted;

        data[i + 2] =
            dark.b + (light.b - dark.b) * adjusted;

        // Leave alpha unchanged
    }

    tempCtx.putImageData(imageData, 0, 0);

    return tempCanvas;
}

// DRAW THE COMPLETE COMPOSITION

function drawComposition(editing) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Neutral background
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

// Uploaded photograph
if (bluePhoto) {
    ctx.drawImage(
        bluePhoto,
        photoX,
        photoY,
        photoWidth,
        photoHeight
    );
}
    // CMD26 overlay
    if (overlay.complete && overlay.naturalWidth > 0) {
        ctx.save();

        /*
        The frame is partly transparent during editing,
        but fully opaque in the downloaded image.
        */
        ctx.globalAlpha = editing ? editingOverlayOpacity : 1;

        ctx.drawImage(
            overlay,
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.restore();
    }

    // Selection rectangle and handles are only visible while editing
    if (editing && photo) {
        drawSelectionControls();
    }
}


// DRAW SELECTION RECTANGLE AND CORNER HANDLES

function drawSelectionControls() {
    ctx.save();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);

    ctx.strokeRect(
        photoX,
        photoY,
        photoWidth,
        photoHeight
    );

    ctx.setLineDash([]);

    const handles = getHandles();

    Object.values(handles).forEach(function (handle) {
        ctx.beginPath();

        ctx.arc(
            handle.x,
            handle.y,
            handleRadius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.lineWidth = 6;
        ctx.strokeStyle = "#13182D";
        ctx.stroke();
    });

    ctx.restore();
}


// GET THE FOUR CORNER POSITIONS

function getHandles() {
    return {
        topLeft: {
            x: photoX,
            y: photoY
        },

        topRight: {
            x: photoX + photoWidth,
            y: photoY
        },

        bottomLeft: {
            x: photoX,
            y: photoY + photoHeight
        },

        bottomRight: {
            x: photoX + photoWidth,
            y: photoY + photoHeight
        }
    };
}


// CONVERT SCREEN POSITION TO CANVAS POSITION

function getCanvasPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
}


// CHECK WHETHER A HANDLE WAS SELECTED

function getHandleAtPosition(x, y) {
    const handles = getHandles();

    for (const [name, handle] of Object.entries(handles)) {
        const distance = Math.hypot(
            x - handle.x,
            y - handle.y
        );

        if (distance <= handleRadius * 2.2) {
            return name;
        }
    }

    return null;
}

// UPDATE MOUSE CURSOR TO RESIZE ICON
function updateCursor(event) {
    if (!photo || action) return;

    const position = getCanvasPosition(event);
    const handle = getHandleAtPosition(position.x, position.y);

    if (handle === "topLeft" || handle === "bottomRight") {
        canvas.style.cursor = "nwse-resize";
    } 
    else if (handle === "topRight" || handle === "bottomLeft") {
        canvas.style.cursor = "nesw-resize";
    } 
    else if (isInsidePhoto(position.x, position.y)) {
        canvas.style.cursor = "move";
    } 
    else {
        canvas.style.cursor = "default";
    }
}


// CHECK WHETHER THE PHOTO WAS SELECTED

function isInsidePhoto(x, y) {
    return (
        x >= photoX &&
        x <= photoX + photoWidth &&
        y >= photoY &&
        y <= photoY + photoHeight
    );
}


// UPLOAD PHOTO

photoInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (readerEvent) {
        const image = new Image();

        image.onload = function () {
        photo = image;
    
        photoAspectRatio = photo.width / photo.height;
    
        // Create the duotone version ONCE
        bluePhoto = createBluePhoto(photo);
    
        resetPhoto();
    
        downloadButton.disabled = false;
    };

        image.src = readerEvent.target.result;
    };

    reader.readAsDataURL(file);
});


// START MOVING OR RESIZING

canvas.addEventListener("pointerdown", function (event) {
    if (!photo) return;

    event.preventDefault();

    const position = getCanvasPosition(event);

    activeHandle = getHandleAtPosition(
        position.x,
        position.y
    );

    if (activeHandle) {
    action = "resize";

    if (activeHandle === "topLeft" || activeHandle === "bottomRight") {
        canvas.style.cursor = "nwse-resize";
    } else {
        canvas.style.cursor = "nesw-resize";
    }

} else if (isInsidePhoto(position.x, position.y)) {

    action = "move";
    canvas.style.cursor = "grabbing";

} else {
    return;
}

    startPointerX = position.x;
    startPointerY = position.y;

    startPhotoX = photoX;
    startPhotoY = photoY;
    startPhotoWidth = photoWidth;
    startPhotoHeight = photoHeight;

    canvas.setPointerCapture(event.pointerId);
});

// MOVE, RESIZE AND CURSOR

canvas.addEventListener("pointermove", function (event) {
    if (!photo) {
        canvas.style.cursor = "default";
        return;
    }

    const position = getCanvasPosition(event);

    // Nothing is currently being dragged
    if (!action) {
        const hoveredHandle = getHandleAtPosition(
            position.x,
            position.y
        );

        // Top-left and bottom-right corners
        if (
            hoveredHandle === "topLeft" ||
            hoveredHandle === "bottomRight"
        ) {
            canvas.style.cursor = "nwse-resize";
        }

        // Top-right and bottom-left corners
        else if (
            hoveredHandle === "topRight" ||
            hoveredHandle === "bottomLeft"
        ) {
            canvas.style.cursor = "nesw-resize";
        }

        // Pointer is somewhere inside the photograph
        else if (isInsidePhoto(position.x, position.y)) {
            canvas.style.cursor = "move";
        }

        // Pointer is outside the photograph
        else {
            canvas.style.cursor = "default";
        }

        return;
    }

    event.preventDefault();

    // User is moving the photograph
    if (action === "move") {
        const differenceX = position.x - startPointerX;
        const differenceY = position.y - startPointerY;

        photoX = startPhotoX + differenceX;
        photoY = startPhotoY + differenceY;

        canvas.style.cursor = "grabbing";
    }

    // User is resizing the photograph
    if (action === "resize") {
        resizeFromHandle(
            activeHandle,
            position.x,
            position.y
        );

        if (
            activeHandle === "topLeft" ||
            activeHandle === "bottomRight"
        ) {
            canvas.style.cursor = "nwse-resize";
        } else {
            canvas.style.cursor = "nesw-resize";
        }
    }

    drawEditor();
});

canvas.addEventListener("pointerleave", function () {
    if (!action) {
        canvas.style.cursor = "default";
    }
});



// KEEP THE ASPECT RATIO WHILE RESIZING

function resizeFromHandle(handle, pointerX, pointerY) {
    let oppositeX;
    let oppositeY;
    let directionX;
    let directionY;

    if (handle === "topLeft") {
        oppositeX = startPhotoX + startPhotoWidth;
        oppositeY = startPhotoY + startPhotoHeight;
        directionX = -1;
        directionY = -1;
    }

    if (handle === "topRight") {
        oppositeX = startPhotoX;
        oppositeY = startPhotoY + startPhotoHeight;
        directionX = 1;
        directionY = -1;
    }

    if (handle === "bottomLeft") {
        oppositeX = startPhotoX + startPhotoWidth;
        oppositeY = startPhotoY;
        directionX = -1;
        directionY = 1;
    }

    if (handle === "bottomRight") {
        oppositeX = startPhotoX;
        oppositeY = startPhotoY;
        directionX = 1;
        directionY = 1;
    }

    const horizontalWidth = Math.abs(pointerX - oppositeX);
    const verticalWidth =
        Math.abs(pointerY - oppositeY) * photoAspectRatio;

    /*
    Use whichever movement produces the larger resize.
    The corresponding height is calculated from the
    original photograph's aspect ratio.
    */
    let newWidth = Math.max(
        horizontalWidth,
        verticalWidth,
        minimumPhotoWidth
    );

    let newHeight = newWidth / photoAspectRatio;

    if (directionX < 0) {
        photoX = oppositeX - newWidth;
    } else {
        photoX = oppositeX;
    }

    if (directionY < 0) {
        photoY = oppositeY - newHeight;
    } else {
        photoY = oppositeY;
    }

    photoWidth = newWidth;
    photoHeight = newHeight;
}


// STOP INTERACTION

function stopInteraction(event) {
    action = null;
    activeHandle = null;

    if (
        event &&
        canvas.hasPointerCapture(event.pointerId)
    ) {
        canvas.releasePointerCapture(event.pointerId);
    }
}

canvas.addEventListener("pointerup", stopInteraction);
canvas.addEventListener("pointercancel", stopInteraction);


// RESET BUTTON

resetButton.addEventListener("click", function () {
    resetPhoto();
});


// DOWNLOAD FINAL IMAGE

downloadButton.addEventListener("click", function () {
    if (!photo) return;

    /*
    Draw the final version without transparency,
    selection rectangle or handles.
    */
    drawComposition(false);

    const link = document.createElement("a");

    link.download = "CMD26-profile-picture.png";
    link.href = canvas.toDataURL("image/png");

    link.click();

    /*
    Restore the editing view directly after preparing
    the downloaded file.
    */
    drawEditor();
});

// COPY LINKEDIN POST TEXT

copyButton.addEventListener("click", async function () {

    const text = shareText.innerText;

    try {
        await navigator.clipboard.writeText(text);

        const originalText = copyButton.innerText;

        copyButton.innerText = "Copied! ✓";

        setTimeout(function () {
            copyButton.innerText = originalText;
        }, 2000);

    } catch (error) {
        console.error("Could not copy text:", error);

        alert(
            "Copy this text manually:\n\n" + text
        );
    }
});

// INITIAL VIEW

drawEditor();
