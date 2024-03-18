const loadImageBitmap = async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const imageBitmap = await createImageBitmap(img);
  return imageBitmap;
};
const getData = (imageBitmap) => {
  const canvas = document.createElement("canvas");
  canvas.width = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0);

  const imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
  return imageData.data;
};
export default class Texture {
  static async from(device, src) {
    const imageBitmap = await loadImageBitmap(src);
    const uint8Array = getData(imageBitmap);
    const texture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    device.queue.writeTexture({ texture }, uint8Array, { bytesPerRow: imageBitmap.width * 4, rowsPerImage: imageBitmap.height }, [imageBitmap.width, imageBitmap.height, 1]);
    return texture;
  }
}
