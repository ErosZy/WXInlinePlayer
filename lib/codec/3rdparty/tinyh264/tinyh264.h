#ifndef CODEC_TINYH264_H
#define CODEC_TINYH264_H

extern "C" {
#include "basetype.h"
#include "h264bsd_byte_stream.h"
#include "h264bsd_cavlc.h"
#include "h264bsd_cfg.h"
#include "h264bsd_conceal.h"
#include "h264bsd_container.h"
#include "h264bsd_deblocking.h"
#include "h264bsd_decoder.h"
#include "h264bsd_dpb.h"
#include "h264bsd_image.h"
#include "h264bsd_inter_prediction.h"
#include "h264bsd_intra_prediction.h"
#include "h264bsd_macroblock_layer.h"
#include "h264bsd_nal_unit.h"
#include "h264bsd_neighbour.h"
#include "h264bsd_pic_order_cnt.h"
#include "h264bsd_pic_param_set.h"
#include "h264bsd_reconstruct.h"
#include "h264bsd_sei.h"
#include "h264bsd_seq_param_set.h"
#include "h264bsd_slice_data.h"
#include "h264bsd_slice_group_map.h"
#include "h264bsd_slice_header.h"
#include "h264bsd_storage.h"
#include "h264bsd_stream.h"
#include "h264bsd_transform.h"
#include "h264bsd_util.h"
#include "h264bsd_vlc.h"
#include "h264bsd_vui.h"
};

#endif //CODEC_TINYH264_H
