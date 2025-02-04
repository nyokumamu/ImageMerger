const fileInput = document.getElementById('file-input');
const imageList = document.getElementById('image-list');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
const exportBtn = document.getElementById('export-btn');
const widthInput = document.getElementById('width-input');
const heightInput = document.getElementById('height-input');
const aspectRatioCheckbox = document.getElementById('maintain-aspect-ratio');
const outputPathInput = document.getElementById('output-path-input');
const selectDirectoryBtn = document.getElementById('select-directory-btn');

let images = [];
let baseWidth = 800;
let baseHeight = 600;

// Set default output directory to Downloads folder
window.api.getDefaultDownloadPath().then((defaultPath) => {
    outputPathInput.value = defaultPath;
});

// Handle file uploads
fileInput.addEventListener('change', (event) => handleFiles(event.target.files));

// Drag-and-drop file upload
document.querySelector('.file-list-container').addEventListener('dragover', (event) => event.preventDefault());
document.querySelector('.file-list-container').addEventListener('drop', (event) => {
    event.preventDefault();
    if (event.dataTransfer.files) handleFiles(event.dataTransfer.files);
});

function handleFiles(files) {
    Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                if (images.length === 0) setFormSize(img.width, img.height);
                images.push({ name: file.name, dataUrl: e.target.result });
                updateUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateUI() {
    updateImageList();
    updatePreview();
}

function updateImageList() {
    imageList.innerHTML = '';
    images.forEach((image, index) => {
        const li = document.createElement('li');
        li.classList.add('draggable');
        li.draggable = true;

        const dragIcon = document.createElement('span');
        dragIcon.textContent = '☰';
        dragIcon.classList.add('drag-icon');

        const fileName = document.createElement('span');
        fileName.textContent = image.name;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            images.splice(index, 1);
            if (images.length > 0) setFormSizeFromFirstImage();
            updateUI();
        });

        li.appendChild(dragIcon);
        li.appendChild(fileName);
        li.appendChild(deleteButton);
        imageList.appendChild(li);

        li.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', index));
        li.addEventListener('drop', (event) => {
            event.preventDefault();
            const draggedIndex = event.dataTransfer.getData('text/plain');
            if (draggedIndex !== index) {
                const [draggedItem] = images.splice(draggedIndex, 1);
                images.splice(index, 0, draggedItem);
                updateUI();
            }
        });
    });
}

function updatePreview() {
    if (images.length === 0) return ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = baseWidth;
    canvas.height = baseHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    images.forEach((image) => {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = image.dataUrl;
    });
}

function setFormSize(width, height) {
    widthInput.value = width;
    heightInput.value = height;
    baseWidth = width;
    baseHeight = height;
}

function setFormSizeFromFirstImage() {
    const img = new Image();
    img.onload = () => setFormSize(img.width, img.height);
    img.src = images[0].dataUrl;
}

// Select output directory
selectDirectoryBtn.addEventListener('click', async () => {
    const selectedPath = await window.api.selectDirectory();
    if (selectedPath) outputPathInput.value = selectedPath;
});

// Export images
exportBtn.addEventListener('click', () => {
    const outputWidth = parseInt(widthInput.value, 10);
    const outputHeight = parseInt(heightInput.value, 10);
    const maintainAspectRatio = aspectRatioCheckbox.checked;
    const outputPath = outputPathInput.value;

    window.api.mergeImages(
        images.map((img) => img.dataUrl),
        outputPath,
        outputWidth,
        outputHeight,
        maintainAspectRatio
    )
    .then(() => alert('Image successfully exported!'))
    .catch(() => alert('Failed to export image.'));
});

