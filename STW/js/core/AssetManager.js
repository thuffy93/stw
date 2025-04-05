export const AssetManager = (() => {
    const assets = new Map();
    let successCount = 0;
    let errorCount = 0;
    let totalAssets = 0;
    let callback = null;

    // Add initialize method
    function initialize() {
        console.log("Initializing AssetManager");
        assets.clear(); // Reset assets map
        successCount = 0;
        errorCount = 0;
        totalAssets = 0;
        callback = null;
        return true; // Indicate successful initialization
    }

    function queue(key, data, type = 'data') {
        if (assets.has(key)) {
            console.warn(`Asset already queued: ${key}`);
            return;
        }
        assets.set(key, { data, type, asset: null, retries: 0, maxRetries: 3 });
        totalAssets++;
        console.log(`Queued asset: ${key} (${type})`);
    }

    function loadAsset(key) {
        const assetData = assets.get(key);
        if (!assetData) return;

        const { data, type } = assetData;

        if (type === 'data') {
            assetData.asset = data;
            onLoadSuccess(key, data);
        } else if (type === 'json') {
            fetch(data)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(data => onLoadSuccess(key, data))
                .catch(error => onLoadError(key, error));
        } else if (type === 'image') {
            const img = new Image();
            img.onload = () => onLoadSuccess(key, img);
            img.onerror = () => onLoadError(key, new Error(`Image load failed: ${data}`));
            img.src = data;
            assetData.asset = img;
        }
    }

    function onLoadSuccess(key, asset) {
        const assetData = assets.get(key);
        assetData.asset = asset;
        successCount++;
        console.log(`Loaded ${key}: ${successCount}/${totalAssets}`);
        checkCompletion();
    }

    function onLoadError(key, error) {
        const assetData = assets.get(key);
        assetData.retries++;
        console.warn(`Error loading ${key} (attempt ${assetData.retries}/${assetData.maxRetries}): ${error.message}`);

        if (assetData.retries < assetData.maxRetries) {
            setTimeout(() => loadAsset(key), 500 * assetData.retries);
        } else {
            errorCount++;
            console.error(`Failed to load ${key} after ${assetData.maxRetries} attempts`);
            checkCompletion();
        }
    }

    function checkCompletion() {
        if (successCount + errorCount === totalAssets && callback) {
            const success = errorCount === 0;
            callback(success, getLoadedAssets());
        }
    }

    function downloadAll(cb) {
        if (totalAssets === 0) {
            console.log("No assets to load");
            cb(true, {});
            return;
        }
        callback = cb;
        successCount = 0;
        errorCount = 0;
        assets.forEach((_, key) => loadAsset(key));
    }

    function getLoadedAssets() {
        const loaded = {};
        assets.forEach((data, key) => {
            if (data.asset) loaded[key] = data.asset;
        });
        return loaded;
    }

    function isDone() {
        return successCount === totalAssets && errorCount === 0;
    }

    function clear() {
        assets.clear();
        successCount = 0;
        errorCount = 0;
        totalAssets = 0;
        callback = null;
    }

    return {
        initialize, // Add to public interface
        queue,
        downloadAll,
        getLoadedAssets,
        isDone,
        clear
    };
})();