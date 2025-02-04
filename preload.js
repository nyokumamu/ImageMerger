const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    mergeImages: (imageUrls, outputPath, width, height, maintainAspectRatio) => 
        ipcRenderer.invoke('merge-images', imageUrls, outputPath, width, height, maintainAspectRatio),
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
});

