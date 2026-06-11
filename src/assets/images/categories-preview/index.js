const imagesContext = require.context('./', false, /\.png$/);

const categoriesImages = {};
imagesContext.keys().forEach((key) => {
    const name = key.replace('./', '').replace('.png', '');
    categoriesImages[name] = imagesContext(key);
});

export default categoriesImages;