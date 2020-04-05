# gray-image

简易的灰度化图片的工具

## 引子

今天对于全国同胞来说是个庄严肃穆的日子，是纪念在抗击新冠疫情牺牲的烈士与广大同胞的纪念日，也是中国的四大传统节日「清明节」。
自古以来，清明节就是我们用来纪念先人，缅怀祖先的，20 年这个不平静的年份又赋予了它更伟大的意义。
人类的情感需要寄托，烧纸、扫墓都是与故人交流的方式，国家层面今日降半旗缅怀英烈，对于互联网人员来说，将网页灰度化也是必备的致敬方式之一。
正好，编程群里面大家发了各种灰度化主页的方案，最简单的是采用*css*

```css
body,
html {
  filter: grayscale(1);
}
```

这种方案统一的采用 css 方案，我受到其他一个[小伙伴](http://daijiangtao.name/gray-image/?nsukey=UhKFqU8vcWFGYfhMxXkISdYsMzjq6S1HFvVLEQxs%2B%2F7iRNZpJY56vTEZDKZ91VSmJqWcXipmp0DBntQcwW5lSc1A1A27cxHXE1B792ZHPy7vy2nSqLiLxD4C5ltEFW5qb%2BHwnGKDKeTe%2BT9Uq7kI%2FkNNm6X8AMWAvyxVwEiVNCIvka2Vq%2FkJLGltfWTq4tHluN4FI%2BbbvqYjgajtmAgWiQ%3D%3D)用`js`操作`canvas`的思路的启发，模仿着他的思路把 demo 又重新写了一遍，再次梳理一下这种方案的原理，代码都是基础代码，大同小异，就是很多细节平常不用`canvas`不会去注意这些细节，再次感谢这个小伙伴乐于分享它的demo，大家可以多关注他的[博客](http://daijiangtao.name)。

接下来我只是分享我从它的demo里面学到的知识，与一些自己的心得。

## 具体的实现

主要采用`input`元素与`canvas`操作。

### input[type=file]

主体`html`很简单

```html
<input type="file" id="input" accept=".jpeg,.png,jpg" style="display: none;" />
<canvas id="canvas" style="display: none;"></canvas>
<button id="selectImage">选择需要灰度化的图片</button>
```

采用 button 的点击去调用 input 的点击事件

```javascript
selectImage.addEventListener("click", function () {
  input.click();
});
input.addEventListener("change", callback);
```

当选择完要灰度化的图片之后，进入`callback`回调

```javascript
function () {
  const file = input.files[0]; // 得到图片项
  const imgName = file.name;
  const reader = new FileReader(); // 创建file blob
  reader.readAsDataURL(file);
  reader.onload = function (_file) {
    const image = new Image();
    image.src = _file.target.result;
    image.onload = function () {
      const a = document.createElement("a");
      a.href = gray(image); //最核心的算法，后续着重分析
      a.download = imgName;
      a.setAttribute("id", "downloadGrayImage");
      // 防止重复添加
      if (!document.getElementById("downloadGrayImage")) {
        document.body.appendChild(a);
      }
      a.click();
    };
  };
}
```
到此为止，都是基础的`js`操作本地文件上传，并用`a`标签模拟点击下载的功能。
接下来重点使用`canvas`操作以及基础的灰度算法。
### canvas
[Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/canvas)主要用来构建`2D`图像，基本属性只有`width` `height`,然后使用`HTMLCanvasElement.getContext()`获得上下文来进行绘制。
***
使用`canvas`的主要目的是：可以来获得图像的`像素数据`以及最后处理成渲染图像`所必备的源`。
***
```javascript
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
    //重点来了，逐行遍历上述的像素数组
    //多行代码在下面核心代码分析...

    // 将重新赋值的像素点重新归位到context中
    context.putImageData(imageData, 0, 0, 0, 0, imageData.width, imageData.height);

    // 能变成图片的最重要的一步
    return canvas.toDataURL(); //把当前构造的canvas对象变成img可使用的uri
  } else {
    console.error("抱歉，你的浏览器不支持");
  }
}
```
### 平均像素值灰度化算法
这个是灰度化最简单、最易操作的算法。核心原理就是把每个像素的值取均值。
```
//伪代码
everyPixel = (pixelR + pixelG + pixelB) / 3
```
对于像我一样的没有啥科班知识，并且图像学知识极度匮乏的人来说，先来补一补图像的入门知识。
- 像素个数与宽高的关系
对于一幅图像我们常说`720*480`的图像，说的是宽720个像素，高480个像素，每个像素有**四个值**构成，分别是`R G B A`,具体代表红 绿 蓝 三原色和透明度。
- 像素数据从哪来就显得很关键了。上述的例子我们使用`context.getImageData(0, 0, width, height);`可以得到一个[ImageData](https://developer.mozilla.org/zh-CN/docs/Web/API/ImageData),这是一个极其重要的接口，它包含了图像的所有像素数据，只不过有了这个数据，到目前为止似乎与颜色仍然没有关系，我们仍然无法直接操作。
- 如何操作上述的像素呢？[ImageData.data](https://developer.mozilla.org/zh-CN/docs/Web/API/ImageData/data)是一个只读属性，返回所有像素值转换成的第一步说的四个值后的一维`TypedArray`数组，按照像素点顺序铺开的数组，更具体的来说是[Uint8ClampedArray](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray),不过不需要再深入了。
至此，准备知识结束，对于一幅`720*480`的图像，我们最终会转换成一个`720*480*4=1382400`长度的数组，操作数组对于程序员来说就很容易了。
***
我们完成了一幅具象的图像到抽象的数组的`转变`。
***
- 核心的算法
最基础的写法其实就是双重遍历，外层循环先逐行从上至下按照高度遍历，内层循环再逐列从左至右按照宽度遍历。
```javascript
//重点来了，逐行遍历上述的像素数组
for (let h = 0; h < height; h++) {
  for (let w = 0; w < width; w++) {
    const i = h * 4 * width + w * 4; // 获得每个像素值的四个点位的值，最核心
    const avgPixel = (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3; // 最简单的平均值算法

    // 使用平均化的像素点去重新赋值RGB三个值
    pixelData[i] = avgPixel;
    pixelData[i + 1] = avgPixel;
    pixelData[i + 2] = avgPixel;
  }
}
```
上面的双层遍历很容易看懂，就是中间的那句`const i = h * 4 * width + w * 4;`让我思索了一会，我下面画个草图便于理解这句话。

![分析](https://user-gold-cdn.xitu.io/2020/4/4/17145d028bb2ca4d?w=1921&h=886&f=jpeg&s=72766)

上面的示例图是一个4*4的图
- 其中第一行的第一个像素点`0`由四个值构成{0, 1, 2, 3},第二个像素点由四个值构成{4, 5, 6, 7}，以此类推。上述的公式是首先要确定一个基准点，目前基准点选取的是左边开始的第一个值，也就是`R`值，也就是红色的值的`index`
- 先看公式的第一部分`h * 4 * width`代表的是每一行的左起点的值的index，那么第几行就是h,走几列数据就是`4*width`。
- 公式的第二部分是本行的基准点每次移动的步长，很明显是`w*4`。
- 确定了起始点计算方法后，后续的`G` `B` 的`index`只需要依次累加即可。

***
至此，把一幅图像用最简单的平均值像素法灰度化的方案就完成了，大家可以手打一遍试试，挺好玩的，也就花费3-4个小时，做一个小demo，看似简单其实知识点也不少的。
关于其他的5种灰度算法可以参考[这篇博客](https://github.com/aooy/blog/issues/4)