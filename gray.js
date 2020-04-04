/**
 * 灰度化图片
 * @param { object} imgObj 要操作的图像元素
 */
function gray(imgObj) {
  const width = imgObj.width;
  const height = imgObj.height;

  const canvas = document.querySelector("canvas");
  if (canvas.getContext) {
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    context.drawImage(imgObj, 0, 0); //画一个图
    // 获得隐含区域的像素数据, 返回ImageData 对象，其中的data属性包含了所需的数据
    const imageData = context.getImageData(0, 0, width, height);
    let pixelData = imageData.data;
    console.log("pixelData", pixelData);

    //重点来了，逐行遍历上述的像素数组
    for (let h = 0; h < height; h++) {
      for (let w = 0; w < width; w++) {
        const i = h * 4 * width + w * 4;
        const avgPixel =
          (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3; // 最简单的平均值算法

        // 使用平均化的像素点去重新复制RGB三个值
        pixelData[i] = avgPixel;
        pixelData[i + 1] = avgPixel;
        pixelData[i + 2] = avgPixel;
      }
    }

    // 将重新赋值的像素点重新归位到context中
    context.putImageData(
      imageData,
      0,
      0,
      0,
      0,
      imageData.width,
      imageData.height
    );

    // 能变成图片的最重要的一步
    return canvas.toDataURL(); //把当前构造的canvas对象变成img可使用的uri
  } else {
    console.error("抱歉，你的浏览器不支持");
  }
}
