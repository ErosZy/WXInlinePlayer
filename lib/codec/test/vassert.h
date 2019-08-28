#ifndef CODEC_VASSERT_H
#define CODEC_VASSERT_H

#include <iostream>
#include <cassert>
#include <cstring>

#define VASSERT(a, b) if((a)) { \
        if (strlen((b)) != 0) { \
            std::cout << "  " << "\033[32m " << (b) << " -- success \033[0m" << std::endl; \
        } \
        assert(true); \
    } else { \
        if (strlen((b)) != 0) { \
            std::cout << "  " << "\033[31m " << (b) << " -- faild \033[0m" << std::endl; \
        } \
        assert(false); \
    } \

#endif //CODEC_VASSERT_H
