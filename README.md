WXInlinePlayer
------------------

## 0.背景
国内的各个浏览器厂商对于Video都有着各种技术上的限制和管控，例如腾讯系的X5引擎对Video进行了大量的魔改，其中包括：
1. 所谓的同层播放层（？？）
2. 无法正常playsinline
3. 即使静音也无法自动播放
4. 各种播放前后的广告
5. 纯Native组件，无法很好的进行触摸事件交互

## 1.示例
https://qiaozi-tech.github.io/WXInlinePlayer/example/index.html

## 2.兼容性
在BrowserStack中测试，主流系统版本均通过，其余机型请考虑通过降级页面功能进行处理：
1. iOS 9+ (含Safari及Safari WebView)
2. Android 5+（部分4.4.2+的系统浏览器也支持）
3. IE11
4. Chrome 24+
5. Firefox
6. Safari
7. Edge 15+

## 3.优点
1. 整体核心极小（gzip ~110kb)，减少移动端加载与解析时间
2. 性能进行高度优化，稳定使用在线上产品[好惠买](https://h5.haohuimai1.com)中
3. 移动端兼容性良好，不依赖系统/软件平台的魔改播放器，便于产品实现

## 4.限制
1. 目前仅支持FLV（AVC+AAC+baseline）格式，如果是MP4等其他格式请使用ffmpeg进行转码
```shell
ffmpeg -i <your file> -vcodec h264 -acodec aac -profile:v baseline -vf scale=640:-1 mtv.flv
```

2. 目前没有对视频进行流式加载与解析，因此播放1080P会导致大量的内存占用，推荐附加参数：
* 分辨率: -vf scale=-1:360
* fps: -r 25
* 码率：-b:v 1200K

## 5. 起步
```html
<html>
    <head></head>
    <body>
        <div id="container"></div>
        <script src="./dist/index.js"></script>
        <script>
            // 相关特性不支持时需要降级页面功能
            if(WXInlinePlayer && WXInlinePlayer.isSupport()){
                WXInlinePlayer.init({
                    asmUrl: './dist/TinyH264.asm.js',
                    wasmUrl: './dist/TinyH264.wasm.js',
                }).catch(()=>{
                    // 部分浏览器会在解析wasm/asm时失败（但相关特性支持）
                    // 此时同样需要降级页面功能
                });

                WXInlinePlayer.ready().then(()=>{
                    let player = new WXInlinePlayer({
                        url: './sample.flv', // 仅支持flv格式(H264+AAC)
                        $container: document.getElementById('container'),
                        volume: 1.0, // iOS不允许代码调节声量，请注意兼容
                        muted: false, // iOS和Android均支持代码控制静音
                        autoplay: false,
                        loop: false
                    });

                    player.on('load:success', ()=>{
                        player.play();
                    });

                    player.on('load:error', ()=>{
                        console.log('>>>>>>>>>load error');
                    });

                    player.on('play', ()=>{
                        player.volume(0.0); // GET/SET方法
                        player.mute(true); // GET/SET方法
                        player.resume();
                        player.pause();
                        player.stop();
                    });

                    player.on('stop', ()=>{
                        player.destroy();
                        player = null;
                    });
                    
                    // iOS及Chrome高版本禁止声音播放
                    // WXInlinePlayer的音画同步依靠音源的播放时间戳进行对齐
                    // 当音源播放被阻止时会等待250ms后尝试直接绘制画面
                    // 同时触发playtimeout
                    player.on('playtimeout', ()=>{
                        console.log('>>>>>>>>>playtimeout');
                    });
                });
            }
        </script>
    </body>
</html>
```

## 6.TODO
1. 流式解析，提高首帧显示和内存占用情况
2. 进一步提升H264解析性能
3. 支持FLV直播流播放

## 7. 其余问题
* 如何获取播放器的当前进度？

 由于需要考虑到playtimeout的问题，因此API不提供相关的支持。一个简单粗暴的办法是使用setTimeout自己粗略模拟。当然如果仍然想获取相关的数据，可以使用 player.sound.seek() 方法来获取，但请做好返回类型的判断（playtimeout使用此API会返回非Number类型数据）。

 * 为什么在部分低端机器上有音画不同步的情况
  
WXInlinePlayer的音画同步依靠音频时间戳，浏览器目前没有非常底层的方式控制音频buffer，同时由于此实现是CPU软解H264，低端机CPU性能羸弱，解析一帧H264的时间会比较长（大约30-50ms），而音频大部分是24ms左右，因此很容易出现音画不同步的情况。你可以尝试降低视频码率试一试是否有缓解。
