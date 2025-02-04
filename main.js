const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const sharp = require('sharp');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');
});

ipcMain.handle('get-default-download-path', () => app.getPath('downloads'));

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
    });
    return result.filePaths[0];
});

ipcMain.handle('merge-images', async (event, imageUrls, outputPath, width, height, maintainAspectRatio) => {
    try {
        // Resize all images to match the base dimensions
        const resizedImages = await Promise.all(
            imageUrls.map(async (dataUrl) => {
                const buffer = Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
                return sharp(buffer)
                    .resize(width, height, { fit: maintainAspectRatio ? 'inside' : 'fill' })
                    .toBuffer();
            })
        );

        // Create base canvas for compositing
        const baseCanvas = sharp({
            create: {
                width,
                height,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0 },
            },
        });

        // Composite images on the base canvas
        const outputFilePath = path.join(outputPath, 'merged-image.png');
        await baseCanvas
            .composite(resizedImages.map((buffer) => ({ input: buffer, blend: 'over' })))
            .toFile(outputFilePath);

        return true;
    } catch (error) {
        console.error('Error merging images:', error);
        throw error;
    }
});

