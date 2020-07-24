include(FindSDL)
Find_Package(SDL REQUIRED)

add_library(helper sdl.cpp)
target_link_libraries(helper ${SDL_LIBRARY})