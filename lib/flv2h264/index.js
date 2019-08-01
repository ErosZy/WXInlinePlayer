const EventEmitter = require('events').EventEmitter;
const isBrowser = require('is-in-browser').default;
const FLVDemux = require('flv-demux');

const UNIT_MASK = Buffer.from([0x00, 0x00, 0x00, 0x01]);

if (isBrowser) {
  window.Buffer = window.Buffer || require('buffer/').Buffer;
}

class FLV2H264 extends EventEmitter {
  constructor() {
    super();
    this.adtsHeader = null;
    this.audioSpecHeader = {};
    this.lengthSizeMinusOne = -1;
    this.demux = new FLVDemux.Decoder();
    this.demux.on('tag', this.tagHandler.bind(this));
  }

  decode(buffer) {
    this.demux.decode(buffer);
  }

  tagHandler(tag) {
    if (tag.type == FLVDemux.DataTag.TYPE) {
      this.emit('mediaInfo', tag.data);
    } else if (tag.type == FLVDemux.AudioTag.TYPE) {
      if (tag.data.AACPacketType == 0) {
        let audioSpecificConfig = tag.data.data;
        let audioObjectType = (audioSpecificConfig[0] & 0xf8) >> 3;
        let samplingFrequencyIndex =
          ((audioSpecificConfig[0] & 0x7) << 1) | (audioSpecificConfig[1] >> 7);
        let channelConfig = (audioSpecificConfig[1] >> 3) & 0x0f;
        let frameLengthFlag = (audioSpecificConfig[1] >> 2) & 0x01;
        let dependsOnCoreCoder = (audioSpecificConfig[1] >> 1) & 0x01;
        let extensionFlag = audioSpecificConfig[1] & 0x01;

        let adtsHeader = Buffer.alloc(7);

        adtsHeader[0] = 0xff; //syncword:0xfff                          高8bits
        adtsHeader[1] = 0xf0; //syncword:0xfff                          低4bits
        adtsHeader[1] |= 0 << 3; //MPEG Version:0 for MPEG-4,1 for MPEG-2  1bit
        adtsHeader[1] |= 0 << 1; //Layer:0                                 2bits
        adtsHeader[1] |= 1; //protection absent:1

        adtsHeader[2] = (audioObjectType - 1) << 6; //profile:audioObjectType - 1                      2bits
        adtsHeader[2] |= (samplingFrequencyIndex & 0x0f) << 2; //sampling frequency index:samplingFrequencyIndex  4bits
        adtsHeader[2] |= 0 << 1; //private bit:0                                      1bit
        adtsHeader[2] |= (channelConfig & 0x04) >> 2; //channel configuration:channelConfig

        adtsHeader[3] = (channelConfig & 0x03) << 6; //channel configuration:channelConfig      低2bits
        adtsHeader[3] |= 0 << 5; //original：0                               1bit
        adtsHeader[3] |= 0 << 4; //home：0                                   1bit
        adtsHeader[3] |= 0 << 3; //copyright id bit：0                       1bit
        adtsHeader[3] |= 0 << 2; //copyright id start：0                     1bit

        let adtsLen = 7;
        adtsHeader[3] |= (adtsLen & 0x1800) >> 11; //frame length：value   高2bits
        adtsHeader[4] = (adtsLen & 0x7f8) >> 3; //frame length:value    中间8bits
        adtsHeader[5] = (adtsLen & 0x7) << 5; //frame length:value    低3bits
        adtsHeader[5] |= 0x1f; //buffer fullness:0x7ff 高5bits
        adtsHeader[6] = 0xfc;

        this.adtsHeader = adtsHeader;
      } else if (tag.data.AACPacketType == 1) {
        let adtsBody = tag.data.data;
        let adtsHeader = new Buffer(this.adtsHeader);
        let adtsLen = adtsBody.byteLength + 7;

        adtsHeader[3] |= (adtsLen & 0x1800) >> 11; //frame length：value   高2bits
        adtsHeader[4] = (adtsLen & 0x7f8) >> 3; //frame length:value    中间8bits
        adtsHeader[5] = (adtsLen & 0x7) << 5; //frame length:value    低3bits
        adtsHeader[5] |= 0x1f; //buffer fullness:0x7ff 高5bits
        adtsHeader[6] = 0xfc;

        let body = Buffer.concat([adtsHeader, adtsBody]);
        this.emit('audio:nalus', {
          type: 'audio',
          size: body.byteLength,
          timestamp: tag.timestamp,
          soundFormat: tag.data.soundFormat,
          soundRate: tag.data.soundRate,
          soundSize: tag.data.soundSize,
          soundType: tag.data.soundType,
          data: body,
          count: 1
        });
      }
    } else if (tag.type == FLVDemux.VideoTag.TYPE) {
      let params = {
        size: tag.size,
        timestamp: tag.timestamp,
        frameType: tag.data.frameType,
        frameType: tag.data.codecId,
        frameType: tag.data.compositionTime
      };

      if (tag.data.AVCPacketType == 0) {
        let unit = tag.data.data;
        let configurationVersion = unit.readUInt8(0);
        let AVCProfileIndication = unit.readUInt8(1);
        let profileCompatibility = unit.readUInt8(2);
        let AVCLevelIndication = unit.readUInt8(3);
        this.lengthSizeMinusOne = (unit.readUInt8(4) & 3) + 1;

        let numOfSequenceParameterSets = unit.readUInt8(5) & 0x1f;
        let sequenceParameterSetLength = unit.readUInt16BE(6);
        let sps = unit.slice(8, 8 + sequenceParameterSetLength);
        let numOfPictureParameterSets = unit.readUInt8(
          8 + sequenceParameterSetLength
        );
        let pictureParameterSetLength = unit.readUInt16BE(
          8 + sequenceParameterSetLength + 1
        );
        let pps = unit.slice(
          8 + sequenceParameterSetLength + 3,
          8 + sequenceParameterSetLength + 3 + pictureParameterSetLength
        );

        this.emit(
          'video:nalus',
          Object.assign(
            {
              type: 'sps',
              count: 1,
              data: Buffer.concat([UNIT_MASK, sps])
            },
            params
          )
        );

        this.emit(
          'video:nalus',
          Object.assign(
            {
              type: 'pps',
              count: 1,
              data: Buffer.concat([UNIT_MASK, pps])
            },
            params
          )
        );
      } else if (tag.data.AVCPacketType == 1) {
        let size = tag.size - 5;
        let unit = tag.data.data;
        let nalus = [];
        while (size) {
          let naluLen = this.readBufferSize(unit, 0);
          let nalu = unit.slice(
            this.lengthSizeMinusOne,
            this.lengthSizeMinusOne + naluLen
          );
          nalus.push(UNIT_MASK, nalu);
          unit = unit.slice(this.lengthSizeMinusOne + naluLen);
          size -= this.lengthSizeMinusOne + naluLen;
        }

        this.emit(
          'video:nalus',
          Object.assign(
            {
              type: 'video',
              count: nalus.length,
              data: Buffer.concat(nalus)
            },
            params
          )
        );
      } else if (tag.data.AVCPacketType == 2) {
        this.emit('video:complete');
      }
    }
  }

  readBufferSize(buffer, offset) {
    let lengthSizeMinusOne = this.lengthSizeMinusOne;
    let results = 0;
    for (let i = 0; i < lengthSizeMinusOne; i++) {
      results |= buffer[offset + i] << ((lengthSizeMinusOne - 1 - i) * 8);
    }

    return results;
  }

  destroy() {
    this.demux.destroy();
    this.demux = null;
    this.removeAllListeners();
  }
}

module.exports = FLV2H264;
