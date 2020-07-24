add_library(demuxer
        vars.cpp
        audio_tag.cpp
        video_tag.cpp
        data_tag.cpp
        tag.cpp
        header.cpp
        body.cpp
        decoder.cpp
        )

target_link_libraries(demuxer stream)