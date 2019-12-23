WXInlinePlayer (Version 1.3 beta)
------------------
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

* [简介](https://github.com/qiaozi-tech/WXInlinePlayer#%E7%AE%80%E4%BB%8B)
* [特性](https://github.com/qiaozi-tech/WXInlinePlayer#%E7%89%B9%E6%80%A7)
* [兼容性](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%85%BC%E5%AE%B9%E6%80%A7)
* [示例](https://github.com/qiaozi-tech/WXInlinePlayer#%E7%A4%BA%E4%BE%8B)
* [如何编译](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E7%BC%96%E8%AF%91)
* [快速开始](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)
* [API](https://github.com/qiaozi-tech/WXInlinePlayer#api)
* [事件](https://github.com/qiaozi-tech/WXInlinePlayer#%E4%BA%8B%E4%BB%B6)
* [初始化参数](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%88%9D%E5%A7%8B%E5%8C%96%E5%8F%82%E6%95%B0)
* [如何选择解码依赖](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9%E8%A7%A3%E7%A0%81%E4%BE%9D%E8%B5%96)
* [如何降低卡顿和延迟](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%99%8D%E4%BD%8E%E5%8D%A1%E9%A1%BF%E5%92%8C%E5%BB%B6%E8%BF%9F)
* [其他问题](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%85%B6%E4%BB%96%E9%97%AE%E9%A2%98)
  * 为什么不对FFmpeg精简后emscripten编译？
  * 为什么有些机器播放点播/直播会频繁卡顿，如何解决？
  * 为什么不对UC浏览器（iOS/Android）进行支持？
  * 如何将现有视频文件转换成WXInlinePlayer可播放的文件？
  * 如何编码H265的FLV？
* [项目计划](https://github.com/qiaozi-tech/WXInlinePlayer#%E9%A1%B9%E7%9B%AE%E8%AE%A1%E5%88%92)
* [已知使用的产品](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%B7%B2%E7%9F%A5%E4%BD%BF%E7%94%A8%E7%9A%84%E4%BA%A7%E5%93%81)
* [QQ技术支持群](https://github.com/qiaozi-tech/WXInlinePlayer#qq%E6%8A%80%E6%9C%AF%E6%94%AF%E6%8C%81%E7%BE%A4)

## 简介

随着直播和短视频的兴起，视频由于承担了更大的信息量，因此现在已经是非常主流的运营/产品信息输出方式。但由于国内各个浏览器厂商自身的利益关系所在，他们对HTML5的Video能力做了非常多的限制，不限于：
1. 禁止自动播放
2. 播放器魔改为原生播放器，层级最高，不可进行HTML相关元素层叠
3. 播放前后硬插广告内容
4. 视频自动置顶
5. 相关API和事件实现不统一
6. ......

其具体问题可以参考腾讯IMWeb团队编写的[《复杂帧动画之移动端Video采坑实现》](https://juejin.im/post/5d513623e51d453b72147600)。

为了解决这些问题，我们通过软解FLV的方式实现了WXInlinePlayer，其用的第三方技术和平台API如下：
1. [OpenH264](https://github.com/cisco/openh264)/[TinyH264](https://github.com/udevbe/tinyh264)/[de265](https://github.com/strukturag/libde265)；
2. [emscripten](https://github.com/emscripten-core/emscripten)
3. [WebGL](https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL_API)
4. [Web Audio Api](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API)

同时我们也编写了WebAssembly版本的FLV Demuxer，你可以在[lib/codec](https://github.com/qiaozi-tech/WXInlinePlayer/tree/master/lib/codec)找到相关代码。

## 特性

1. FLV  H264/H265 点播/直播全支持
2. 自由选择解码依赖，在实际gzip中，Tinyh264只需 ~180k，OpenH264 ~260k，de265 ~210k （[如何选择解码依赖](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9%E8%A7%A3%E7%A0%81%E4%BE%9D%E8%B5%96)）
3. 专为移动端性能优化，内存和CPU占用稳定
4. 直播延迟优化，比MSE的原生Video实现低1-2s（[如何降低卡顿和延迟](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%99%8D%E4%BD%8E%E5%8D%A1%E9%A1%BF%E5%92%8C%E5%BB%B6%E8%BF%9F)）
5. 音频/视频独立支持
6. 微信WebView自动播放
7. 无音频动画自动播放
8. 良好的移动端WebView兼容性

## 兼容性
兼容测试使用BrowserStack服务提供的相关机型，仅供参考：
* Android 5+
* iOS 10+ （含Safari及WebView）
* Chrome 25+
* Firefox 57+
* Edge 15+
* Safari 10.1+

## 示例
> https://qiaozi-tech.github.io/WXInlinePlayer/example/index.html

## 如何编译

请确保你安装过[parcel](https://parceljs.org/) / [emscripten](https://github.com/emscripten-core/emscripten) / [cmake](https://cmake.org/) 以及 [make](http://www.gnu.org/software/make/)，然后直接执行build.sh文件即可：
```shell
bash build.sh
```
最终产物会在example文件夹中。

> 请注意：请在*nix环境下进行build，并不保证Windows下的OpenH264的编译

## 快速开始
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>WXInlinePlayer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
    }

    html,
    body {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <canvas id="container" width="800" height="450"></canvas>
  <script src="./index.js"></script>
  <script>
    if (WXInlinePlayer.isSupport()) {
      WXInlinePlayer.init({
        asmUrl: './prod.baseline.asm.combine.js',
        wasmUrl: './prod.baseline.wasm.combine.js'
      });

      WXInlinePlayer.ready().then(() => {
        const player = new WXInlinePlayer({
          url: 'https://static.petera.cn/mm.flv',
          $container: document.getElementById('container'),
          hasVideo: true,
          hasAudio: true,
          volume: 1.0,
          muted: false,
          autoplay: true,
          loop: true,
          isLive: false,
          chunkSize: 128 * 1024,
          preloadTime: 5e2,
          bufferingTime: 1e3,
          cacheSegmentCount: 64,
          customLoader: null
        });

        const { userAgent } = navigator;
        const isWeChat = /MicroMessenger/i.test(userAgent);
        if (!isWeChat) {
          alert('click to play!');
          document.body.addEventListener('click', () => {
            player.play();
          });
        }
      });
    }
  </script>
</body>
</html>
```

## API

### Boolean WXInlinePlayer.isSupport(void)

当前执行环境是否支持WXInlinePlayer。
```javascript
if(WXInlinePlayer.isSupport()){
  console.log('WXInlinePlayer support');
}
```

### Promise WXInlinePlayer.init(Object)

初始化WXInlinePlayer，需要传入加载的H264解码库的具体地址，关于解码库的选择，请参考：[如何选择解码依赖](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%80%89%E6%8B%A9%E8%A7%A3%E7%A0%81%E4%BE%9D%E8%B5%96)。
```javascript
if(WXInlinePlayer.isSupport()){
  WXInlinePlayer.init({
    asmUrl: './prod.baseline.asm.combine.js',
    wasmUrl: './prod.baseline.wasm.combine.js'
  }).catch(e=>{
    console.log(`WXInlinePlayer init error: ${e}`);
  });
}
```

### Promise WXInlinePlayer.ready(void)

WXInlinePlayer已经准备就绪，可以安全的进行初始化操作。

```javascript
if(WXInlinePlayer.isSupport()){
  WXInlinePlayer.init({/*.....*/});
  WXInlinePlayer.ready().then(()=>{
    console.log('WXInlinePlayer ready');
  });
}
```

### WXInlinePlayerInstance WXInlinePlayer(Object)

WXInlinePlayer构造函数，相关初始化参数请参考：[初始化参数](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%88%9D%E5%A7%8B%E5%8C%96%E5%8F%82%E6%95%B0)。

```javascript
WXInlinePlayer.ready().then(()=>{
  const player = new WXInlinePlayer({/*...*/});
});
```

### void WXInlinePlayerInstance.play(void)

进行视频播放。需要注意的是由于浏览器限制（不包含微信及Chrome 66版本以下），高版本已经禁用了音频自动播放，因此直接调用此方法可能并不会有作用，请在click/touchstart/touchend/touchmove等事件中让用户主动触发。

```javascript
const player = new WXInlinePlayer({/*...*/});
document.body.addEventListener('click', ()=>{
  player.play();
});
```

### void WXInlinePlayerInstance.stop(void)

停止整个播放器，不可被恢复(resume)。

```javascript
const player = new WXInlinePlayer({/*...*/});
player.stop();
```

### void WXInlinePlayerInstance.pause(void)

暂停当前播放。

```javascript
const player = new WXInlinePlayer({/*...*/});
player.pause();
```

### void WXInlinePlayerInstance.resume(void)

恢复由pause引起的暂停操作。

```javascript
const player = new WXInlinePlayer({/*...*/});
player.resume();
```

### Number|void WXInlinePlayerInstance.volume(Number|void)

获取/设置当前音量。
```javascript
const player = new WXInlinePlayer({/*...*/});
const volume = player.volume(); // get volume
player.volume(volume); // set volume
```

### Boolean|void WXInlinePlayerInstance.mute(Boolean|void)

获取/设置静音状态。
```javascript
const player = new WXInlinePlayer({/*...*/});
const muted = player.mute(); // get mute
player.mute(muted); // set mute
```

### void WXInlinePlayerInstance.destroy(void)

销毁播放器，释放所有内存等待回收。
```javascript
const player = new WXInlinePlayer({/*...*/});
player.destroy();
```

### Number WXInlinePlayerInstance.getCurrentTime(void)

获取当前播放时间，请注意，可能出现负值的情况请注意处理。
```javascript
const player = new WXInlinePlayer({/*...*/});
player.on('timeUpdate', ()=>{
  let currentTime = player.getCurrentTime();
  currentTime = currentTime <= 0 ? 0 : currentTime;
});
```

### Number WXInlinePlayerInstance.getAvaiableDuration(void)

可播放时长，可理解为缓冲的时长。
```javascript
const player = new WXInlinePlayer({/*...*/});
player.on('timeUpdate', ()=>{
  const duration = player.getAvaiableDuration();
});
```

## 事件

* mediaInfo(Object) - 视频相关信息，例如width/height/fps/framerate等
* playing(void) - 开始/正在播放
* buffering(void) - 内部帧数据不足，开始缓冲
* stopped(void) - 停止播放
* end(void) - 播放结束
* timeUpdate(currentTime:Number) - 当前播放的进度，250ms进行一次触发
* loadError({status:Number, statusText:String, detail:Object}) - 加载失败
* loadSuccess(void) - 加载成功
* performance({averageDecodeCost:Number, averageUnitDuration:Number}) - 编码性能检测事件，averageDecodeCost代表平均的解码消耗的时长，averageUnitDuration代表在averageDecodeCost下解码得到的可播放单元时长

## 初始化参数
```javascript
{
  url: String, // 播放地址，仅支持flv
  $container: DomElement, // 绘制的canvas对象
  hasVideo: Boolean, // 是否含有视频，默认true
  hasAudio: Boolean, // 是否含有音频，默认true
  volume: Number, // 音量，范围0~1，默认1.0
  muted: Boolean, // 是否静音，默认false
  autoplay: Boolean, // 是否自动播放，微信WebView/无音频视频设置此参数有效
  loop: Boolean, // 循环播放，默认false，请注意处理Safari及其WebView（不包含微信）每次播放都需要人主动触发的限制
  isLive: Boolean, // 是否是直播流，默认false
  chunkSize: Number, // 加载/解析块大小，默认256 * 1024
  preloadTime: Number, // 预加载时间，默认1000ms
  bufferingTime: Number, // 缓冲时间，默认3000ms
  cacheSegmentCount: Number, // 内部最大的缓存帧数量，默认256
  customLoader: LoaderImpl, // 自定义loader，请参考src/loader/chunk(stream)代码
}
```

## 如何选择解码依赖

目前有3套解码库，分别是：
* prod.baseline.asm.combine / prod.baseline.wasm.combine
* prod.all.asm.combine / prod.all.wasm.combine
* prod.h265.asm.combine / prod.h265.wasm.combine

其区别在于：
1. baseline文件大小更小（gzip后相比all小80k），但是只支持baseline的profile
2. all的profile支持更完整（baseline/main/high），并且性能相比于baseline更好
2. h265主要支持h265的flv流，此实现拓展了FLV格式，参考了金山的拓展要求，如有此需求请参考[金山的FLV拓展规范](https://github.com/ksvc/FFmpeg/wiki)

我们推荐当你播放广告视频/营销视频/小动画视频等对依赖库大小敏感的时候使用baseline.asm/baseline.wasm，而在播放点播视频/直播视频时等对依赖库大小不敏感的时候使用all.asm/all.wasm。

## 如何降低卡顿和延迟

WXInlinePlayer的卡顿和延迟主要来自于3个地方：
* 网络加载的延迟
* 软解码的延迟
* 渲染的延迟

一般来说，如果在用户网络环境较好的情况下，渲染由于使用了WebGL，很难造成瓶颈（操作很单一），其中一般会因为软解码性能不足造成不停卡顿及延迟。

优化因为软解码性能不足造成的延迟，我们一般从几个地方着手：
1. 视频的profile：相比于main/high而言，baseline不包含B帧，解码消耗更低
2. 视频帧率：过高的帧率会造成软解码跟不上，可以试着降低帧率，例如24fps
3. 视频码率：码率越高，视频富含的细节越多，也越清晰，但是会消耗更多的解码性能，可以试着降低码率
4. 视频分辨率：过高的视频会造成单帧传递的数量极大

目前WXInlinePlayer在中高端机上解1280x720，码率1024，帧率24fps的视频比较流畅。

关于以上提到的视频参数你可以通过FFmpeg查看：
```shell
ffmpeg -i "your.flv"
```

在这里我们给出主流平台的profile/帧率/码率/分辨率供参考：

平台 | 类型 | 清晰度 | profile | 帧率 | 码率 | 分辨率
 -|-|-|-|-|-|-
虎牙|横屏|标清|High|24|500k|800x450
虎牙|横屏|高清|High|24|1200k|1280x720
虎牙|竖屏|高清|Main|16|1280k|540x960
奇秀|竖屏|标清|High|15|307k|204x360
奇秀|竖屏|高清|High|15|512k|304x540
奇秀|竖屏|超清|Baseline|15|1440k|720x1280
抖音|竖屏|默认|High|30|1600k（变化较多，仅供参考）|720x1280
快手|竖屏|默认|High|25|2880k（变化较多，仅供参考）|720x1280

我们建议你：
1. 如果你想能够覆盖更多的机型，那么奇秀标清或是高清的配置适合你
2. 如果你想只支持Android中高端机和iPhone6+，那么虎牙高清的配置适合你

WXInlinePlayer的我们常用的低延迟配置参数如下，仅供参考，实际请根据你的直播流/点播文件配置调整：
```javascript
{
  chunkSize: 128 * 1024,
  preloadTime: 5e2,
  bufferingTime: 1e3,
  cacheSegmentCount: 64,
}
```

同时，你可以使用**performance事件**来判断当前的解码性能，然后提示用户并降级到你的后备方案（例如直接video播放/静态图/序列帧等）：
```javascript
player.on('performance', ({averageDecodeCost, averageUnitDuration})=>{
  const prop = averageUnitDuration / averageDecodeCost;
  if(prop >= 2.0){
    console.log('good performance');
  }else if(prop < 2.0 && prop >= 1.0){
    console.log('ok, thats fine');
  }else{
    console.log('bad performance');
  }
});
```

## 其他问题
1. **为什么不对FFmpeg精简后emscripten编译？**

FFmpeg方案目前有几个比较大的问题，第一个是解码库的大小，精简后2M左右，gzip大约600k，这对于在意依赖库大小的产品是不可接受的。其次FFmpeg的方案难以被自己优化，比如WXInlinePlayer在2.0时会做多Worker的解码，这对于此类方案的修改成本是非常大的。

2. **为什么有些机器播放点播/直播会频繁卡顿，如何解决？**

卡顿和延迟的原因比较复杂，对于WXInlinePlayer来说一般情况是解码速度跟不上播放速度，请参考[如何降低卡顿和延迟](https://github.com/qiaozi-tech/WXInlinePlayer#%E5%A6%82%E4%BD%95%E9%99%8D%E4%BD%8E%E5%8D%A1%E9%A1%BF%E5%92%8C%E5%BB%B6%E8%BF%9F)进行优化。

3. **为什么不对UC浏览器（iOS/Android）进行支持？**

UC不管是iOS还是Android都对WebAssembly/ASM.js进行了阉割，因此索性不支持了。

4. **如何将现有视频文件转换成WXInlinePlayer可播放的文件？**

请使用FFmpeg或是其他类似的工具，这里给出一个简单的命令示例：
```shell
ffmpeg -i "your.mp4" -vcodec libx264 -acodec aac out.flv
```

5. **如何将现有视频文件转换成WXInlinePlayer可播放的文件？**

WXInlinePlayer的FLV规范遵循[金山的FLV拓展规范](https://github.com/ksvc/FFmpeg/wiki)，如果需要进行相关的编码，可以参考其相关的[FFmpeg patch](https://github.com/ksvc/FFmpeg/wiki/instructions)或者[金山编写的编码器](https://github.com/ksvc/ks265codec)。

## 项目计划
1. <del>V1.1 支持HTTP-FLV及流式解码</del>
2. <del>V1.1 支持音视频独立播放</del>
3. <del>V1.2 降低直播流延迟</del>
4. <del>V1.3 增加H265支持</del>
5. V1.4
   * 提供默认的播放器UI
   * <del>SharedArrayBuffer支持，减少内存占用和CPU的拷贝性能消耗</del>
   * 增加OffscreenCanvas的支持，提升性能和减少内存占用（Chrome 69+）
6. V1.5
   * 重构解码器，精确缓存帧数据
   * 增加首帧逻辑
   * 增加poster参数
7. V1.6 支持FLV Seek操作
8. V2.0 支持多Worker的GOP并行解码，提升软解性能

## 已知使用的产品

* [好惠买](http://h5.haohuimai1.com/)
* [兔几直播](https://www.tuji.com/)

## QQ技术支持群
![QQ群](./images/qq.jpeg "QQ群")
